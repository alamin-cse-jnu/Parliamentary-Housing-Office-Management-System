import { useState, useEffect } from "react";
import {
  Card, Table, Tag, Typography, Select, Button, Modal,
  Descriptions, Progress, Space, Badge,
} from "antd";
import { EyeOutlined, ReloadOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import api from "../../services/api";

const { Title, Text } = Typography;
const { Option } = Select;

interface UploadLogRow {
  id: number;
  row_number: number;
  status: "success" | "error";
  message: string | null;
  row_data: object | null;
}

interface UploadLog {
  id: number;
  upload_type: string;
  original_filename: string;
  total_rows: number;
  success_rows: number;
  error_rows: number;
  uploaded_at: string;
  uploaded_by_user: { id: number; username: string; full_name_en: string };
  rows?: UploadLogRow[];
}

interface PageResult {
  total: number;
  page: number;
  limit: number;
  data: UploadLog[];
}

export function UploadHistoryPage() {
  const { t } = useTranslation();
  const [result, setResult]   = useState<PageResult>({ total: 0, page: 1, limit: 20, data: [] });
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [page, setPage]       = useState(1);
  const [detail, setDetail]           = useState<UploadLog | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  async function load(p = page, type = typeFilter) {
    setLoading(true);
    try {
      const params: Record<string, any> = { page: p, limit: 20 };
      if (type) params.upload_type = type;
      const res = await api.get<PageResult>("/upload-logs", { params });
      setResult(res.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function openDetail(id: number) {
    setDetailLoading(true);
    setDetail({} as UploadLog);
    try {
      const res = await api.get<UploadLog>(`/upload-logs/${id}`);
      setDetail(res.data);
    } finally {
      setDetailLoading(false);
    }
  }

  const columns: ColumnsType<UploadLog> = [
    {
      title: "Date",
      dataIndex: "uploaded_at",
      width: 160,
      render: (v: string) => dayjs(v).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Type",
      dataIndex: "upload_type",
      width: 100,
      render: (v: string) => <Tag color={v === "MP" ? "blue" : "green"}>{v}</Tag>,
    },
    {
      title: "File",
      dataIndex: "original_filename",
      render: (v: string) => <Text style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: "Total",
      dataIndex: "total_rows",
      width: 70,
      align: "center",
    },
    {
      title: "Success",
      dataIndex: "success_rows",
      width: 80,
      align: "center",
      render: (v: number) => <Text style={{ color: "#52c41a" }}>{v}</Text>,
    },
    {
      title: "Errors",
      dataIndex: "error_rows",
      width: 70,
      align: "center",
      render: (v: number) => v > 0
        ? <Text style={{ color: "#ff4d4f" }}>{v}</Text>
        : <Text type="secondary">0</Text>,
    },
    {
      title: "Uploaded By",
      dataIndex: "uploaded_by_user",
      width: 150,
      render: (u: UploadLog["uploaded_by_user"]) => u?.full_name_en ?? "—",
    },
    {
      title: "",
      key: "view",
      width: 60,
      render: (_: unknown, row: UploadLog) => (
        <Button size="small" icon={<EyeOutlined />} type="text" onClick={() => openDetail(row.id)} />
      ),
    },
  ];

  const detailRowCols: ColumnsType<UploadLogRow> = [
    { title: "Row", dataIndex: "row_number", width: 60, align: "center" },
    {
      title: "Status",
      dataIndex: "status",
      width: 90,
      render: (v: string) => (
        <Badge status={v === "success" ? "success" : "error"} text={v} />
      ),
    },
    { title: "Message", dataIndex: "message", render: (v: string | null) => v ?? "—" },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16, justifyContent: "space-between", width: "100%", display: "flex" }}>
        <Title level={4} style={{ margin: 0, color: "#1a4b8c" }}>
          {t("upload")} History
        </Title>
        <Space>
          <Select
            allowClear
            placeholder="Type"
            style={{ width: 120 }}
            onChange={(v) => { setTypeFilter(v); setPage(1); load(1, v); }}
          >
            <Option value="MP">MP</Option>
            <Option value="STAFF">Staff</Option>
          </Select>
          <Button icon={<ReloadOutlined />} onClick={() => load()}>Refresh</Button>
        </Space>
      </Space>

      <Card bordered={false} style={{ borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
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
            showTotal: (n) => `${n} uploads`,
            onChange: (p) => { setPage(p); load(p); },
          }}
        />
      </Card>

      <Modal
        open={!!detail && Object.keys(detail).length > 0}
        onCancel={() => setDetail(null)}
        footer={null}
        title={detailLoading ? "Loading…" : (detail?.original_filename ?? "Upload Detail")}
        width={800}
      >
        {detail && detail.id && (
          <div>
            <Descriptions bordered size="small" column={3} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Type">
                <Tag color={detail.upload_type === "MP" ? "blue" : "green"}>{detail.upload_type}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Date">
                {dayjs(detail.uploaded_at).format("DD/MM/YYYY HH:mm")}
              </Descriptions.Item>
              <Descriptions.Item label="By">{detail.uploaded_by_user?.full_name_en}</Descriptions.Item>
              <Descriptions.Item label="Total">{detail.total_rows}</Descriptions.Item>
              <Descriptions.Item label="Success">
                <Text style={{ color: "#52c41a" }}>{detail.success_rows}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Errors">
                <Text style={{ color: "#ff4d4f" }}>{detail.error_rows}</Text>
              </Descriptions.Item>
            </Descriptions>

            <Progress
              percent={detail.total_rows ? Math.round((detail.success_rows / detail.total_rows) * 100) : 100}
              strokeColor="#52c41a"
              style={{ marginBottom: 16 }}
            />

            {detail.rows && detail.rows.length > 0 && (
              <Table
                rowKey="id"
                columns={detailRowCols}
                dataSource={detail.rows}
                size="small"
                pagination={{ pageSize: 20 }}
                scroll={{ y: 300 }}
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
