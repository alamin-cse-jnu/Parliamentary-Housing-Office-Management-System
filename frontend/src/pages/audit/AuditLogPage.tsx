import { useState, useEffect, useCallback } from "react";
import {
  Card, Table, Select, DatePicker, Button, Row, Col,
  Tag, Typography, Space, Tooltip, Modal, Descriptions,
} from "antd";
import { ReloadOutlined, EyeOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import api from "../../services/api";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface AuditRow {
  id: number;
  table_name: string;
  record_id: string;
  action: "INSERT" | "UPDATE" | "DELETE";
  old_value: object | null;
  new_value: object | null;
  changed_at: string;
  ip_address: string | null;
  user: { id: number; username: string; full_name_en: string; role: string };
}

interface AuditResult {
  total: number;
  page: number;
  limit: number;
  data: AuditRow[];
}

interface SystemUser {
  id: number;
  username: string;
  full_name_en: string;
}

const ACTION_COLOR: Record<string, string> = {
  INSERT: "green",
  UPDATE: "blue",
  DELETE: "red",
};

export function AuditLogPage() {
  const { t } = useTranslation();

  const [result, setResult] = useState<AuditResult>({ total: 0, page: 1, limit: 50, data: [] });
  const [loading, setLoading] = useState(false);
  const [tables, setTables] = useState<string[]>([]);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [detail, setDetail] = useState<AuditRow | null>(null);

  const [filters, setFilters] = useState<{
    table_name?: string;
    changed_by?: number;
    action?: string;
    from?: string;
    to?: string;
    page: number;
    limit: number;
  }>({ page: 1, limit: 50 });

  const fetchLogs = useCallback(async (f = filters) => {
    setLoading(true);
    try {
      const params: Record<string, any> = { ...f };
      Object.keys(params).forEach((k) => params[k] === undefined && delete params[k]);
      const res = await api.get<AuditResult>("/audit", { params });
      setResult(res.data);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLogs();
    api.get<string[]>("/audit/tables").then((r) => setTables(r.data)).catch(() => {});
    api.get<SystemUser[]>("/users").then((r) => setUsers(r.data)).catch(() => {});
  }, []);

  function applyFilters(overrides: Partial<typeof filters> = {}) {
    const next = { ...filters, page: 1, ...overrides };
    setFilters(next);
    fetchLogs(next);
  }

  const columns: ColumnsType<AuditRow> = [
    {
      title: "Time",
      dataIndex: "changed_at",
      width: 160,
      render: (v: string) => dayjs(v).format("DD/MM/YYYY HH:mm:ss"),
    },
    {
      title: t("actions"),
      dataIndex: "action",
      width: 90,
      render: (v: string) => <Tag color={ACTION_COLOR[v]}>{v}</Tag>,
    },
    {
      title: "Table",
      dataIndex: "table_name",
      width: 160,
      render: (v: string) => <Text code style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: "Record ID",
      dataIndex: "record_id",
      width: 90,
      align: "center",
    },
    {
      title: "User",
      dataIndex: "user",
      width: 160,
      render: (u: AuditRow["user"]) =>
        u ? (
          <Space direction="vertical" size={0}>
            <Text style={{ fontSize: 12 }}>{u.full_name_en}</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>@{u.username}</Text>
          </Space>
        ) : "—",
    },
    {
      title: "IP",
      dataIndex: "ip_address",
      width: 130,
      render: (v: string | null) => <Text type="secondary" style={{ fontSize: 12 }}>{v ?? "—"}</Text>,
    },
    {
      title: "",
      key: "view",
      width: 50,
      align: "center",
      render: (_: unknown, row: AuditRow) => (
        <Tooltip title="View details">
          <Button
            size="small"
            icon={<EyeOutlined />}
            type="text"
            onClick={() => setDetail(row)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16, color: "#1a4b8c" }}>
        {t("audit_log")}
      </Title>

      {/* Filters */}
      <Card bordered={false} style={{ marginBottom: 16, borderRadius: 8 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Select
              allowClear
              placeholder="Table"
              style={{ width: "100%" }}
              onChange={(v) => applyFilters({ table_name: v })}
            >
              {tables.map((t) => <Option key={t} value={t}>{t}</Option>)}
            </Select>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Select
              allowClear
              placeholder="Action"
              style={{ width: "100%" }}
              onChange={(v) => applyFilters({ action: v })}
            >
              {["INSERT", "UPDATE", "DELETE"].map((a) => (
                <Option key={a} value={a}>
                  <Tag color={ACTION_COLOR[a]}>{a}</Tag>
                </Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Select
              allowClear
              placeholder={t("users")}
              style={{ width: "100%" }}
              onChange={(v) => applyFilters({ changed_by: v })}
            >
              {users.map((u) => (
                <Option key={u.id} value={u.id}>{u.full_name_en} (@{u.username})</Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <RangePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              onChange={(_, strs) =>
                applyFilters({
                  from: strs[0] ? dayjs(strs[0], "DD/MM/YYYY").format("YYYY-MM-DD") : undefined,
                  to:   strs[1] ? dayjs(strs[1], "DD/MM/YYYY").format("YYYY-MM-DD") : undefined,
                })
              }
            />
          </Col>

          <Col>
            <Button icon={<ReloadOutlined />} onClick={() => applyFilters()}>
              Refresh
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card bordered={false} style={{ borderRadius: 8 }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={result.data}
          loading={loading}
          size="small"
          pagination={{
            current:  result.page,
            pageSize: result.limit,
            total:    result.total,
            showSizeChanger: true,
            pageSizeOptions: ["25", "50", "100"],
            showTotal: (total) => `${total} records`,
            onChange: (page, limit) => applyFilters({ page, limit }),
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* Detail modal */}
      <Modal
        open={!!detail}
        onCancel={() => setDetail(null)}
        footer={null}
        title={detail ? `${detail.action} — ${detail.table_name} #${detail.record_id}` : ""}
        width={700}
      >
        {detail && (
          <div>
            <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Action">
                <Tag color={ACTION_COLOR[detail.action]}>{detail.action}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Table">
                <Text code>{detail.table_name}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Record ID">{detail.record_id}</Descriptions.Item>
              <Descriptions.Item label="Time">
                {dayjs(detail.changed_at).format("DD/MM/YYYY HH:mm:ss")}
              </Descriptions.Item>
              <Descriptions.Item label="User">
                {detail.user?.full_name_en} (@{detail.user?.username})
              </Descriptions.Item>
              <Descriptions.Item label="IP">{detail.ip_address ?? "—"}</Descriptions.Item>
            </Descriptions>

            {detail.old_value && (
              <>
                <Text strong>Before:</Text>
                <pre style={{
                  background: "#fff1f0", borderRadius: 6, padding: 12,
                  fontSize: 12, overflow: "auto", maxHeight: 200,
                }}>
                  {JSON.stringify(detail.old_value, null, 2)}
                </pre>
              </>
            )}
            {detail.new_value && (
              <>
                <Text strong>After:</Text>
                <pre style={{
                  background: "#f6ffed", borderRadius: 6, padding: 12,
                  fontSize: 12, overflow: "auto", maxHeight: 200,
                }}>
                  {JSON.stringify(detail.new_value, null, 2)}
                </pre>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
