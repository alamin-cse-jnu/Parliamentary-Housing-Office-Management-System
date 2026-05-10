import { useState, useEffect, useCallback } from "react";
import {
  Card, Table, Select, Input, Button, Tag, Typography, Space, Row, Col,
  Modal, Form, InputNumber, Popconfirm, message, Drawer, Descriptions, Empty, Spin,
} from "antd";
import { ReloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import api from "../../services/api";
import { useLang } from "../../hooks/useLang";

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

interface AllocHistoryRecord {
  id: number;
  status: string;
  allotment_date: string;
  vacated_date: string | null;
  remarks: string | null;
  staff: { name_en: string; name_bn: string; internal_user_id: string; designation: string } | null;
}

interface Category { id: number; name_en: string; name_bn: string }

interface Quarter {
  id: number;
  quarter_number: string;
  location: string;
  building_name: string | null;
  floor: string | null;
  house_flat_number: string | null;
  area_sqft: number | null;
  full_address: string | null;
  status: string;
  category: Category | null;
  current_allocation?: {
    id: number;
    staff: { name_en: string; name_bn: string; internal_user_id: string; designation: string } | null;
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

export function QuartersPage() {
  const { t } = useTranslation();
  const { lang } = useLang();

  const [data, setData]             = useState<Quarter[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(false);
  const [filters, setFilters]       = useState<{
    status?: string; category_id?: number; location?: string;
  }>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<Quarter | null>(null);
  const [saving, setSaving]       = useState(false);
  const [form]                    = Form.useForm();

  // Detail drawer
  const [detailOpen, setDetailOpen]       = useState(false);
  const [detailQuarter, setDetailQuarter] = useState<Quarter | null>(null);
  const [allocHistory, setAllocHistory]   = useState<AllocHistoryRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchData = useCallback(async (f = filters) => {
    setLoading(true);
    try {
      const params: Record<string, any> = { ...f };
      Object.keys(params).forEach((k) => params[k] === undefined && delete params[k]);
      const res = await api.get<Quarter[]>("/quarters", { params });
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
    api.get<Category[]>("/lookups/quarter-categories").then((r) => setCategories(r.data)).catch(() => {});
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

  function openEdit(row: Quarter) {
    setEditing(row);
    form.setFieldsValue({
      category_id: row.category?.id,
      quarter_number: row.quarter_number,
      location: row.location,
      building_name: row.building_name ?? "",
      floor: row.floor ?? "",
      house_flat_number: row.house_flat_number ?? "",
      area_sqft: row.area_sqft,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    const vals = await form.validateFields();
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/quarters/${editing.id}`, vals);
        message.success("Quarter updated");
      } else {
        await api.post("/quarters", vals);
        message.success("Quarter created");
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
      await api.delete(`/quarters/${id}`);
      message.success("Quarter deleted");
      fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? "Delete failed");
    }
  }

  function openDetail(row: Quarter) {
    setDetailQuarter(row);
    setDetailOpen(true);
    setLoadingHistory(true);
    api.get<AllocHistoryRecord[]>(`/allocations/asset/STAFF_QUARTER/${row.id}/history`)
      .then((r) => setAllocHistory(r.data))
      .finally(() => setLoadingHistory(false));
  }

  const allocHistoryCols: ColumnsType<AllocHistoryRecord> = [
    {
      title: "Occupant",
      key: "occupant",
      render: (_: unknown, row: AllocHistoryRecord) =>
        row.staff ? (
          <Space direction="vertical" size={0}>
            <Text strong>{row.staff.name_en}</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>{row.staff.designation}</Text>
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

  const catName = (c: Quarter["category"]) =>
    c ? (lang === "bn" ? c.name_bn : c.name_en) : "—";

  const columns: ColumnsType<Quarter> = [
    {
      title: t("category"),
      key: "category",
      render: (_: unknown, row: Quarter) => <Tag color="geekblue">{catName(row.category)}</Tag>,
    },
    {
      title: t("quarter_number"),
      dataIndex: "quarter_number",
      width: 120,
      render: (v: string) => <Text code>{v}</Text>,
    },
    { title: t("location"), dataIndex: "location" },
    { title: t("building"), dataIndex: "building_name", render: (v: string | null) => v ?? "—" },
    {
      title: t("floor"),
      dataIndex: "floor",
      width: 70,
      render: (v: string | null) => v ?? "—",
    },
    {
      title: t("area_sqft"),
      dataIndex: "area_sqft",
      width: 100,
      render: (v: number | null) => v != null ? `${v} sqft` : "—",
    },
    {
      title: t("status"),
      dataIndex: "status",
      width: 140,
      render: (v: string) => <Tag color={STATUS_COLOR[v] ?? "default"}>{STATUS_DISPLAY[v] ?? v}</Tag>,
    },
    {
      title: t("occupant"),
      key: "occupant",
      render: (_: unknown, row: Quarter) => {
        const s = row.current_allocation?.staff;
        return s
          ? <Space direction="vertical" size={0}>
              <Text>{s.name_en}</Text>
              <Text type="secondary" style={{ fontSize: 11 }}>{s.designation}</Text>
            </Space>
          : <Text type="secondary">—</Text>;
      },
    },
    {
      title: "",
      key: "actions",
      width: 100,
      render: (_: unknown, row: Quarter) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)} />
          {(row.status === "VACANT" || row.status === "Vacant") && (
            <Popconfirm
              title="Delete this quarter?"
              onConfirm={() => handleDelete(row.id)}
              okText="Delete"
              okButtonProps={{ danger: true }}
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row align="middle" justify="space-between" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={4} style={{ margin: 0, color: "#1a4b8c" }}>{t("quarters")}</Title>
        </Col>
        <Col>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => fetchData()} />
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}
              style={{ background: "#1a4b8c" }}>
              Add Quarter
            </Button>
          </Space>
        </Col>
      </Row>

      <Card bordered={false} style={{ marginBottom: 16, borderRadius: 8 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Select allowClear placeholder={t("category")} style={{ width: "100%" }}
              onChange={(v) => applyFilters({ category_id: v })}>
              {categories.map((c) => (
                <Option key={c.id} value={c.id}>{lang === "bn" ? c.name_bn : c.name_en}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={5}>
            <Select allowClear placeholder={t("status")} style={{ width: "100%" }}
              onChange={(v) => applyFilters({ status: v })}>
              {Object.entries(STATUS_DISPLAY).map(([val, label]) => (
                <Option key={val} value={val}><Tag color={STATUS_COLOR[val]}>{label}</Tag></Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Search placeholder={t("location")} allowClear
              onSearch={(v) => applyFilters({ location: v || undefined })} enterButton />
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
          pagination={{ pageSize: 50, showSizeChanger: true, pageSizeOptions: ["25", "50", "100"], showTotal: (total) => `${total} quarters` }}
          scroll={{ x: 1100 }}
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

      {/* Quarter Detail Drawer */}
      <Drawer
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        width={680}
        title={
          detailQuarter
            ? `Quarter — ${detailQuarter.category ? catName(detailQuarter.category) : ""} ${detailQuarter.quarter_number}`
            : "Quarter Detail"
        }
        extra={
          detailQuarter && (
            <Button
              icon={<EditOutlined />}
              onClick={() => { setDetailOpen(false); openEdit(detailQuarter); }}
              style={{ borderColor: "#1a4b8c", color: "#1a4b8c" }}
            >
              Edit
            </Button>
          )
        }
      >
        {detailQuarter && (
          <>
            <Descriptions bordered size="small" column={1} labelStyle={{ width: 160 }} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="Category">
                {catName(detailQuarter.category)}
              </Descriptions.Item>
              <Descriptions.Item label="Quarter Number">
                <Text code>{detailQuarter.quarter_number}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Location">{detailQuarter.location}</Descriptions.Item>
              <Descriptions.Item label="Building">{detailQuarter.building_name ?? "—"}</Descriptions.Item>
              <Descriptions.Item label="Floor">{detailQuarter.floor ?? "—"}</Descriptions.Item>
              <Descriptions.Item label="House / Flat No.">{detailQuarter.house_flat_number ?? "—"}</Descriptions.Item>
              <Descriptions.Item label="Area">{detailQuarter.area_sqft != null ? `${detailQuarter.area_sqft} sqft` : "—"}</Descriptions.Item>
              <Descriptions.Item label="Full Address">{detailQuarter.full_address ?? "—"}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={STATUS_COLOR[detailQuarter.status] ?? "default"}>
                  {STATUS_DISPLAY[detailQuarter.status] ?? detailQuarter.status}
                </Tag>
              </Descriptions.Item>
              {detailQuarter.current_allocation?.staff && (
                <Descriptions.Item label="Current Occupant">
                  <Space direction="vertical" size={0}>
                    <Text strong>{detailQuarter.current_allocation.staff.name_en}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {detailQuarter.current_allocation.staff.designation}
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
            <span>{editing ? "Edit Quarter" : "Add New Staff Quarter"}</span>
          </Space>
        }
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText={editing ? "Save Changes" : "Create"}
        confirmLoading={saving}
        width={640}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category_id" label="Category" rules={[{ required: true }]}>
                <Select placeholder="Select quarter category" showSearch optionFilterProp="children">
                  {categories.map((c) => (
                    <Option key={c.id} value={c.id}>{lang === "bn" ? c.name_bn : c.name_en}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="quarter_number" label="Quarter Number" rules={[{ required: true }]}>
                <Input placeholder="e.g. Q-001" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="location" label="Location" rules={[{ required: true }]}>
                <Input placeholder="e.g. Mirpur" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="building_name" label="Building Name">
                <Input placeholder="e.g. Block-C" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="floor" label="Floor">
                <Input placeholder="e.g. 2nd" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="house_flat_number" label="House / Flat Number">
                <Input placeholder="e.g. C-12" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="area_sqft" label="Area (sqft)">
            <InputNumber min={0} style={{ width: "100%" }} placeholder="e.g. 900" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
