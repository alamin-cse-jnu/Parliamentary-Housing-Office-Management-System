import { useState, useEffect, useCallback, type ReactNode } from "react";
import {
  Card, Table, Select, Button, Tag, Typography, Space, Row, Col,
  Modal, Form, DatePicker, Input, message, Popconfirm, Drawer,
  Divider, Avatar, Upload, Alert,
} from "antd";
import {
  ReloadOutlined, PlusOutlined, StopOutlined, TeamOutlined,
  DeleteOutlined, UserOutlined, CameraOutlined, LoadingOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import api from "../../services/api";
import { photoUrl } from "../../services/photoUrl";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface Mp    { id: number; name_en: string; parliament_number: string }
interface Staff { id: number; name_en: string; internal_user_id: string }
interface Asset { id: number; label: string }
interface RelationType { id: number; name_en: string; name_bn: string }

interface HouseholdMember {
  id: number;
  name_en: string;
  name_bn: string;
  date_of_birth: string | null;
  identity_number: string | null;
  photo_path: string | null;
  relation_type: { name_en: string } | null;
}

interface Allocation {
  id: number;
  allocation_type: "OFFICE" | "MP_FLAT" | "STAFF_QUARTER";
  occupant_type: "MP" | "STAFF";
  status: string;
  allotment_date: string;
  vacated_date: string | null;
  remarks: string | null;
  mp: { id: number; name_en: string; parliament_number: string } | null;
  staff: { id: number; name_en: string; internal_user_id: string } | null;
  mp_office: { room_number: string; building: { name_en: string } | null } | null;
  mp_flat: { flat_number: string; building_name: string | null } | null;
  staff_quarter: { quarter_number: string; location: string } | null;
}

const ALLOC_TYPE_COLOR: Record<string, string> = {
  OFFICE: "cyan", MP_FLAT: "purple", STAFF_QUARTER: "geekblue",
};
const ALLOC_TYPE_LABEL: Record<string, string> = {
  OFFICE: "MP Office", MP_FLAT: "MP Flat", STAFF_QUARTER: "Staff Quarter",
};
const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "green", Active: "green", VACATED: "red", Vacated: "red",
};

function assetLabel(alloc: Allocation): string {
  if (alloc.allocation_type === "OFFICE" && alloc.mp_office)
    return `${alloc.mp_office.building?.name_en ?? "?"} — Room ${alloc.mp_office.room_number}`;
  if (alloc.allocation_type === "MP_FLAT" && alloc.mp_flat)
    return `Flat ${alloc.mp_flat.flat_number}${alloc.mp_flat.building_name ? ` (${alloc.mp_flat.building_name})` : ""}`;
  if (alloc.allocation_type === "STAFF_QUARTER" && alloc.staff_quarter)
    return `Quarter ${alloc.staff_quarter.quarter_number} — ${alloc.staff_quarter.location}`;
  return "—";
}

function occupantLabel(alloc: Allocation): ReactNode {
  if (alloc.mp)
    return (
      <Space direction="vertical" size={0}>
        <Text>{alloc.mp.name_en}</Text>
        <Text type="secondary" style={{ fontSize: 11 }}>#{alloc.mp.parliament_number}</Text>
      </Space>
    );
  if (alloc.staff)
    return (
      <Space direction="vertical" size={0}>
        <Text>{alloc.staff.name_en}</Text>
        <Text type="secondary" style={{ fontSize: 11 }}>{alloc.staff.internal_user_id}</Text>
      </Space>
    );
  return <Text type="secondary">—</Text>;
}

const isActive = (alloc: Allocation) =>
  alloc.status === "ACTIVE" || alloc.status === "Active";

export function AllocationsPage() {
  const { t } = useTranslation();

  const [data, setData]       = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<{ type?: string; status?: string; occupant_type?: string }>({});

  // New allocation modal
  const [createOpen, setCreateOpen]   = useState(false);
  const [saving, setSaving]           = useState(false);
  const [form]                        = Form.useForm();
  const [allocType, setAllocType]     = useState<string>("");
  const [assets, setAssets]           = useState<Asset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [mps, setMps]                 = useState<Mp[]>([]);
  const [staffList, setStaffList]     = useState<Staff[]>([]);
  const [occupantActiveAllocs, setOccupantActiveAllocs] = useState<Allocation[]>([]);
  const [checkingOccupant, setCheckingOccupant]         = useState(false);

  // Vacate modal
  const [vacateOpen, setVacateOpen]     = useState(false);
  const [vacateTarget, setVacateTarget] = useState<Allocation | null>(null);
  const [vacateForm]                    = Form.useForm();
  const [vacating, setVacating]         = useState(false);

  // Household members drawer
  const [drawerOpen, setDrawerOpen]       = useState(false);
  const [drawerAlloc, setDrawerAlloc]     = useState<Allocation | null>(null);
  const [members, setMembers]             = useState<HouseholdMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [relationTypes, setRelationTypes] = useState<RelationType[]>([]);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [memberForm]                      = Form.useForm();
  const [savingMember, setSavingMember]   = useState(false);
  const [uploadingMemberId, setUploadingMemberId] = useState<number | null>(null);

  const fetchData = useCallback(async (f = filters) => {
    setLoading(true);
    try {
      const params: Record<string, any> = { ...f };
      Object.keys(params).forEach((k) => params[k] === undefined && delete params[k]);
      const res = await api.get<Allocation[]>("/allocations", { params });
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
    api.get<Mp[]>("/mp").then((r) => setMps(r.data)).catch(() => {});
    api.get<Staff[]>("/staff").then((r) => setStaffList(r.data)).catch(() => {});
    api.get<RelationType[]>("/lookups/relation-types").then((r) => setRelationTypes(r.data)).catch(() => {});
  }, []);

  function applyFilters(overrides: typeof filters) {
    const next = { ...filters, ...overrides };
    setFilters(next);
    fetchData(next);
  }

  // ─── Allocation create ────────────────────────────────────────────────────

  async function onOccupantChange(occupantId: number | undefined) {
    setOccupantActiveAllocs([]);
    if (!occupantId || !allocType) return;
    setCheckingOccupant(true);
    try {
      const endpoint = allocType === "STAFF_QUARTER"
        ? `/allocations/staff/${occupantId}`
        : `/allocations/mp/${occupantId}`;
      const res = await api.get<Allocation[]>(endpoint);
      setOccupantActiveAllocs(res.data);
    } catch {
      // silently ignore — backend will catch it on submit
    } finally {
      setCheckingOccupant(false);
    }
  }

  async function onAllocTypeChange(type: string) {
    setAllocType(type);
    form.setFieldsValue({ asset_id: undefined, occupant_id: undefined });
    setAssets([]);
    setOccupantActiveAllocs([]);
    if (!type) return;
    setLoadingAssets(true);
    try {
      const endpointMap: Record<string, string> = {
        OFFICE: "/offices", MP_FLAT: "/mp-flats", STAFF_QUARTER: "/quarters",
      };
      const res = await api.get<any[]>(endpointMap[type], { params: { status: "VACANT" } });
      setAssets(res.data.map((a: any) => ({
        id: a.id,
        label: type === "OFFICE"
          ? `${a.building?.name_en ?? "?"} — Room ${a.room_number}`
          : type === "MP_FLAT"
          ? `Flat ${a.flat_number} (${a.building_name ?? a.location_name})`
          : `Quarter ${a.quarter_number} — ${a.location}`,
      })));
    } finally {
      setLoadingAssets(false);
    }
  }

  const newAllocOccupantType = allocType === "STAFF_QUARTER" ? "STAFF" : "MP";

  function openCreate() {
    setAllocType("");
    setAssets([]);
    setOccupantActiveAllocs([]);
    form.resetFields();
    setCreateOpen(true);
  }

  async function submitCreate() {
    const vals = await form.validateFields();
    setSaving(true);
    try {
      await api.post("/allocations", {
        allocation_type: vals.allocation_type,
        asset_id: vals.asset_id,
        occupant_type: newAllocOccupantType,
        occupant_id: vals.occupant_id,
        allotment_date: vals.allotment_date.format("YYYY-MM-DD"),
        remarks: vals.remarks,
      });
      message.success("Allocation created");
      setCreateOpen(false);
      fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? "Create failed");
    } finally {
      setSaving(false);
    }
  }

  // ─── Vacate ───────────────────────────────────────────────────────────────

  function openVacate(alloc: Allocation) {
    setVacateTarget(alloc);
    vacateForm.resetFields();
    vacateForm.setFieldsValue({ vacated_date: dayjs() });
    setVacateOpen(true);
  }

  async function submitVacate() {
    if (!vacateTarget) return;
    const vals = await vacateForm.validateFields();
    setVacating(true);
    try {
      await api.patch(`/allocations/${vacateTarget.id}/vacate`, {
        vacated_date: vals.vacated_date.format("YYYY-MM-DD"),
        remarks: vals.remarks,
      });
      message.success("Allocation vacated");
      setVacateOpen(false);
      setVacateTarget(null);
      fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? "Vacate failed");
    } finally {
      setVacating(false);
    }
  }

  // ─── Household Members ────────────────────────────────────────────────────

  async function openMembersDrawer(alloc: Allocation) {
    setDrawerAlloc(alloc);
    setMembers([]);
    setDrawerOpen(true);
    setLoadingMembers(true);
    try {
      const res = await api.get<HouseholdMember[]>(`/household-members/allocation/${alloc.id}`);
      setMembers(res.data);
    } catch {
      message.error("Failed to load household members");
    } finally {
      setLoadingMembers(false);
    }
  }

  function openAddMember() {
    memberForm.resetFields();
    setAddMemberOpen(true);
  }

  async function submitAddMember() {
    if (!drawerAlloc || !drawerAlloc.staff) return;
    const vals = await memberForm.validateFields();
    setSavingMember(true);
    try {
      await api.post("/household-members", {
        staff_id: drawerAlloc.staff.id,
        allocation_id: drawerAlloc.id,
        name_en: vals.name_en,
        name_bn: vals.name_bn,
        relation_type_id: vals.relation_type_id,
        date_of_birth: vals.date_of_birth ? vals.date_of_birth.format("YYYY-MM-DD") : undefined,
        identity_number: vals.identity_number,
      });
      message.success("Member added");
      setAddMemberOpen(false);
      // Refresh members list
      const res = await api.get<HouseholdMember[]>(`/household-members/allocation/${drawerAlloc.id}`);
      setMembers(res.data);
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? "Failed to add member");
    } finally {
      setSavingMember(false);
    }
  }

  async function removeMember(memberId: number) {
    try {
      await api.delete(`/household-members/${memberId}`);
      message.success("Member removed");
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? "Failed to remove member");
    }
  }

  async function handleMemberPhotoUpload(id: number, file: File) {
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      message.error("Only JPG/PNG accepted"); return;
    }
    if (file.size > 500 * 1024) {
      message.error("Max file size is 500 KB"); return;
    }
    setUploadingMemberId(id);
    try {
      const fd = new FormData();
      fd.append("photo", file);
      const res = await api.post<HouseholdMember>(`/household-members/${id}/photo`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      message.success("Photo updated");
      setMembers((prev) => prev.map((m) => m.id === id ? { ...m, photo_path: res.data.photo_path } : m));
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? "Upload failed");
    } finally {
      setUploadingMemberId(null);
    }
  }

  // ─── Table ────────────────────────────────────────────────────────────────

  const columns: ColumnsType<Allocation> = [
    {
      title: t("asset_type"),
      dataIndex: "allocation_type",
      width: 130,
      render: (v: string) => <Tag color={ALLOC_TYPE_COLOR[v]}>{ALLOC_TYPE_LABEL[v]}</Tag>,
    },
    {
      title: t("asset"),
      key: "asset",
      render: (_: unknown, row: Allocation) => <Text>{assetLabel(row)}</Text>,
    },
    {
      title: t("occupant"),
      key: "occupant",
      render: (_: unknown, row: Allocation) => occupantLabel(row),
    },
    {
      title: t("allotment_date"),
      dataIndex: "allotment_date",
      width: 120,
      render: (v: string) => dayjs(v).format("DD/MM/YYYY"),
    },
    {
      title: t("vacated_date"),
      dataIndex: "vacated_date",
      width: 120,
      render: (v: string | null) => v ? dayjs(v).format("DD/MM/YYYY") : <Text type="secondary">—</Text>,
    },
    {
      title: t("status"),
      dataIndex: "status",
      width: 90,
      render: (v: string) => <Tag color={STATUS_COLOR[v] ?? "default"}>{v}</Tag>,
    },
    {
      title: "",
      key: "actions",
      width: 160,
      render: (_: unknown, row: Allocation) => (
        <Space>
          {row.allocation_type === "STAFF_QUARTER" && isActive(row) && (
            <Button
              size="small"
              icon={<TeamOutlined />}
              onClick={() => openMembersDrawer(row)}
            >
              Members
            </Button>
          )}
          {isActive(row) && (
            <Popconfirm
              title="Vacate this allocation?"
              description="This will mark the asset as vacant."
              onConfirm={() => openVacate(row)}
              okText="Set Vacate Date"
              showCancel
            >
              <Button size="small" danger icon={<StopOutlined />}>Vacate</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div>
      <Row align="middle" justify="space-between" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={4} style={{ margin: 0, color: "#1a4b8c" }}>{t("allocations")}</Title>
        </Col>
        <Col>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => fetchData()} />
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}
              style={{ background: "#1a4b8c" }}>
              New Allocation
            </Button>
          </Space>
        </Col>
      </Row>

      <Card bordered={false} style={{ marginBottom: 16, borderRadius: 8 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={8} md={6}>
            <Select allowClear placeholder={t("asset_type")} style={{ width: "100%" }}
              onChange={(v) => applyFilters({ type: v })}>
              {Object.entries(ALLOC_TYPE_LABEL).map(([val, label]) => (
                <Option key={val} value={val}><Tag color={ALLOC_TYPE_COLOR[val]}>{label}</Tag></Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={8} md={5}>
            <Select allowClear placeholder={t("occupant")} style={{ width: "100%" }}
              onChange={(v) => applyFilters({ occupant_type: v })}>
              <Option value="MP">MP</Option>
              <Option value="STAFF">Staff</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={5}>
            <Select allowClear placeholder={t("status")} style={{ width: "100%" }}
              onChange={(v) => applyFilters({ status: v })}>
              <Option value="ACTIVE"><Tag color="green">Active</Tag></Option>
              <Option value="VACATED"><Tag color="red">Vacated</Tag></Option>
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
          pagination={{ pageSize: 50, showSizeChanger: true, pageSizeOptions: ["25", "50", "100"], showTotal: (total) => `${total} allocations` }}
          scroll={{ x: 1100 }}
        />
      </Card>

      {/* ── New Allocation Modal ──────────────────────────────────────────────── */}
      <Modal
        open={createOpen}
        title={<Space><PlusOutlined /><span>New Allocation</span></Space>}
        onOk={submitCreate}
        onCancel={() => setCreateOpen(false)}
        okText="Create Allocation"
        confirmLoading={saving}
        width={580}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="allocation_type" label="Asset Type" rules={[{ required: true }]}>
            <Select
              placeholder="Select asset type"
              onChange={(v) => { form.setFieldValue("allocation_type", v); onAllocTypeChange(v); }}
            >
              {Object.entries(ALLOC_TYPE_LABEL).map(([val, label]) => (
                <Option key={val} value={val}>
                  <Tag color={ALLOC_TYPE_COLOR[val]}>{label}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="asset_id" label="Asset (Vacant only)" rules={[{ required: true }]}>
            <Select
              placeholder={allocType ? "Select asset" : "Select asset type first"}
              disabled={!allocType}
              loading={loadingAssets}
              showSearch
              optionFilterProp="children"
            >
              {assets.map((a) => (
                <Option key={a.id} value={a.id}>{a.label}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label={newAllocOccupantType === "STAFF" ? "Staff Member" : "Member of Parliament"}
            name="occupant_id"
            rules={[{ required: true }]}
          >
            <Select
              placeholder={`Select ${newAllocOccupantType === "STAFF" ? "staff member" : "MP"}`}
              showSearch
              optionFilterProp="children"
              disabled={!allocType}
              loading={checkingOccupant}
              onChange={(v) => onOccupantChange(v as number | undefined)}
            >
              {newAllocOccupantType === "STAFF"
                ? staffList.map((s) => (
                    <Option key={s.id} value={s.id}>
                      {s.name_en} ({s.internal_user_id})
                    </Option>
                  ))
                : mps.map((m) => (
                    <Option key={m.id} value={m.id}>
                      {m.name_en} #{m.parliament_number}
                    </Option>
                  ))
              }
            </Select>
          </Form.Item>

          {(() => {
            const conflict = occupantActiveAllocs.find((a) => a.allocation_type === allocType);
            if (!conflict) return null;
            const who = newAllocOccupantType === "STAFF" ? "staff member" : "MP";
            const existing = assetLabel(conflict);
            return (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
                message="Duplicate Allocation"
                description={
                  <>
                    This {who} already has an active <strong>{ALLOC_TYPE_LABEL[allocType]}</strong> allocation:{" "}
                    <strong>{existing}</strong>.
                    <br />
                    Vacate the existing allocation before assigning a new one.
                  </>
                }
              />
            );
          })()}

          <Form.Item name="allotment_date" label="Allotment Date (Received Date)" rules={[{ required: true }]}>
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item name="remarks" label="Remarks">
            <TextArea rows={2} placeholder="Optional notes" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Vacate Modal ─────────────────────────────────────────────────────── */}
      <Modal
        open={vacateOpen}
        title={<Space><StopOutlined /><span>Vacate Allocation</span></Space>}
        onOk={submitVacate}
        onCancel={() => { setVacateOpen(false); setVacateTarget(null); }}
        okText="Confirm Vacate"
        okButtonProps={{ danger: true }}
        confirmLoading={vacating}
        destroyOnHidden
      >
        {vacateTarget && (
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary">Asset: </Text>
            <Text strong>{assetLabel(vacateTarget)}</Text>
            <br />
            <Text type="secondary">Occupant: </Text>
            <Text strong>{vacateTarget.mp?.name_en ?? vacateTarget.staff?.name_en ?? "—"}</Text>
          </div>
        )}
        <Form form={vacateForm} layout="vertical">
          <Form.Item name="vacated_date" label="Handover / Vacate Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="remarks" label="Remarks">
            <TextArea rows={2} placeholder="Optional handover notes" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Household Members Drawer ─────────────────────────────────────────── */}
      <Drawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setDrawerAlloc(null); setAddMemberOpen(false); }}
        title={
          drawerAlloc
            ? `Household Members — ${drawerAlloc.staff_quarter?.quarter_number ?? ""} — ${drawerAlloc.staff?.name_en ?? ""}`
            : "Household Members"
        }
        width={540}
        extra={
          drawerAlloc && isActive(drawerAlloc) ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={openAddMember}
              style={{ background: "#1a4b8c" }}>
              Add Member
            </Button>
          ) : undefined
        }
      >
        {/* Current members list */}
        {loadingMembers ? (
          <Text type="secondary">Loading...</Text>
        ) : members.length === 0 ? (
          <Text type="secondary">No household members registered for this allocation.</Text>
        ) : (
          members.map((m) => (
            <Card
              key={m.id}
              size="small"
              style={{ marginBottom: 10 }}
              extra={
                <Popconfirm
                  title="Remove this member?"
                  onConfirm={() => removeMember(m.id)}
                  okText="Remove"
                  okButtonProps={{ danger: true }}
                >
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              }
            >
              <Space>
                <Upload
                  accept="image/jpeg,image/png"
                  showUploadList={false}
                  beforeUpload={(file) => { handleMemberPhotoUpload(m.id, file); return false; }}
                >
                  <div style={{ position: "relative", display: "inline-block", cursor: "pointer" }}>
                    {uploadingMemberId === m.id
                      ? <Avatar size={40} icon={<LoadingOutlined />} />
                      : <Avatar
                          src={photoUrl(m.photo_path)}
                          icon={!m.photo_path ? <UserOutlined /> : undefined}
                          size={40}
                        />
                    }
                    <div style={{
                      position: "absolute", bottom: -1, right: -1,
                      background: "#fff", borderRadius: "50%", lineHeight: 1,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.25)", padding: 2,
                    }}>
                      <CameraOutlined style={{ fontSize: 9, color: "#555" }} />
                    </div>
                  </div>
                </Upload>
                <div>
                  <div><Text strong>{m.name_en}</Text></div>
                  <div><Text type="secondary" style={{ fontSize: 12 }}>{m.name_bn}</Text></div>
                  <Space size={12} style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                    {m.relation_type && <span>{m.relation_type.name_en}</span>}
                    {m.date_of_birth && <span>DOB: {dayjs(m.date_of_birth).format("DD/MM/YYYY")}</span>}
                    {m.identity_number && <span>ID: {m.identity_number}</span>}
                  </Space>
                </div>
              </Space>
            </Card>
          ))
        )}

        {/* Add Member inline form */}
        {addMemberOpen && (
          <>
            <Divider />
            <Text strong style={{ display: "block", marginBottom: 12 }}>Add New Member</Text>
            <Form form={memberForm} layout="vertical">
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="name_en" label="Name (English)" rules={[{ required: true }]}>
                    <Input placeholder="Full name" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="name_bn" label="নাম (বাংলা)" rules={[{ required: true }]}>
                    <Input placeholder="বাংলায় নাম" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="relation_type_id" label="Relation" rules={[{ required: true }]}>
                    <Select placeholder="Select relation">
                      {relationTypes.map((r) => (
                        <Option key={r.id} value={r.id}>{r.name_en}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="date_of_birth" label="Date of Birth">
                    <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="identity_number" label="NID / Birth Cert. No.">
                <Input placeholder="Identity number" />
              </Form.Item>
              <Row justify="end">
                <Space>
                  <Button onClick={() => setAddMemberOpen(false)}>Cancel</Button>
                  <Button type="primary" loading={savingMember} onClick={submitAddMember}
                    style={{ background: "#1a4b8c" }}>
                    Save Member
                  </Button>
                </Space>
              </Row>
            </Form>
          </>
        )}
      </Drawer>
    </div>
  );
}
