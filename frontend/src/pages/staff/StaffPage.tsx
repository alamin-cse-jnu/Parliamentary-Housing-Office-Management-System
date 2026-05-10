import { useState, useEffect, useCallback } from "react";
import {
  Card, Table, Select, Input, Button, Tag, Typography, Space, Row, Col, Avatar,
  Modal, Upload, Alert, Divider, Steps, message, Badge, Form, InputNumber, AutoComplete,
} from "antd";
import { StaffDetailDrawer } from "./StaffDetailDrawer";
import {
  ReloadOutlined, UserOutlined, UploadOutlined, PlusOutlined,
  CheckCircleOutlined, CloseCircleOutlined, InboxOutlined, EditOutlined,
  CameraOutlined, LoadingOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { ColumnsType } from "antd/es/table";
import api from "../../services/api";
import { photoUrl } from "../../services/photoUrl";
import { useLang } from "../../hooks/useLang";

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;
const { Dragger } = Upload;

interface Department { id: number; name_en: string; name_bn: string }

interface Staff {
  id: number;
  internal_user_id: string;
  name_bn: string;
  name_en: string;
  designation: string;
  department: { id: number; name_en: string; name_bn: string } | null;
  grade: number | null;
  employee_class: string | null;
  service_status: string;
  mobile: string | null;
  photo_path: string | null;
  gender: string;
  marital_status: string | null;
}

interface ParsedRow {
  internal_user_id: string;
  name_en: string;
  name_bn: string;
  mobile: string;
  employee_class: string;
  grade: number;
  department: string;
  designation: string;
  gender: string;
  marital_status: string;
}
interface ErrorRow { row: number; data: any; reason: string }
interface PreviewResult { valid_count: number; error_count: number; valid_rows: ParsedRow[]; error_rows: ErrorRow[] }

const STATUS_COLOR: Record<string, string> = {
  Active: "green", Retired: "orange", Transferred: "blue", Deceased: "red",
  ACTIVE: "green", RETIRED: "orange", TRANSFERRED: "blue", DECEASED: "red",
};
const CLASS_COLOR: Record<string, string> = {
  "Class-1": "purple", CLASS_1: "purple",
  "Class-2": "blue",   CLASS_2: "blue",
  "Class-3": "cyan",   CLASS_3: "cyan",
  "Class-4": "default",CLASS_4: "default",
  "No Class": "default",NO_CLASS: "default",
};

const EMPLOYEE_CLASSES = [
  { value: "CLASS_1", label: "Class-1" },
  { value: "CLASS_2", label: "Class-2" },
  { value: "CLASS_3", label: "Class-3" },
  { value: "CLASS_4", label: "Class-4" },
  { value: "NO_CLASS", label: "No Class" },
];

const SERVICE_STATUSES = ["ACTIVE", "RETIRED", "TRANSFERRED", "DECEASED"];
const GENDERS = ["MALE", "FEMALE", "OTHER"];
const MARITAL_STATUSES = ["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"];

export function StaffPage() {
  const { t } = useTranslation();
  const { lang } = useLang();

  const [data, setData]                 = useState<Staff[]>([]);
  const [departments, setDepts]         = useState<Department[]>([]);
  const [desigOptions, setDesigOptions] = useState<{ value: string }[]>([]);
  const [loading, setLoading]           = useState(false);
  const [uploadingPhotoId, setUploadingPhotoId] = useState<number | null>(null);

  // Detail drawer
  const [detailOpen, setDetailOpen]     = useState(false);
  const [detailStaffId, setDetailStaffId] = useState<number | null>(null);

  // Create/Edit modal state
  const [createOpen, setCreateOpen]   = useState(false);
  const [editOpen, setEditOpen]       = useState(false);
  const [editTarget, setEditTarget]   = useState<Staff | null>(null);
  const [saving, setSaving]           = useState(false);
  const [createForm]                  = Form.useForm();
  const [editForm]                    = Form.useForm();

  // Upload state
  const [uploadOpen, setUploadOpen]   = useState(false);
  const [uploadStep, setUploadStep]   = useState(0);
  const [bnFile, setBnFile]           = useState<File | null>(null);
  const [enFile, setEnFile]           = useState<File | null>(null);
  const [parsing, setParsing]         = useState(false);
  const [confirming, setConfirming]   = useState(false);
  const [mergedValid, setMergedValid] = useState<ParsedRow[]>([]);
  const [allErrors, setAllErrors]     = useState<ErrorRow[]>([]);
  const [previewTab, setPreviewTab]   = useState("valid");

  const [filters, setFilters] = useState<{
    status?: string; department_id?: number; grade?: number;
    employee_class?: string; search?: string;
  }>({});

  const fetchData = useCallback(async (f = filters) => {
    setLoading(true);
    try {
      const params: Record<string, any> = { ...f };
      Object.keys(params).forEach((k) => params[k] === undefined && delete params[k]);
      const res = await api.get<Staff[]>("/staff", { params });
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchDepts = useCallback(() => {
    api.get<Department[]>("/lookups/departments").then((r) => setDepts(r.data)).catch(() => {});
  }, []);

  async function handlePhotoUpload(id: number, file: File) {
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      message.error("Only JPG/PNG accepted"); return;
    }
    if (file.size > 500 * 1024) {
      message.error("Max file size is 500 KB"); return;
    }
    setUploadingPhotoId(id);
    try {
      const fd = new FormData();
      fd.append("photo", file);
      await api.post(`/staff/${id}/photo`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      message.success("Photo updated");
      fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? "Upload failed");
    } finally {
      setUploadingPhotoId(null);
    }
  }

  useEffect(() => {
    fetchData();
    fetchDepts();
    api.get<{ id: number; name_en: string }[]>("/lookups/staff-designations")
      .then((r) => setDesigOptions(r.data.map((d) => ({ value: d.name_en }))))
      .catch(() => {});
  }, []);

  function applyFilters(overrides: typeof filters) {
    const next = { ...filters, ...overrides };
    setFilters(next);
    fetchData(next);
  }

  // ─── Create ────────────────────────────────────────────────────────────────

  function openCreate() {
    createForm.resetFields();
    setCreateOpen(true);
  }

  async function submitCreate() {
    const values = await createForm.validateFields();
    setSaving(true);
    try {
      await api.post("/staff", values);
      message.success("Staff member created");
      setCreateOpen(false);
      fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? "Create failed");
    } finally {
      setSaving(false);
    }
  }

  // ─── Edit ──────────────────────────────────────────────────────────────────

  function openEdit(row: Staff) {
    setEditTarget(row);
    editForm.setFieldsValue({
      internal_user_id: row.internal_user_id,
      name_en: row.name_en,
      name_bn: row.name_bn,
      mobile: row.mobile ?? "",
      employee_class: row.employee_class ?? "NO_CLASS",
      grade: row.grade,
      designation: row.designation,
      department_id: row.department?.id,
      gender: row.gender,
      marital_status: row.marital_status ?? undefined,
      service_status: row.service_status,
    });
    setEditOpen(true);
  }

  async function submitEdit() {
    if (!editTarget) return;
    const values = await editForm.validateFields();
    setSaving(true);
    try {
      const designationChanged = values.designation && values.designation !== editTarget.designation;

      if (designationChanged) {
        await api.post(`/staff/${editTarget.id}/designation`, {
          new_designation: values.designation,
          effective_date: new Date().toISOString().split("T")[0],
        });
      }

      const { designation: _d, ...patchValues } = values;
      await api.patch(`/staff/${editTarget.id}`, {
        ...patchValues,
        ...(designationChanged ? { designation: values.designation } : {}),
      });

      message.success("Staff updated");
      setEditOpen(false);
      setEditTarget(null);
      fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? "Update failed");
    } finally {
      setSaving(false);
    }
  }

  // ─── Excel Upload ──────────────────────────────────────────────────────────

  function openUpload() {
    setUploadStep(0);
    setBnFile(null);
    setEnFile(null);
    setMergedValid([]);
    setAllErrors([]);
    setUploadOpen(true);
  }

  async function parseFiles() {
    if (!bnFile && !enFile) { message.warning("Upload at least one Excel file"); return; }
    setParsing(true);
    try {
      const results: PreviewResult[] = [];
      for (const file of [bnFile, enFile].filter(Boolean) as File[]) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await api.post<PreviewResult>("/staff/upload/preview", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        results.push(res.data);
      }

      const map = new Map<string, ParsedRow>();
      const errors: ErrorRow[] = [];
      for (const result of results) {
        for (const row of result.valid_rows) {
          const existing = map.get(row.internal_user_id);
          if (existing) {
            if (!existing.name_en && row.name_en) existing.name_en = row.name_en;
            if (!existing.name_bn && row.name_bn) existing.name_bn = row.name_bn;
          } else {
            map.set(row.internal_user_id, { ...row });
          }
        }
        errors.push(...result.error_rows);
      }

      setMergedValid(Array.from(map.values()));
      setAllErrors(errors);
      setUploadStep(1);
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? "Parse failed");
    } finally {
      setParsing(false);
    }
  }

  async function confirmImport() {
    setConfirming(true);
    try {
      await api.post("/staff/upload/confirm", { rows: mergedValid });
      message.success(`Imported ${mergedValid.length} staff successfully`);
      setUploadOpen(false);
      fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? "Import failed");
    } finally {
      setConfirming(false);
    }
  }

  const deptName = (d: Staff["department"]) => d ? (lang === "bn" ? d.name_bn : d.name_en) : "—";

  const columns: ColumnsType<Staff> = [
    {
      title: "",
      key: "photo",
      width: 50,
      render: (_: unknown, row: Staff) => (
        <Upload
          accept="image/jpeg,image/png"
          showUploadList={false}
          beforeUpload={(file) => { handlePhotoUpload(row.id, file); return false; }}
        >
          <div style={{ position: "relative", display: "inline-block", cursor: "pointer" }}>
            {uploadingPhotoId === row.id
              ? <Avatar size={34} icon={<LoadingOutlined />} />
              : row.photo_path
                ? <Avatar src={photoUrl(row.photo_path)} size={34} />
                : <Avatar icon={<UserOutlined />} size={34} style={{ background: "#0e7c5c" }} />
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
      ),
    },
    {
      title: t("internal_user_id"),
      dataIndex: "internal_user_id",
      width: 110,
      render: (v: string) => <Text code style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: t("name_en") + " / " + t("name_bn"),
      key: "name",
      render: (_: unknown, row: Staff) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: 13 }}>{row.name_en}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{row.name_bn}</Text>
        </Space>
      ),
    },
    { title: t("designation"), dataIndex: "designation" },
    {
      title: t("department"),
      key: "department",
      render: (_: unknown, row: Staff) => deptName(row.department),
    },
    {
      title: t("grade"),
      dataIndex: "grade",
      width: 70,
      render: (v: number | null) => v != null ? v : <Text type="secondary">—</Text>,
    },
    {
      title: t("employee_class"),
      dataIndex: "employee_class",
      width: 110,
      render: (v: string | null) => v
        ? <Tag color={CLASS_COLOR[v] ?? "default"} style={{ fontSize: 11 }}>{v.replace("_", "-")}</Tag>
        : <Text type="secondary">—</Text>,
    },
    {
      title: t("service_status"),
      dataIndex: "service_status",
      width: 110,
      render: (v: string) => <Tag color={STATUS_COLOR[v] ?? "default"}>{v}</Tag>,
    },
    {
      title: "",
      key: "actions",
      width: 70,
      render: (_: unknown, row: Staff) => (
        <Button
          size="small"
          icon={<EditOutlined />}
          onClick={() => openEdit(row)}
        >
          Edit
        </Button>
      ),
    },
  ];

  const previewValidCols: ColumnsType<ParsedRow> = [
    { title: t("internal_user_id"), dataIndex: "internal_user_id", width: 110 },
    { title: t("name_en"), dataIndex: "name_en" },
    { title: t("name_bn"), dataIndex: "name_bn" },
    { title: t("designation"), dataIndex: "designation" },
    { title: t("department"), dataIndex: "department" },
    { title: t("grade"), dataIndex: "grade", width: 70 },
    { title: t("employee_class"), dataIndex: "employee_class", width: 100 },
  ];

  const previewErrorCols: ColumnsType<ErrorRow> = [
    { title: "Row", dataIndex: "row", width: 60 },
    { title: "Reason", dataIndex: "reason" },
  ];

  const staffFormFields = (isEdit: boolean) => (
    <>
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item name="internal_user_id" label="User ID" rules={[{ required: true }]}>
            <Input disabled={isEdit} placeholder="e.g. STF-001" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name="department_id" label={t("department")} rules={[{ required: true }]}>
            <Select placeholder="Select department" allowClear showSearch
              optionFilterProp="children">
              {departments.map((d) => (
                <Option key={d.id} value={d.id}>{lang === "bn" ? d.name_bn : d.name_en}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item name="name_en" label="Name (English)" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name="name_bn" label="নাম (বাংলা)">
            <Input />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item name="designation" label={t("designation")} rules={[{ required: true }]}>
            <AutoComplete
              options={desigOptions}
              filterOption={(input, option) =>
                option!.value.toLowerCase().includes(input.toLowerCase())
              }
              placeholder="Type or select designation"
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name="mobile" label="Mobile">
            <Input placeholder="01XXXXXXXXX" />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Form.Item name="employee_class" label="Employee Class" rules={[{ required: true }]}>
            <Select>
              {EMPLOYEE_CLASSES.map((c) => (
                <Option key={c.value} value={c.value}>{c.label}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="grade" label="Grade" rules={[{ required: true }]}>
            <InputNumber min={1} max={20} style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="gender" label="Gender">
            <Select>
              {GENDERS.map((g) => <Option key={g} value={g}>{g}</Option>)}
            </Select>
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item name="marital_status" label="Marital Status">
            <Select allowClear>
              {MARITAL_STATUSES.map((s) => <Option key={s} value={s}>{s}</Option>)}
            </Select>
          </Form.Item>
        </Col>
        {isEdit && (
          <Col xs={24} sm={12}>
            <Form.Item name="service_status" label="Service Status">
              <Select>
                {SERVICE_STATUSES.map((s) => (
                  <Option key={s} value={s}>
                    <Tag color={STATUS_COLOR[s]}>{s}</Tag>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        )}
      </Row>
    </>
  );

  return (
    <div>
      <Row align="middle" justify="space-between" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={4} style={{ margin: 0, color: "#1a4b8c" }}>{t("staff")}</Title>
        </Col>
        <Col>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => fetchData()} />
            <Button icon={<UploadOutlined />} onClick={openUpload} style={{ borderColor: "#1a4b8c", color: "#1a4b8c" }}>
              {t("upload")}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}
              style={{ background: "#1a4b8c" }}>
              Add New
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Filters */}
      <Card bordered={false} style={{ marginBottom: 16, borderRadius: 8 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={5}>
            <Select allowClear placeholder={t("department")} style={{ width: "100%" }}
              onChange={(v) => applyFilters({ department_id: v })}>
              {departments.map((d) => (
                <Option key={d.id} value={d.id}>{lang === "bn" ? d.name_bn : d.name_en}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={6} md={4}>
            <Select allowClear placeholder={t("employee_class")} style={{ width: "100%" }}
              onChange={(v) => applyFilters({ employee_class: v })}>
              {EMPLOYEE_CLASSES.map((c) => (
                <Option key={c.value} value={c.value}>{c.label}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={6} md={3}>
            <Select allowClear placeholder={t("grade")} style={{ width: "100%" }}
              onChange={(v) => applyFilters({ grade: v })}>
              {Array.from({ length: 20 }, (_, i) => i + 1).map((g) => (
                <Option key={g} value={g}>{g}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select allowClear placeholder={t("service_status")} style={{ width: "100%" }}
              onChange={(v) => applyFilters({ status: v })}>
              {SERVICE_STATUSES.map((s) => (
                <Option key={s} value={s}><Tag color={STATUS_COLOR[s]}>{s}</Tag></Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Search placeholder={t("search")} allowClear
              onSearch={(v) => applyFilters({ search: v || undefined })} enterButton />
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card bordered={false} style={{ borderRadius: 8 }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          size="small"
          pagination={{ pageSize: 50, showSizeChanger: true, pageSizeOptions: ["25", "50", "100"], showTotal: (total) => `${total} staff` }}
          scroll={{ x: 1100 }}
          onRow={(row) => ({
            onClick: (e) => {
              const target = e.target as HTMLElement;
              if (target.closest(".ant-upload") || target.closest(".ant-btn")) return;
              setDetailStaffId(row.id);
              setDetailOpen(true);
            },
            style: { cursor: "pointer" },
          })}
        />
      </Card>

      {/* Detail Drawer */}
      <StaffDetailDrawer
        staffId={detailStaffId}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onEdit={() => {
          const s = data.find((m) => m.id === detailStaffId);
          if (s) { setDetailOpen(false); openEdit(s); }
        }}
      />

      {/* Create Modal */}
      <Modal
        open={createOpen}
        title={<Space><PlusOutlined /><span>Add New Staff Member</span></Space>}
        onCancel={() => setCreateOpen(false)}
        onOk={submitCreate}
        okText="Create"
        confirmLoading={saving}
        width={700}
        destroyOnHidden
      >
        <Form form={createForm} layout="vertical" style={{ marginTop: 16 }}>
          {staffFormFields(false)}
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={editOpen}
        title={
          <Space>
            <EditOutlined />
            <span>Edit Staff — {editTarget?.name_en}</span>
          </Space>
        }
        onCancel={() => { setEditOpen(false); setEditTarget(null); }}
        onOk={submitEdit}
        okText="Save Changes"
        confirmLoading={saving}
        width={700}
        destroyOnHidden
      >
        <Form form={editForm} layout="vertical" style={{ marginTop: 16 }}>
          {staffFormFields(true)}
        </Form>
        {editTarget && (
          <Alert
            type="info"
            showIcon
            style={{ marginTop: 8 }}
            message="Changing designation will log the change in the designation history."
          />
        )}
      </Modal>

      {/* Excel Upload Modal */}
      <Modal
        open={uploadOpen}
        title={
          <Space>
            <UploadOutlined />
            <span>{t("upload")} — {t("staff")}</span>
          </Space>
        }
        onCancel={() => setUploadOpen(false)}
        footer={null}
        width={820}
        destroyOnHidden
      >
        <Steps
          current={uploadStep}
          size="small"
          style={{ marginBottom: 24, marginTop: 8 }}
          items={[{ title: "Upload Files" }, { title: "Preview & Confirm" }]}
        />

        {uploadStep === 0 && (
          <div>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Text strong style={{ display: "block", marginBottom: 8 }}>
                  বাংলা Excel (Bangla Headers)
                </Text>
                <Dragger
                  accept=".xlsx,.xls"
                  multiple={false}
                  beforeUpload={(f) => { setBnFile(f); return false; }}
                  onRemove={() => setBnFile(null)}
                  maxCount={1}
                  style={{ borderColor: bnFile ? "#52c41a" : undefined }}
                >
                  <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                  <p style={{ fontSize: 13 }}>{bnFile ? bnFile.name : "Drag or click to select"}</p>
                  <p style={{ fontSize: 11, color: "#999" }}>Bangla headers (ইউজার আইডি, etc.)</p>
                </Dragger>
              </Col>
              <Col xs={24} sm={12}>
                <Text strong style={{ display: "block", marginBottom: 8 }}>
                  English Excel (English Headers)
                </Text>
                <Dragger
                  accept=".xlsx,.xls"
                  multiple={false}
                  beforeUpload={(f) => { setEnFile(f); return false; }}
                  onRemove={() => setEnFile(null)}
                  maxCount={1}
                  style={{ borderColor: enFile ? "#52c41a" : undefined }}
                >
                  <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                  <p style={{ fontSize: 13 }}>{enFile ? enFile.name : "Drag or click to select"}</p>
                  <p style={{ fontSize: 11, color: "#999" }}>English headers (User ID, etc.)</p>
                </Dragger>
              </Col>
            </Row>

            <Alert
              type="info"
              showIcon
              style={{ marginTop: 16 }}
              message="Upload one or both files. Both are merged by User ID."
            />

            <Row justify="end" style={{ marginTop: 16 }}>
              <Button
                type="primary"
                loading={parsing}
                disabled={!bnFile && !enFile}
                onClick={parseFiles}
                style={{ background: "#1a4b8c" }}
              >
                Parse & Preview
              </Button>
            </Row>
          </div>
        )}

        {uploadStep === 1 && (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col>
                <Badge count={mergedValid.length} color="green" showZero>
                  <Button
                    icon={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
                    onClick={() => setPreviewTab("valid")}
                    type={previewTab === "valid" ? "primary" : "default"}
                  >
                    {t("valid_rows")}
                  </Button>
                </Badge>
              </Col>
              <Col>
                <Badge count={allErrors.length} color="red" showZero>
                  <Button
                    icon={<CloseCircleOutlined style={{ color: "#ff4d4f" }} />}
                    onClick={() => setPreviewTab("errors")}
                    type={previewTab === "errors" ? "primary" : "default"}
                    danger={allErrors.length > 0}
                  >
                    {t("error_rows")}
                  </Button>
                </Badge>
              </Col>
            </Row>

            {previewTab === "valid" && (
              <Table
                rowKey="internal_user_id"
                columns={previewValidCols}
                dataSource={mergedValid}
                size="small"
                scroll={{ x: 700, y: 300 }}
                pagination={{ pageSize: 50, showTotal: (total) => `${total} rows` }}
              />
            )}
            {previewTab === "errors" && (
              <Table
                rowKey="row"
                columns={previewErrorCols}
                dataSource={allErrors}
                size="small"
                scroll={{ y: 300 }}
                pagination={{ pageSize: 50 }}
              />
            )}

            <Divider />
            <Row justify="space-between">
              <Button onClick={() => setUploadStep(0)}>← Back</Button>
              <Button
                type="primary"
                loading={confirming}
                disabled={mergedValid.length === 0}
                onClick={confirmImport}
                style={{ background: "#1a4b8c" }}
              >
                Confirm Import ({mergedValid.length} rows)
              </Button>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
}
