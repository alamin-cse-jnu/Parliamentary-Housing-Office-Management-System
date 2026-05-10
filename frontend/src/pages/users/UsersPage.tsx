import { useState, useEffect } from "react";
import {
  Card, Table, Button, Modal, Form, Input, Select, Tag,
  Space, Typography, Popconfirm, message,
} from "antd";
import {
  PlusOutlined, EditOutlined, StopOutlined, KeyOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { ColumnsType } from "antd/es/table";
import api from "../../services/api";

const { Title, Text } = Typography;
const { Option } = Select;

interface SystemUser {
  id: number;
  username: string;
  full_name_en: string;
  full_name_bn: string | null;
  role: "SUPER_ADMIN" | "ADMIN";
  is_active: boolean;
  created_at: string;
}

type ModalMode = "create" | "edit" | "password" | null;

export function UsersPage() {
  const { t } = useTranslation();
  const [users, setUsers]       = useState<SystemUser[]>([]);
  const [loading, setLoading]   = useState(false);
  const [mode, setMode]         = useState<ModalMode>(null);
  const [selected, setSelected] = useState<SystemUser | null>(null);
  const [form] = Form.useForm();

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<SystemUser[]>("/users");
      setUsers(res.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setSelected(null);
    form.resetFields();
    setMode("create");
  }

  function openEdit(u: SystemUser) {
    setSelected(u);
    form.setFieldsValue({
      full_name_en: u.full_name_en,
      full_name_bn: u.full_name_bn,
      role: u.role,
    });
    setMode("edit");
  }

  function openPassword(u: SystemUser) {
    setSelected(u);
    form.resetFields();
    setMode("password");
  }

  async function handleSubmit() {
    const values = await form.validateFields();
    try {
      if (mode === "create") {
        await api.post("/users", values);
        message.success(t("save_success"));
      } else if (mode === "edit" && selected) {
        await api.patch(`/users/${selected.id}`, values);
        message.success(t("save_success"));
      } else if (mode === "password" && selected) {
        await api.patch(`/users/${selected.id}/password`, values);
        message.success(t("save_success"));
      }
      setMode(null);
      load();
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? "Error");
    }
  }

  async function deactivate(u: SystemUser) {
    try {
      await api.delete(`/users/${u.id}`);
      message.success(t("save_success"));
      load();
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? "Error");
    }
  }

  const columns: ColumnsType<SystemUser> = [
    {
      title: t("username"),
      dataIndex: "username",
      render: (v: string) => <Text code>{v}</Text>,
    },
    {
      title: t("name_en"),
      dataIndex: "full_name_en",
    },
    {
      title: "Role",
      dataIndex: "role",
      render: (v: string) => (
        <Tag color={v === "SUPER_ADMIN" ? "purple" : "blue"}>{v}</Tag>
      ),
    },
    {
      title: t("status"),
      dataIndex: "is_active",
      render: (v: boolean) => (
        <Tag color={v ? "green" : "default"}>{v ? t("active") : "Inactive"}</Tag>
      ),
    },
    {
      title: t("actions"),
      key: "actions",
      render: (_: unknown, u: SystemUser) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(u)}>
            {t("edit")}
          </Button>
          <Button size="small" icon={<KeyOutlined />} onClick={() => openPassword(u)}>
            Password
          </Button>
          {u.is_active && (
            <Popconfirm
              title="Deactivate this user?"
              onConfirm={() => deactivate(u)}
              okText={t("yes")}
              cancelText={t("no")}
            >
              <Button size="small" danger icon={<StopOutlined />}>
                Deactivate
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const modalTitle =
    mode === "create"   ? t("add")      :
    mode === "edit"     ? t("edit")     :
    mode === "password" ? "Change Password" : "";

  return (
    <div>
      <Space style={{ marginBottom: 16, justifyContent: "space-between", width: "100%", display: "flex" }}>
        <Title level={4} style={{ margin: 0, color: "#1a4b8c" }}>{t("users")}</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}
          style={{ background: "#1a4b8c" }}>
          {t("add")}
        </Button>
      </Space>

      <Card bordered={false} style={{ borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={users}
          loading={loading}
          pagination={false}
          size="middle"
        />
      </Card>

      <Modal
        open={!!mode}
        title={modalTitle}
        onCancel={() => setMode(null)}
        onOk={handleSubmit}
        okText={t("save")}
        cancelText={t("cancel")}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          {mode === "create" && (
            <>
              <Form.Item name="username" label={t("username")}
                rules={[{ required: true, message: t("val_required") }]}>
                <Input />
              </Form.Item>
              <Form.Item name="password" label={t("password")}
                rules={[{ required: true, message: t("val_required") }, { min: 8, message: "Min 8 characters" }]}>
                <Input.Password />
              </Form.Item>
            </>
          )}

          {mode === "password" && (
            <Form.Item name="new_password" label="New Password"
              rules={[{ required: true, message: t("val_required") }, { min: 8, message: "Min 8 characters" }]}>
              <Input.Password />
            </Form.Item>
          )}

          {(mode === "create" || mode === "edit") && (
            <>
              <Form.Item name="full_name_en" label={t("name_en")}
                rules={[{ required: true, message: t("val_required") }]}>
                <Input />
              </Form.Item>
              <Form.Item name="full_name_bn" label={t("name_bn")}>
                <Input />
              </Form.Item>
              <Form.Item name="role" label="Role"
                rules={[{ required: true, message: t("val_required") }]}
                initialValue="ADMIN">
                <Select>
                  <Option value="ADMIN">Admin</Option>
                  <Option value="SUPER_ADMIN">Super Admin</Option>
                </Select>
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
}
