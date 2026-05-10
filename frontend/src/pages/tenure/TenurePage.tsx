import { useState, useEffect } from "react";
import {
  Card, Table, Button, Tag, Typography, Space, Modal, Form,
  Input, DatePicker, Row, Col, message,
} from "antd";
import { PlusOutlined, ReloadOutlined, EditOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import api from "../../services/api";

const { Title, Text } = Typography;

interface Tenure {
  id: number;
  name: string;
  name_bn: string | null;
  start_date: string;
  end_date: string | null;
  status: string;
  created_at: string;
}

const STATUS_COLOR: Record<string, string> = {
  Active: "green",
  Closed: "red",
};

export function TenurePage() {
  const { t } = useTranslation();
  const [data, setData] = useState<Tenure[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Tenure | null>(null);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await api.get<Tenure[]>("/tenures");
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  function openCreate() {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  }

  function openEdit(row: Tenure) {
    setEditing(row);
    form.setFieldsValue({
      name: row.name,
      name_bn: row.name_bn ?? "",
      start_date: dayjs(row.start_date),
      end_date: row.end_date ? dayjs(row.end_date) : null,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    const vals = await form.validateFields();
    setSaving(true);
    try {
      const payload = {
        name: vals.name,
        start_date: vals.start_date?.format("YYYY-MM-DD"),
        end_date: vals.end_date?.format("YYYY-MM-DD") ?? null,
      };
      if (editing) {
        await api.patch(`/tenures/${editing.id}`, payload);
      } else {
        await api.post("/tenures", payload);
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

  const columns: ColumnsType<Tenure> = [
    { title: "ID", dataIndex: "id", width: 60 },
    { title: t("name_en"), dataIndex: "name", render: (v: string) => <Text strong>{v}</Text> },
    { title: t("name_bn"), dataIndex: "name_bn", render: (v: string | null) => v || <Text type="secondary">—</Text> },
    {
      title: t("start_date"),
      dataIndex: "start_date",
      render: (v: string) => dayjs(v).format("DD MMM YYYY"),
    },
    {
      title: t("end_date"),
      dataIndex: "end_date",
      render: (v: string | null) => v ? dayjs(v).format("DD MMM YYYY") : <Text type="secondary">—</Text>,
    },
    {
      title: t("status"),
      dataIndex: "status",
      render: (v: string) => <Tag color={STATUS_COLOR[v] ?? "default"}>{v}</Tag>,
    },
    {
      title: t("actions"),
      key: "actions",
      width: 80,
      render: (_: unknown, row: Tenure) => (
        <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)}>
          {t("edit")}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Row align="middle" justify="space-between" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={4} style={{ margin: 0, color: "#1a4b8c" }}>
            {t("tenure")}
          </Title>
        </Col>
        <Col>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchData} />
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}
              style={{ background: "#1a4b8c" }}>
              {t("add")}
            </Button>
          </Space>
        </Col>
      </Row>

      <Card bordered={false} style={{ borderRadius: 8 }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          size="small"
          pagination={{ pageSize: 20, showTotal: (total) => `${total} records` }}
        />
      </Card>

      <Modal
        open={modalOpen}
        title={editing ? t("edit") + " — " + editing.name : t("add") + " " + t("tenure")}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        confirmLoading={saving}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label={t("name_en")} rules={[{ required: true, message: t("val_required") }]}>
            <Input placeholder="e.g. 13th Parliament" />
          </Form.Item>
          <Form.Item name="name_bn" label={t("name_bn")}>
            <Input placeholder="যেমন: ১৩তম সংসদ" />
          </Form.Item>
          <Form.Item name="start_date" label={t("start_date")} rules={[{ required: true, message: t("val_required") }]}>
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="end_date" label={t("end_date")}>
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
