import { useState, useEffect, useCallback } from "react";
import {
  Card, Table, Select, Button, Tag, Typography, Space, Row, Col,
  Modal, Form, Input, Popconfirm, message, Drawer, Descriptions, Empty, Spin,
} from "antd";
import { ReloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import api from "../../services/api";
import { useLang } from "../../hooks/useLang";

const { Title, Text } = Typography;
const { Option } = Select;

interface AllocHistoryRecord {
  id: number;
  status: string;
  allotment_date: string;
  vacated_date: string | null;
  mp: { name_en: string; parliament_number: string } | null;
}

interface Building { id: number; name_en: string; name_bn: string }

interface Office {
  id: number;
  floor: string | null;
  room_number: string;
  phone_intercom: string | null;
  status: string;
  building: Building | null;
  current_allocation?: {
    id: number;
    mp: { name_en: string; name_bn: string; parliament_number: string } | null;
  } | null;
}

const STATUS_COLOR: Record<string, string> = {
  VACANT: "blue", Vacant: "blue",
  OCCUPIED: "green", Occupied: "green",
  UNDER_MAINTENANCE: "orange", "Under Maintenance": "orange",
};
const STATUS_DISPLAY: Record<string, string> = {
  VACANT: "Vacant", OCCUPIED: "Occupied", UNDER_MAINTENANCE: "Under Maintenance",
};

export function OfficesPage() {
  const { t } = useTranslation();
  const { lang } = useLang();

  const [data, setData]           = useState<Office[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading]     = useState(false);
  const [filters, setFilters]     = useState<{ status?: string; building_id?: number }>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<Office | null>(null);
  const [saving, setSaving]       = useState(false);
  const [form]                    = Form.useForm();

  // Detail drawer
  const [detailOpen, setDetailOpen]     = useState(false);
  const [detailOffice, setDetailOffice] = useState<Office | null>(null);
  const [allocHistory, setAllocHistory] = useState<AllocHistoryRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchData = useCallback(async (f = filters) => {
    setLoading(true);
    try {
      const params: Record<string, any> = { ...f };
      Object.keys(params).forEach((k) => params[k] === undefined && delete params[k]);
      const res = await api.get<Office[]>("/offices", { params });
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
    api.get<Building[]>("/lookups/office-buildings").then((r) => setBuildings(r.data)).catch(() => {});
  }, []);

  function applyFilters(overrides: typeof filters) {
    const next = { ...filters, ...overrides };
    setFilters(next);
    fetchData(next);
  }

  function openCreate() {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  }

  function openEdit(row: Office) {
    setEditing(row);
    form.setFieldsValue({
      building_id: row.building?.id,
      floor: row.floor ?? "",
      room_number: row.room_number,
      phone_intercom: row.phone_intercom ?? "",
    });
    setModalOpen(true);
  }

  async function handleSave() {
    const vals = await form.validateFields();
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/offices/${editing.id}`, vals);
        message.success("Office updated");
      } else {
        await api.post("/offices", vals);
        message.success("Office created");
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.delete(`/offices/${id}`);
      message.success("Office deleted");
      fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? "Delete failed");
    }
  }

  function openDetail(row: Office) {
    setDetailOffice(row);
    setDetailOpen(true);
    setLoadingHistory(true);
    api.get<AllocHistoryRecord[]>(`/allocations/asset/OFFICE/${row.id}/history`)
      .then((r) => setAllocHistory(r.data))
      .finally(() => setLoadingHistory(false));
  }

  const allocHistoryCols: ColumnsType<AllocHistoryRecord> = [
    {
      title: "MP",
      key: "mp",
      render: (_: unknown, row: AllocHistoryRecord) =>
        row.mp ? (
          <Space direction="vertical" size={0}>
            <Text strong>{row.mp.name_en}</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>#{row.mp.parliament_number}</Text>
          </Space>
        ) : "—",
    },
    {
      title: "Allotment Date",
      dataIndex: "allotment_date",
      width: 130,
      render: (v: string) => dayjs(v).format("DD MMM YYYY"),
    },
    {
      title: "Vacated Date",
      dataIndex: "vacated_date",
      width: 130,
      render: (v: string | null) => v ? dayjs(v).format("DD MMM YYYY") : <Text type="secondary">—</Text>,
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 90,
      render: (v: string) => <Tag color={v === "ACTIVE" ? "green" : "red"}>{v}</Tag>,
    },
  ];

  const bldgName = (b: Office["building"]) =>
    b ? (lang === "bn" ? b.name_bn : b.name_en) : "—";

  const columns: ColumnsType<Office> = [
    {
      title: t("building"),
      key: "building",
      render: (_: unknown, row: Office) => <Text strong>{bldgName(row.building)}</Text>,
    },
    {
      title: t("floor"),
      dataIndex: "floor",
      width: 80,
      render: (v: string | null) => v ?? "—",
    },
    {
      title: t("room_number"),
      dataIndex: "room_number",
      width: 120,
      render: (v: string) => <Text code>{v}</Text>,
    },
    {
      title: t("intercom"),
      dataIndex: "phone_intercom",
      width: 120,
      render: (v: string | null) => v ?? <Text type="secondary">—</Text>,
    },
    {
      title: t("status"),
      dataIndex: "status",
      width: 140,
      render: (v: string) => (
        <Tag color={STATUS_COLOR[v] ?? "default"}>{STATUS_DISPLAY[v] ?? v}</Tag>
      ),
    },
    {
      title: t("occupant"),
      key: "occupant",
      render: (_: unknown, row: Office) => {
        const mp = row.current_allocation?.mp;
        return mp
          ? <Space direction="vertical" size={0}>
              <Text>{mp.name_en}</Text>
              <Text type="secondary" style={{ fontSize: 11 }}>#{mp.parliament_number}</Text>
            </Space>
          : <Text type="secondary">—</Text>;
      },
    },
    {
      title: "",
      key: "actions",
      width: 100,
      render: (_: unknown, row: Office) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)} />
          {row.status === "VACANT" || row.status === "Vacant" ? (
            <Popconfirm
              title="Delete this office?"
              onConfirm={() => handleDelete(row.id)}
              okText="Delete"
              okButtonProps={{ danger: true }}
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row align="middle" justify="space-between" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={4} style={{ margin: 0, color: "#1a4b8c" }}>{t("offices")}</Title>
        </Col>
        <Col>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => fetchData()} />
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}
              style={{ background: "#1a4b8c" }}>
              Add Office
            </Button>
          </Space>
        </Col>
      </Row>

      <Card bordered={false} style={{ marginBottom: 16, borderRadius: 8 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Select allowClear placeholder={t("building")} style={{ width: "100%" }}
              onChange={(v) => applyFilters({ building_id: v })}>
              {buildings.map((b) => (
                <Option key={b.id} value={b.id}>{lang === "bn" ? b.name_bn : b.name_en}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select allowClear placeholder={t("status")} style={{ width: "100%" }}
              onChange={(v) => applyFilters({ status: v })}>
              {Object.entries(STATUS_DISPLAY).map(([val, label]) => (
                <Option key={val} value={val}><Tag color={STATUS_COLOR[val]}>{label}</Tag></Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      <Card bordered={false} style={{ borderRadius: 8 }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          size="small"
          pagination={{ pageSize: 50, showSizeChanger: true, pageSizeOptions: ["25", "50", "100"], showTotal: (total) => `${total} offices` }}
          scroll={{ x: 900 }}
          onRow={(row) => ({
            onClick: (e) => {
              const target = e.target as HTMLElement;
              if (target.closest(".ant-btn") || target.closest(".ant-popover")) return;
              openDetail(row);
            },
            style: { cursor: "pointer" },
          })}
        />
      </Card>

      {/* Office Detail Drawer */}
      <Drawer
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        width={640}
        title={
          detailOffice
            ? `Office — ${bldgName(detailOffice.building)}, Room ${detailOffice.room_number}`
            : "Office Detail"
        }
        extra={
          detailOffice && (
            <Button
              icon={<EditOutlined />}
              onClick={() => { setDetailOpen(false); openEdit(detailOffice); }}
              style={{ borderColor: "#1a4b8c", color: "#1a4b8c" }}
            >
              Edit
            </Button>
          )
        }
      >
        {detailOffice && (
          <>
            <Descriptions bordered size="small" column={1} labelStyle={{ width: 160 }} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="Building">{bldgName(detailOffice.building)}</Descriptions.Item>
              <Descriptions.Item label="Floor">{detailOffice.floor ?? "—"}</Descriptions.Item>
              <Descriptions.Item label="Room Number"><Text code>{detailOffice.room_number}</Text></Descriptions.Item>
              <Descriptions.Item label="Intercom">{detailOffice.phone_intercom ?? "—"}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={STATUS_COLOR[detailOffice.status] ?? "default"}>
                  {STATUS_DISPLAY[detailOffice.status] ?? detailOffice.status}
                </Tag>
              </Descriptions.Item>
              {detailOffice.current_allocation?.mp && (
                <Descriptions.Item label="Current MP">
                  <Space direction="vertical" size={0}>
                    <Text strong>{detailOffice.current_allocation.mp.name_en}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      #{detailOffice.current_allocation.mp.parliament_number}
                    </Text>
                  </Space>
                </Descriptions.Item>
              )}
            </Descriptions>

            <Title level={5} style={{ color: "#1a4b8c" }}>Allocation History</Title>
            {loadingHistory ? (
              <Spin />
            ) : allocHistory.length === 0 ? (
              <Empty description="No allocation history" />
            ) : (
              <Table
                rowKey="id"
                columns={allocHistoryCols}
                dataSource={allocHistory}
                size="small"
                pagination={false}
              />
            )}
          </>
        )}
      </Drawer>

      <Modal
        open={modalOpen}
        title={
          <Space>
            {editing ? <EditOutlined /> : <PlusOutlined />}
            <span>{editing ? "Edit Office" : "Add New Office"}</span>
          </Space>
        }
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText={editing ? "Save Changes" : "Create"}
        confirmLoading={saving}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="building_id" label="Building" rules={[{ required: true }]}>
            <Select placeholder="Select building" showSearch
              optionFilterProp="children">
              {buildings.map((b) => (
                <Option key={b.id} value={b.id}>{lang === "bn" ? b.name_bn : b.name_en}</Option>
              ))}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="floor" label="Floor">
                <Input placeholder="e.g. 3rd" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="room_number" label="Room Number" rules={[{ required: true }]}>
                <Input placeholder="e.g. 301" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="phone_intercom" label="Intercom / Phone">
            <Input placeholder="e.g. 2301" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
