import { useEffect, useState } from "react";
import {
  Drawer, Tabs, Descriptions, Avatar, Tag, Table, Typography,
  Space, Button, Spin, Empty, Badge, Upload, Popconfirm, Modal, Form, Select,
  DatePicker, Input, message,
} from "antd";
import {
  UserOutlined, EditOutlined, PlusOutlined, DeleteOutlined, CameraOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import api from "../../services/api";
import { photoUrl } from "../../services/photoUrl";
import { useLang } from "../../hooks/useLang";

const { Text } = Typography;
const { Option } = Select;

interface StaffDetail {
  id: number;
  internal_user_id: string;
  name_en: string;
  name_bn: string;
  designation: string;
  grade: number | null;
  employee_class: string | null;
  service_status: string;
  mobile: string | null;
  gender: string;
  marital_status: string | null;
  photo_path: string | null;
  department: { id: number; name_en: string; name_bn: string } | null;
}

interface DesigLog {
  id: number;
  effective_date: string;
  old_designation: string | null;
  new_designation: string;
  changed_by_user: { username: string; full_name_en: string } | null;
}

interface AllocRecord {
  id: number;
  status: string;
  allotment_date: string;
  vacated_date: string | null;
  remarks: string | null;
  staff_quarter: {
    quarter_number: string;
    location: string;
    category: { name_en: string } | null;
  } | null;
}

interface HouseholdMember {
  id: number;
  name_en: string;
  name_bn: string;
  date_of_birth: string | null;
  identity_number: string | null;
  photo_path: string | null;
  is_active: boolean;
  relation_type: { id: number; name_en: string; name_bn: string } | null;
  allocation: { id: number } | null;
}

interface RelationType { id: number; name_en: string; name_bn: string }

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "green", RETIRED: "orange", TRANSFERRED: "blue", DECEASED: "red",
};
const CLASS_COLOR: Record<string, string> = {
  CLASS_1: "purple", CLASS_2: "blue", CLASS_3: "cyan", CLASS_4: "default", NO_CLASS: "default",
};

interface Props {
  staffId: number | null;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
}

export function StaffDetailDrawer({ staffId, open, onClose, onEdit }: Props) {
  const { lang } = useLang();

  const [staff, setStaff]             = useState<StaffDetail | null>(null);
  const [desigLogs, setDesigLogs]     = useState<DesigLog[]>([]);
  const [allocs, setAllocs]           = useState<AllocRecord[]>([]);
  const [members, setMembers]         = useState<HouseholdMember[]>([]);
  const [relationTypes, setRelTypes]  = useState<RelationType[]>([]);
  const [loadingStaff, setLoadingStaff]     = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab, setActiveTab]     = useState("profile");

  // Household member add/edit modal
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember]     = useState<HouseholdMember | null>(null);
  const [savingMember, setSavingMember]       = useState(false);
  const [memberForm] = Form.useForm();
  const [uploadingPhotoId, setUploadingPhotoId] = useState<number | null>(null);

  function loadAll(id: number) {
    setLoadingStaff(true);
    api.get<StaffDetail>(`/staff/${id}`)
      .then((r) => setStaff(r.data))
      .finally(() => setLoadingStaff(false));

    setLoadingHistory(true);
    Promise.all([
      api.get<DesigLog[]>(`/staff/${id}/designation-history`),
      api.get<AllocRecord[]>(`/allocations/staff/${id}/history`),
      api.get<HouseholdMember[]>(`/household-members/staff/${id}`),
    ]).then(([dRes, aRes, hRes]) => {
      setDesigLogs(dRes.data);
      setAllocs(aRes.data);
      setMembers(hRes.data);
    }).finally(() => setLoadingHistory(false));
  }

  useEffect(() => {
    if (!open || !staffId) return;
    setActiveTab("profile");
    loadAll(staffId);
    api.get<RelationType[]>("/lookups/relation-types")
      .then((r) => setRelTypes(r.data))
      .catch(() => {});
  }, [open, staffId]);

  const name = staff ? (lang === "bn" ? staff.name_bn : staff.name_en) : "";

  // ─── Active allocation for household member creation ───────────────────────
  const activeAlloc = allocs.find((a) => a.status === "ACTIVE");

  // ─── Household member handlers ─────────────────────────────────────────────

  function openAddMember() {
    setEditingMember(null);
    memberForm.resetFields();
    setMemberModalOpen(true);
  }

  function openEditMember(m: HouseholdMember) {
    setEditingMember(m);
    memberForm.setFieldsValue({
      name_en: m.name_en,
      name_bn: m.name_bn,
      relation_type_id: m.relation_type?.id,
      date_of_birth: m.date_of_birth ? dayjs(m.date_of_birth) : undefined,
      identity_number: m.identity_number ?? "",
    });
    setMemberModalOpen(true);
  }

  async function saveMember() {
    const vals = await memberForm.validateFields();
    setSavingMember(true);
    try {
      const payload = {
        ...vals,
        date_of_birth: vals.date_of_birth ? vals.date_of_birth.format("YYYY-MM-DD") : undefined,
      };
      if (editingMember) {
        await api.patch(`/household-members/${editingMember.id}`, payload);
        message.success("Member updated");
      } else {
        if (!activeAlloc) { message.error("No active quarter allocation for this staff"); return; }
        await api.post("/household-members", {
          ...payload,
          staff_id: staffId,
          allocation_id: activeAlloc.id,
        });
        message.success("Member added");
      }
      setMemberModalOpen(false);
      if (staffId) loadAll(staffId);
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? "Error saving member");
    } finally {
      setSavingMember(false);
    }
  }

  async function removeMember(id: number) {
    try {
      await api.delete(`/household-members/${id}`);
      message.success("Member removed");
      if (staffId) loadAll(staffId);
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? "Error removing member");
    }
  }

  async function handleMemberPhoto(memberId: number, file: File) {
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      message.error("Only JPG/PNG accepted"); return;
    }
    if (file.size > 500 * 1024) { message.error("Max 500 KB"); return; }
    setUploadingPhotoId(memberId);
    try {
      const fd = new FormData();
      fd.append("photo", file);
      await api.post(`/household-members/${memberId}/photo`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      message.success("Photo updated");
      if (staffId) loadAll(staffId);
    } finally {
      setUploadingPhotoId(null);
    }
  }

  // ─── Table columns ────────────────────────────────────────────────────────

  const desigCols: ColumnsType<DesigLog> = [
    {
      title: "Effective Date",
      dataIndex: "effective_date",
      width: 120,
      render: (v: string) => dayjs(v).format("DD MMM YYYY"),
    },
    {
      title: "From",
      dataIndex: "old_designation",
      render: (v: string | null) => v || <Text type="secondary">—</Text>,
    },
    {
      title: "To",
      dataIndex: "new_designation",
      render: (v: string) => <Text strong>{v}</Text>,
    },
    {
      title: "Changed By",
      key: "by",
      width: 140,
      render: (_: unknown, row: DesigLog) =>
        row.changed_by_user?.full_name_en ?? row.changed_by_user?.username ?? "—",
    },
  ];

  const allocCols: ColumnsType<AllocRecord> = [
    {
      title: "Quarter",
      key: "quarter",
      render: (_: unknown, row: AllocRecord) =>
        row.staff_quarter
          ? `${row.staff_quarter.category?.name_en ?? ""} — Q${row.staff_quarter.quarter_number} (${row.staff_quarter.location})`
          : "—",
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

  const memberCols: ColumnsType<HouseholdMember> = [
    {
      title: "",
      key: "photo",
      width: 46,
      render: (_: unknown, row: HouseholdMember) => (
        <Upload
          accept="image/jpeg,image/png"
          showUploadList={false}
          beforeUpload={(file) => { handleMemberPhoto(row.id, file); return false; }}
        >
          <div style={{ position: "relative", display: "inline-block", cursor: "pointer" }}>
            {uploadingPhotoId === row.id
              ? <Avatar size={32} icon={<LoadingOutlined />} />
              : <Avatar src={photoUrl(row.photo_path)} icon={!row.photo_path ? <UserOutlined /> : undefined} size={32} />
            }
            <div style={{
              position: "absolute", bottom: -1, right: -1,
              background: "#fff", borderRadius: "50%", lineHeight: 1,
              boxShadow: "0 1px 3px rgba(0,0,0,0.25)", padding: 1,
            }}>
              <CameraOutlined style={{ fontSize: 8, color: "#555" }} />
            </div>
          </div>
        </Upload>
      ),
    },
    {
      title: "Name",
      key: "name",
      render: (_: unknown, row: HouseholdMember) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: 13 }}>{row.name_en}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{row.name_bn}</Text>
        </Space>
      ),
    },
    {
      title: "Relation",
      key: "relation",
      width: 110,
      render: (_: unknown, row: HouseholdMember) =>
        row.relation_type ? (lang === "bn" ? row.relation_type.name_bn : row.relation_type.name_en) : "—",
    },
    {
      title: "DOB",
      dataIndex: "date_of_birth",
      width: 110,
      render: (v: string | null) => v ? dayjs(v).format("DD MMM YYYY") : "—",
    },
    {
      title: "ID No.",
      dataIndex: "identity_number",
      render: (v: string | null) => v || <Text type="secondary">—</Text>,
    },
    {
      title: "",
      key: "actions",
      width: 80,
      render: (_: unknown, row: HouseholdMember) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditMember(row)} />
          <Popconfirm
            title="Remove this member?"
            onConfirm={() => removeMember(row.id)}
            okText="Remove"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const activeMembers = members.filter((m) => m.is_active);

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        width={740}
        title={
          <Space>
            <Avatar
              src={photoUrl(staff?.photo_path)}
              icon={!staff?.photo_path ? <UserOutlined /> : undefined}
              size={36}
              style={!staff?.photo_path ? { background: "#0e7c5c" } : undefined}
            />
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{name || "Staff Detail"}</div>
              {staff && <div style={{ fontSize: 12, color: "#888", fontWeight: 400 }}>{staff.internal_user_id}</div>}
            </div>
          </Space>
        }
        extra={
          <Button icon={<EditOutlined />} onClick={onEdit} style={{ borderColor: "#1a4b8c", color: "#1a4b8c" }}>
            Edit
          </Button>
        }
      >
        {loadingStaff ? (
          <div style={{ textAlign: "center", paddingTop: 60 }}><Spin size="large" /></div>
        ) : staff ? (
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: "profile",
                label: "Profile",
                children: (
                  <Descriptions bordered size="small" column={1} labelStyle={{ width: 160 }}>
                    <Descriptions.Item label="User ID">
                      <Text code>{staff.internal_user_id}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Name (English)">{staff.name_en}</Descriptions.Item>
                    <Descriptions.Item label="নাম (বাংলা)">{staff.name_bn}</Descriptions.Item>
                    <Descriptions.Item label="Designation">{staff.designation}</Descriptions.Item>
                    <Descriptions.Item label="Department">
                      {staff.department ? (lang === "bn" ? staff.department.name_bn : staff.department.name_en) : "—"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Grade">{staff.grade ?? "—"}</Descriptions.Item>
                    <Descriptions.Item label="Employee Class">
                      {staff.employee_class ? (
                        <Tag color={CLASS_COLOR[staff.employee_class] ?? "default"}>
                          {staff.employee_class.replace("_", "-")}
                        </Tag>
                      ) : "—"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Mobile">{staff.mobile ?? "—"}</Descriptions.Item>
                    <Descriptions.Item label="Gender">{staff.gender}</Descriptions.Item>
                    <Descriptions.Item label="Marital Status">{staff.marital_status ?? "—"}</Descriptions.Item>
                    <Descriptions.Item label="Service Status">
                      <Tag color={STATUS_COLOR[staff.service_status] ?? "default"}>{staff.service_status}</Tag>
                    </Descriptions.Item>
                  </Descriptions>
                ),
              },
              {
                key: "desig",
                label: (
                  <Badge count={desigLogs.length} size="small" color="blue" offset={[6, 0]}>
                    Designation History
                  </Badge>
                ),
                children: loadingHistory ? (
                  <Spin />
                ) : desigLogs.length === 0 ? (
                  <Empty description="No designation changes recorded" />
                ) : (
                  <Table
                    rowKey="id"
                    columns={desigCols}
                    dataSource={desigLogs}
                    size="small"
                    pagination={false}
                  />
                ),
              },
              {
                key: "alloc",
                label: (
                  <Badge count={allocs.length} size="small" color="green" offset={[6, 0]}>
                    Quarter History
                  </Badge>
                ),
                children: loadingHistory ? (
                  <Spin />
                ) : allocs.length === 0 ? (
                  <Empty description="No quarter allocations recorded" />
                ) : (
                  <Table
                    rowKey="id"
                    columns={allocCols}
                    dataSource={allocs}
                    size="small"
                    pagination={false}
                  />
                ),
              },
              {
                key: "household",
                label: (
                  <Badge count={activeMembers.length} size="small" color="orange" offset={[6, 0]}>
                    Household Members
                  </Badge>
                ),
                children: (
                  <div>
                    <div style={{ marginBottom: 12, textAlign: "right" }}>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        size="small"
                        disabled={!activeAlloc}
                        onClick={openAddMember}
                        style={{ background: "#1a4b8c" }}
                        title={!activeAlloc ? "No active quarter allocation" : undefined}
                      >
                        Add Member
                      </Button>
                    </div>
                    {loadingHistory ? (
                      <Spin />
                    ) : activeMembers.length === 0 ? (
                      <Empty description="No household members" />
                    ) : (
                      <Table
                        rowKey="id"
                        columns={memberCols}
                        dataSource={activeMembers}
                        size="small"
                        pagination={false}
                      />
                    )}
                  </div>
                ),
              },
            ]}
          />
        ) : (
          <Empty />
        )}
      </Drawer>

      {/* Add / Edit Household Member Modal */}
      <Modal
        open={memberModalOpen}
        title={editingMember ? "Edit Household Member" : "Add Household Member"}
        onOk={saveMember}
        onCancel={() => setMemberModalOpen(false)}
        confirmLoading={savingMember}
        okText="Save"
        destroyOnHidden
        width={560}
      >
        <Form form={memberForm} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="name_en" label="Name (English)" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="name_bn" label="নাম (বাংলা)">
            <Input />
          </Form.Item>
          <Form.Item name="relation_type_id" label="Relation" rules={[{ required: true }]}>
            <Select placeholder="Select relation">
              {relationTypes.map((r) => (
                <Option key={r.id} value={r.id}>{lang === "bn" ? r.name_bn : r.name_en}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="date_of_birth" label="Date of Birth">
            <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="identity_number" label="Identity Number (NID / Birth Cert)">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
