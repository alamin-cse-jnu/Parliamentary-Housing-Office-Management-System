import { useState, useEffect, useCallback } from "react";
import {
  Card, Table, Tabs, Button, Typography, Space, Row, Col,
  Modal, Form, Input, Popconfirm, message,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { ColumnsType } from "antd/es/table";
import api from "../../services/api";

const { Title, Text } = Typography;

interface LookupItem { id: number; name_en: string; name_bn: string }

const LOOKUP_TYPES: { key: string; label: string; apiPath: string }[] = [
  { key: "mp-flat-categories",  label: "MP Flat Categories",       apiPath: "mp-flat-categories" },
  { key: "quarter-categories",  label: "Quarter Categories",       apiPath: "quarter-categories" },
  { key: "political-parties",   label: "Political Parties",        apiPath: "political-parties" },
  { key: "departments",         label: "Departments",              apiPath: "departments" },
  { key: "mp-designations",     label: "MP Designations",          apiPath: "mp-designations" },
  { key: "staff-designations",  label: "Staff Designations",       apiPath: "staff-designations" },
  { key: "office-buildings",    label: "Office Buildings",         apiPath: "office-buildings" },
  { key: "relation-types",      label: "Household Relation Types", apiPath: "relation-types" },
];

function LookupTab({ apiPath }: { apiPath: string }) {
  const { t } = useTranslation();
  const [data, setData]       = useState<LookupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LookupItem | null>(null);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<LookupItem[]>(`/lookups/${apiPath}`);
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }, [apiPath]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function openCreate() {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  }

  function openEdit(item: LookupItem) {
    setEditing(item);
    form.setFieldsValue({ name_en: item.name_en, name_bn: item.name_bn });
    setModalOpen(true);
  }

  async function handleSave() {
    const vals = await form.validateFields();
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/lookups/${apiPath}/${editing.id}`, vals);
      } else {
        await api.post(`/lookups/${apiPath}`, vals);
      }
      message.success(t("save_success"));
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? "Error saving");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.delete(`/lookups/${apiPath}/${id}`);
      message.success(t("delete_success"));
      fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? "Cannot delete — item may be in use");
    }
  }

  const columns: ColumnsType<LookupItem> = [
    { title: "ID", dataIndex: "id", width: 60 },
    { title: t("name_en"), dataIndex: "name_en", render: (v: string) => <Text strong>{v}</Text> },
    { title: t("name_bn"), dataIndex: "name_bn" },
    {
      title: t("actions"),
      key: "actions",
      width: 120,
      render: (_: unknown, row: LookupItem) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)} />
          <Popconfirm
            title={t("delete_confirm")}
            onConfirm={() => handleDelete(row.id)}
            okText={t("yes")} cancelText={t("no")}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row justify="end" style={{ marginBottom: 12 }}>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}
            style={{ background: "#1a4b8c" }}>
            {t("add")}
          </Button>
        </Col>
      </Row>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        size="small"
        pagination={{ pageSize: 50, showTotal: (total) => `${total} items` }}
      />

      <Modal
        open={modalOpen}
        title={editing ? t("edit") : t("add")}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        confirmLoading={saving}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name_en" label={t("name_en")}
            rules={[{ required: true, message: t("val_required") }]}>
            <Input />
          </Form.Item>
          <Form.Item name="name_bn" label={t("name_bn")}
            rules={[{ required: true, message: t("val_required") }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export function LookupsPage() {
  const { t } = useTranslation();

  const items = LOOKUP_TYPES.map((lt) => ({
    key: lt.key,
    label: lt.label,
    children: (
      <Card bordered={false} style={{ borderRadius: 8 }}>
        <LookupTab apiPath={lt.apiPath} />
      </Card>
    ),
  }));

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16, color: "#1a4b8c" }}>
        {t("lookups")}
      </Title>
      <Tabs
        defaultActiveKey="mp-flat-categories"
        items={items}
        type="card"
        style={{ background: "transparent" }}
      />
    </div>
  );
}
