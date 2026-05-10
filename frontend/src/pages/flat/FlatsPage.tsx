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
  mp: { name_en: string; parliament_number: string } | null;
}

interface Category { id: number; name_en: string; name_bn: string }

interface Flat {
  id: number;
  flat_number: string;
  building_name: string | null;
  location_name: string;
  floor: string | null;
  area_sqft: number | null;
  status: string;
  category: Category | null;
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

export function FlatsPage() {
  const { t } = useTranslation();
  const { lang } = useLang();

  const [data, setData]             = useState<Flat[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(false);
  const [filters, setFilters]       = useState<{
    status?: string; category_id?: number; building_name?: string;
  }>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<Flat | null>(null);
  const [saving, setSaving]       = useState(false);
  const [form]                    = Form.useForm();

  // Detail drawer
  const [detailOpen, setDetailOpen]   = useState(false);
  const [detailFlat, setDetailFlat]   = useState<Flat | null>(null);
  const [allocHistory, setAllocHistory] = useState<AllocHistoryRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchData = useCallback(async (f = filters) => {
    setLoading(true);
    try {
      const params: Record<string, any> = { ...f };
      Object.keys(params).forEach((k) => params[k] === undefined && delete params[k]);
      const res = await api.get<Flat[]>("/mp-flats", { params });
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
    api.get<Category[]>("/lookups/mp-flat-categories").then((r) => setCategories(r.data)).catch(() => {});
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

  function openEdit(row: Flat) {
    setEditing(row);
    form.setFieldsValue({
      category_id: row.category?.id,
      location_name: row.location_name,
      building_name: row.building_name ?? "",
      flat_number: row.flat_number,
      floor: row.floor ?? "",
      area_sqft: row.area_sqft,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    const vals = await form.validateFields();
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/mp-flats/${editing.id}`, vals);
        message.success("Flat updated");
      } else {
        await api.post("/mp-flats", vals);
        message.success("Flat created");
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
      await api.delete(`/mp-flats/${id}`);
      message.success("Flat deleted");
      fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? "Delete failed");
    }
  }

  function openDetail(row: Flat) {
    setDetailFlat(row);
    setDetailOpen(true);
    setLoadingHistory(true);
    api.get<AllocHistoryRecord[]>(`/allocations/asset/MP_FLAT/${row.id}/history`)
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

  const catName = (c: Flat["category"]) =>
    c ? (lang === "bn" ? c.name_bn : c.name_en) : "—";

  const columns: ColumnsType<Flat> = [
    {
      title: t("category"),
      key: "category",
      render: (_: unknown, row: Flat) => <Tag color="purple">{catName(row.category)}</Tag>,
    },
    {
      title: t("flat_number"),
      dataIndex: "flat_number",
      width: 110,
      render: (v: string) => <Text code>{v}</Text>,
    },
    { title: t("building"), dataIndex: "building_name", render: (v: string | null) => v ?? "—" },
    { title: t("location"), dataIndex: "location_name" },
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
      render: (_: unknown, row: Flat) => {
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
      render: (_: unknown, row: Flat) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)} />
          {(row.status === "VACANT" || row.status === "Vacant") && (
            <Popconfirm
              title="Delete this flat?"
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
          <Title level={4} style={{ margin: 0, color: "#1a4b8c" }}>{t("flats")}</Title>
        </Col>
        <Col>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => fetchData()} />
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}
              style={{ background: "#1a4b8c" }}>
              Add Flat
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
          <Col xs={24} sm={12} md={6}>
            <Select allowClear placeholder={t("status")} style={{ width: "100%" }}
              onChange={(v) => applyFilters({ status: v })}>
              {Object.entries(STATUS_DISPLAY).map(([val, label]) => (
                <Option key={val} value={val}><Tag color={STATUS_COLOR[val]}>{label}</Tag></Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Search placeholder={t("building")} allowClear
              onSearch={(v) => applyFilters({ building_name: v || undefined })} enterButton />
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
          pagination={{ pageSize: 50, showSizeChanger: true, pageSizeOptions: ["25", "50", "100"], showTotal: (total) => `${total} flats` }}
          scroll={{ x: 1000 }}
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

      {/* Flat Detail Drawer */}
      <Drawer
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        width={640}
        title={
          detailFlat
            ? `Flat — ${catName(detailFlat.category)} ${detailFlat.flat_number}${detailFlat.building_name ? ` (${detailFlat.building_name})` : ""}`
            : "Flat Detail"
        }
        extra={
          detailFlat && (
            <Button
              icon={<EditOutlined />}
              onClick={() => { setDetailOpen(false); openEdit(detailFlat); }}
              style={{ borderColor: "#1a4b8c", color: "#1a4b8c" }}
            >
              Edit
            </Button>
          )
        }
      >
        {detailFlat && (
          <>
            <Descriptions bordered size="small" column={1} labelStyle={{ width: 160 }} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="Category">{catName(detailFlat.category)}</Descriptions.Item>
              <Descriptions.Item label="Flat Number"><Text code>{detailFlat.flat_number}</Text></Descriptions.Item>
              <Descriptions.Item label="Building">{detailFlat.building_name ?? "—"}</Descriptions.Item>
              <Descriptions.Item label="Location">{detailFlat.location_name}</Descriptions.Item>
              <Descriptions.Item label="Floor">{detailFlat.floor ?? "—"}</Descriptions.Item>
              <Descriptions.Item label="Area">{detailFlat.area_sqft != null ? `${detailFlat.area_sqft} sqft` : "—"}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={STATUS_COLOR[detailFlat.status] ?? "default"}>
                  {STATUS_DISPLAY[detailFlat.status] ?? detailFlat.status}
                </Tag>
              </Descriptions.Item>
              {detailFlat.current_allocation?.mp && (
                <Descriptions.Item label="Current MP">
                  <Space direction="vertical" size={0}>
                    <Text strong>{detailFlat.current_allocation.mp.name_en}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      #{detailFlat.current_allocation.mp.parliament_number}
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
            <span>{editing ? "Edit Flat" : "Add New MP Flat"}</span>
          </Space>
        }
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText={editing ? "Save Changes" : "Create"}
        confirmLoading={saving}
        width={600}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="category_id" label="Category" rules={[{ required: true }]}>
            <Select placeholder="Select flat category" showSearch optionFilterProp="children">
              {categories.map((c) => (
                <Option key={c.id} value={c.id}>{lang === "bn" ? c.name_bn : c.name_en}</Option>
              ))}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="location_name" label="Location" rules={[{ required: true }]}>
                <Input placeholder="e.g. Sher-e-Bangla Nagar" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="building_name" label="Building Name" rules={[{ required: true }]}>
                <Input placeholder="e.g. Block-A" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="flat_number" label="Flat Number" rules={[{ required: true }]}>
                <Input placeholder="e.g. A-101" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="floor" label="Floor">
                <Input placeholder="e.g. 1st" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="area_sqft" label="Area (sqft)">
            <InputNumber min={0} style={{ width: "100%" }} placeholder="e.g. 1200" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
