import { useState, useEffect, useCallback } from "react";
import {
  Card, Table, Select, Input, Button, Tag, Typography, Space, Row, Col, Avatar,
  Modal, Upload, Alert, Divider, Steps, message, Form, Badge, Tooltip,
} from "antd";
import { MpDetailDrawer } from "./MpDetailDrawer";
import {
  ReloadOutlined, UserOutlined, UploadOutlined,
  CheckCircleOutlined, CloseCircleOutlined, InboxOutlined,
  PlusOutlined, EditOutlined, CameraOutlined, LoadingOutlined,
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

interface Tenure      { id: number; name: string; status: string }
interface Party       { id: number; name_en: string; name_bn: string }
interface Designation { id: number; name_en: string; name_bn: string }

interface Mp {
  id: number;
  parliament_number: string;
  internal_user_id: string | null;
  name_bn: string;
  name_en: string;
  constituency: string | null;
  party: Party | null;
  gender: string;
  status: string;
  designation: Designation | null;
  designation_id: number | null;
  designation_since: string | null;
  photo_path: string | null;
  tenure_id: number;
  tenure: { id: number; name: string } | null;
}

interface ParsedRow {
  parliament_number: string; internal_user_id: string;
  name_en: string; name_bn: string; constituency: string;
  party: string; status: string; gender: string;
}
interface ErrorRow { row: number; data: any; reason: string }
interface PreviewResult { valid_count: number; error_count: number; valid_rows: ParsedRow[]; error_rows: ErrorRow[] }

const MP_STATUS_COLOR: Record<string, string> = {
  Active: "green",   ACTIVE: "green",
  Resigned: "orange", RESIGNED: "orange",
  Deceased: "red",    DECEASED: "red",
  "Seat Vacant": "default", SEAT_VACANT: "default",
};

export function MpsPage() {
  const { t } = useTranslation();
  const { lang } = useLang();

  const [data, setData]             = useState<Mp[]>([]);
  const [tenures, setTenures]       = useState<Tenure[]>([]);
  const [parties, setParties]       = useState<Party[]>([]);
  const [designations, setDesigns]  = useState<Designation[]>([]);
  const [loading, setLoading]       = useState(false);
  const [uploadingPhotoId, setUploadingPhotoId] = useState<number | null>(null);

  // Detail drawer
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailMpId, setDetailMpId] = useState<number | null>(null);

  // CRUD modal
  const [crudOpen, setCrudOpen]     = useState(false);
  const [editing, setEditing]       = useState<Mp | null>(null);
  const [saving, setSaving]         = useState(false);
  const [form] = Form.useForm();

  // Upload modal
  const [uploadOpen, setUploadOpen]   = useState(false);
  const [uploadStep, setUploadStep]   = useState(0);
  const [uploadTenureId, setUploadTenureId] = useState<number | null>(null);
  const [bnFile, setBnFile]           = useState<File | null>(null);
  const [enFile, setEnFile]           = useState<File | null>(null);
  const [parsing, setParsing]         = useState(false);
  const [confirming, setConfirming]   = useState(false);
  const [mergedValid, setMergedValid] = useState<ParsedRow[]>([]);
  const [allErrors, setAllErrors]     = useState<ErrorRow[]>([]);
  const [previewTab, setPreviewTab]   = useState("valid");

  const [filters, setFilters] = useState<{
    tenure_id?: number; status?: string; party_id?: number; search?: string;
  }>({});

  const fetchData = useCallback(async (f = filters) => {
    setLoading(true);
    try {
      const params: Record<string, any> = { ...f };
      Object.keys(params).forEach((k) => params[k] === undefined && delete params[k]);
      const res = await api.get<Mp[]>("/mp", { params });
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }, [filters]);

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
      await api.post(`/mp/${id}/photo`, fd, { headers: { "Content-Type": "multipart/form-data" } });
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
    api.get<Tenure[]>("/tenures").then((r) => setTenures(r.data)).catch(() => {});
    api.get<Party[]>("/lookups/political-parties").then((r) => setParties(r.data)).catch(() => {});
    api.get<Designation[]>("/lookups/mp-designations").then((r) => setDesigns(r.data)).catch(() => {});
  }, []);

  function applyFilters(overrides: typeof filters) {
    const next = { ...filters, ...overrides };
    setFilters(next);
    fetchData(next);
  }

  // ── CRUD handlers ───────────────────────────────────────────────────────────

  function openCreate() {
    setEditing(null);
    form.resetFields();
    setCrudOpen(true);
  }

  function openEdit(mp: Mp) {
    setEditing(mp);
    form.setFieldsValue({
      parliament_number: mp.parliament_number,
      internal_user_id: mp.internal_user_id ?? "",
      name_en: mp.name_en,
      name_bn: mp.name_bn,
      constituency: mp.constituency ?? "",
      party_id: mp.party?.id,
      tenure_id: mp.tenure_id,
      gender: mp.gender,
      status: mp.status,
      designation_id: mp.designation_id,
    });
    setCrudOpen(true);
  }

  async function handleSave() {
    const vals = await form.validateFields();
    setSaving(true);
    try {
      if (editing) {
        // Build update payload (exclude parliament_number + tenure — not editable after create)
        const payload: Record<string, any> = {
          name_en: vals.name_en,
          name_bn: vals.name_bn,
          internal_user_id: vals.internal_user_id,
          constituency: vals.constituency,
          party_id: vals.party_id,
          gender: vals.gender,
          status: vals.status,
        };
        // Only include designation if changed
        if (vals.designation_id !== editing.designation_id) {
          if (vals.designation_id) {
            await api.post(`/mp/${editing.id}/designation`, {
              designation_id: vals.designation_id,
              effective_date: new Date().toISOString().slice(0, 10),
            });
          }
        } else {
          payload.designation_id = vals.designation_id;
        }
        await api.patch(`/mp/${editing.id}`, payload);
        message.success(t("save_success"));
      } else {
        await api.post("/mp", {
          parliament_number: vals.parliament_number,
          internal_user_id: vals.internal_user_id,
          name_en: vals.name_en,
          name_bn: vals.name_bn,
          constituency: vals.constituency,
          party_id: vals.party_id,
          tenure_id: vals.tenure_id,
          gender: vals.gender,
          status: vals.status ?? "ACTIVE",
        });
        message.success(t("save_success"));
      }
      setCrudOpen(false);
      fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? "Error saving");
    } finally {
      setSaving(false);
    }
  }

  // ── Upload handlers ──────────────────────────────────────────────────────────

  function openUpload() {
    setUploadStep(0);
    setUploadTenureId(null);
    setBnFile(null); setEnFile(null);
    setMergedValid([]); setAllErrors([]);
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
        const res = await api.post<PreviewResult>("/mp/upload/preview", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        results.push(res.data);
      }
      const map = new Map<string, ParsedRow>();
      const errors: ErrorRow[] = [];
      for (const result of results) {
        for (const row of result.valid_rows) {
          const existing = map.get(row.parliament_number);
          if (existing) {
            if (!existing.name_en && row.name_en) existing.name_en = row.name_en;
            if (!existing.name_bn && row.name_bn) existing.name_bn = row.name_bn;
          } else {
            map.set(row.parliament_number, { ...row });
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
    if (!uploadTenureId) { message.warning("Select a tenure"); return; }
    setConfirming(true);
    try {
      await api.post("/mp/upload/confirm", { tenure_id: uploadTenureId, rows: mergedValid });
      message.success(`Imported ${mergedValid.length} MPs successfully`);
      setUploadOpen(false);
      fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? "Import failed");
    } finally {
      setConfirming(false);
    }
  }

  const partyName  = (p: Mp["party"])       => p ? (lang === "bn" ? p.name_bn : p.name_en) : "—";
  const desigName  = (d: Mp["designation"]) => d ? (lang === "bn" ? d.name_bn : d.name_en) : "—";

  const columns: ColumnsType<Mp> = [
    {
      title: "",
      key: "photo",
      width: 50,
      render: (_: unknown, row: Mp) => (
        <Upload
          accept="image/jpeg,image/png"
          showUploadList={false}
          beforeUpload={(file) => { handlePhotoUpload(row.id, file); return false; }}
        >
          <div style={{ position: "relative", display: "inline-block", cursor: "pointer" }}>
            {uploadingPhotoId === row.id
              ? <Avatar size={34} icon={<LoadingOutlined />} />
              : <Avatar src={photoUrl(row.photo_path)} icon={!row.photo_path ? <UserOutlined /> : undefined} size={34} style={!row.photo_path ? { background: "#1a4b8c" } : undefined} />
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
      width: 100,
      render: (v: string | null) => v ? <Text code style={{ fontSize: 12 }}>{v}</Text> : <Text type="secondary">—</Text>,
    },
    {
      title: "Parliament",
      key: "tenure",
      width: 140,
      render: (_: unknown, row: Mp) => (
        <Text style={{ fontSize: 12 }}>{row.tenure?.name ?? "—"}</Text>
      ),
    },
    {
      title: "MP No.",
      dataIndex: "parliament_number",
      width: 90,
      render: (v: string) => <Text code style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: t("name_en") + " / " + t("name_bn"),
      key: "name",
      render: (_: unknown, row: Mp) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: 13 }}>{row.name_en}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{row.name_bn}</Text>
        </Space>
      ),
    },
    { title: t("constituency"), dataIndex: "constituency", render: (v: string | null) => v ?? "—" },
    { title: t("party"),       key: "party",       render: (_: unknown, r: Mp) => partyName(r.party) },
    { title: t("designation"), key: "designation", render: (_: unknown, r: Mp) => desigName(r.designation) },
    {
      title: t("status"),
      dataIndex: "status",
      width: 110,
      render: (v: string) => <Tag color={MP_STATUS_COLOR[v] ?? "default"}>{v}</Tag>,
    },
    {
      title: t("actions"),
      key: "actions",
      width: 70,
      fixed: "right",
      render: (_: unknown, row: Mp) => (
        <Tooltip title={t("edit")}>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)} />
        </Tooltip>
      ),
    },
  ];

  const previewValidCols: ColumnsType<ParsedRow> = [
    { title: t("parliament_number"), dataIndex: "parliament_number", width: 110 },
    { title: t("internal_user_id"), dataIndex: "internal_user_id", width: 100 },
    { title: t("name_en"), dataIndex: "name_en" },
    { title: t("name_bn"), dataIndex: "name_bn" },
    { title: t("constituency"), dataIndex: "constituency" },
    { title: t("party"), dataIndex: "party" },
    { title: t("status"), dataIndex: "status", width: 90 },
  ];

  const previewErrorCols: ColumnsType<ErrorRow> = [
    { title: "Row", dataIndex: "row", width: 60 },
    { title: "Reason", dataIndex: "reason" },
  ];

  return (
    <div>
      <Row align="middle" justify="space-between" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={4} style={{ margin: 0, color: "#1a4b8c" }}>{t("mps")}</Title>
        </Col>
        <Col>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => fetchData()} />
            <Button icon={<UploadOutlined />} onClick={openUpload} style={{ borderColor: "#1a4b8c", color: "#1a4b8c" }}>
              {t("upload")}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} style={{ background: "#1a4b8c" }}>
              {t("add")}
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Filters */}
      <Card bordered={false} style={{ marginBottom: 16, borderRadius: 8 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={5}>
            <Select allowClear placeholder={t("tenure")} style={{ width: "100%" }}
              onChange={(v) => applyFilters({ tenure_id: v })}>
              {tenures.map((ten) => <Option key={ten.id} value={ten.id}>{ten.name}</Option>)}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={5}>
            <Select allowClear placeholder={t("party")} style={{ width: "100%" }}
              onChange={(v) => applyFilters({ party_id: v })}>
              {parties.map((p) => (
                <Option key={p.id} value={p.id}>{lang === "bn" ? p.name_bn : p.name_en}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select allowClear placeholder={t("status")} style={{ width: "100%" }}
              onChange={(v) => applyFilters({ status: v })}>
              {["Active", "Resigned", "Deceased", "Seat Vacant"].map((s) => (
                <Option key={s} value={s}><Tag color={MP_STATUS_COLOR[s]}>{s}</Tag></Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={10}>
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
          pagination={{ pageSize: 50, showSizeChanger: true, pageSizeOptions: ["25", "50", "100"], showTotal: (total) => `${total} MPs` }}
          scroll={{ x: 1050 }}
          onRow={(row) => ({
            onClick: (e) => {
              // Don't open drawer if click was on the Upload or Edit button
              const target = e.target as HTMLElement;
              if (target.closest(".ant-upload") || target.closest(".ant-btn")) return;
              setDetailMpId(row.id);
              setDetailOpen(true);
            },
            style: { cursor: "pointer" },
          })}
        />
      </Card>

      {/* Detail Drawer */}
      <MpDetailDrawer
        mpId={detailMpId}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onEdit={() => {
          const mp = data.find((m) => m.id === detailMpId);
          if (mp) { setDetailOpen(false); openEdit(mp); }
        }}
      />

      {/* ── Create / Edit Modal ─────────────────────────────────────────────── */}
      <Modal
        open={crudOpen}
        title={
          <Space>
            {editing ? <EditOutlined /> : <PlusOutlined />}
            <span>{editing ? `${t("edit")} — ${editing.name_en}` : `${t("add")} MP`}</span>
          </Space>
        }
        onOk={handleSave}
        onCancel={() => setCrudOpen(false)}
        confirmLoading={saving}
        okText={t("save")}
        cancelText={t("cancel")}
        width={700}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="parliament_number" label="MP No.">
                <Input disabled={!!editing} placeholder="e.g. 001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="internal_user_id" label={t("internal_user_id")}
                rules={[{ required: true, message: t("val_required") }]}>
                <Input placeholder="e.g. 013000101" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name_en" label={t("name_en")}
                rules={[{ required: true, message: t("val_required") }]}>
                <Input placeholder="Full name in English" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="name_bn" label={t("name_bn")}>
                <Input placeholder="বাংলায় নাম" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="constituency" label={t("constituency")}
                rules={[{ required: true, message: t("val_required") }]}>
                <Input placeholder="e.g. 1 Panchagarh-1" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="party_id" label={t("party")}
                rules={[{ required: true, message: t("val_required") }]}>
                <Select placeholder="Select party" showSearch
                  filterOption={(input, option) =>
                    String(option?.children ?? "").toLowerCase().includes(input.toLowerCase())
                  }>
                  {parties.map((p) => (
                    <Option key={p.id} value={p.id}>{p.name_en}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="tenure_id" label={t("tenure")}
                rules={[{ required: !editing, message: t("val_required") }]}>
                <Select placeholder="Select tenure" disabled={!!editing}>
                  {tenures.map((ten) => (
                    <Option key={ten.id} value={ten.id}>{ten.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="gender" label={t("gender")}>
                <Select placeholder="Select gender">
                  <Option value="MALE">Male</Option>
                  <Option value="FEMALE">Female</Option>
                  <Option value="OTHER">Other</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label={t("status")}>
                <Select placeholder="Select status">
                  {["ACTIVE", "RESIGNED", "DECEASED", "SEAT_VACANT"].map((s) => (
                    <Option key={s} value={s}>{s.replace("_", " ")}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            {editing && (
              <Col span={12}>
                <Form.Item name="designation_id" label={t("designation")}>
                  <Select allowClear placeholder="Select designation">
                    {designations.map((d) => (
                      <Option key={d.id} value={d.id}>{d.name_en}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            )}
          </Row>
        </Form>
      </Modal>

      {/* ── Upload Modal ─────────────────────────────────────────────────────── */}
      <Modal
        open={uploadOpen}
        title={<Space><UploadOutlined /><span>{t("upload")} — {t("mps")}</span></Space>}
        onCancel={() => setUploadOpen(false)}
        footer={null}
        width={820}
        destroyOnHidden
      >
        <Steps current={uploadStep} size="small" style={{ marginBottom: 24, marginTop: 8 }}
          items={[{ title: "Upload Files" }, { title: "Preview & Confirm" }]} />

        {uploadStep === 0 && (
          <div>
            <Form layout="vertical">
              <Form.Item label={<Text strong>{t("tenure")} *</Text>}>
                <Select placeholder="Select parliament tenure" style={{ width: "100%" }}
                  value={uploadTenureId} onChange={setUploadTenureId}>
                  {tenures.map((ten) => <Option key={ten.id} value={ten.id}>{ten.name}</Option>)}
                </Select>
              </Form.Item>
            </Form>
            <Divider />
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Text strong style={{ display: "block", marginBottom: 8 }}>বাংলা Excel (Bangla Headers)</Text>
                <Dragger accept=".xlsx,.xls" multiple={false} beforeUpload={(f) => { setBnFile(f); return false; }}
                  onRemove={() => setBnFile(null)} maxCount={1}
                  style={{ borderColor: bnFile ? "#52c41a" : undefined }}>
                  <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                  <p style={{ fontSize: 13 }}>{bnFile ? bnFile.name : "Drag or click to select"}</p>
                  <p style={{ fontSize: 11, color: "#999" }}>Bangla headers (সংসদ নাম্বার, etc.)</p>
                </Dragger>
              </Col>
              <Col xs={24} sm={12}>
                <Text strong style={{ display: "block", marginBottom: 8 }}>English Excel (English Headers)</Text>
                <Dragger accept=".xlsx,.xls" multiple={false} beforeUpload={(f) => { setEnFile(f); return false; }}
                  onRemove={() => setEnFile(null)} maxCount={1}
                  style={{ borderColor: enFile ? "#52c41a" : undefined }}>
                  <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                  <p style={{ fontSize: 13 }}>{enFile ? enFile.name : "Drag or click to select"}</p>
                  <p style={{ fontSize: 11, color: "#999" }}>English headers (Parliament Number, etc.)</p>
                </Dragger>
              </Col>
            </Row>
            <Alert type="info" showIcon style={{ marginTop: 16 }}
              message="Upload one or both files. Both are merged by Parliament Number." />
            <Row justify="end" style={{ marginTop: 16 }}>
              <Button type="primary" loading={parsing} disabled={!bnFile && !enFile}
                onClick={parseFiles} style={{ background: "#1a4b8c" }}>
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
                  <Button icon={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
                    onClick={() => setPreviewTab("valid")} type={previewTab === "valid" ? "primary" : "default"}>
                    {t("valid_rows")}
                  </Button>
                </Badge>
              </Col>
              <Col>
                <Badge count={allErrors.length} color="red" showZero>
                  <Button icon={<CloseCircleOutlined style={{ color: "#ff4d4f" }} />}
                    onClick={() => setPreviewTab("errors")} type={previewTab === "errors" ? "primary" : "default"}
                    danger={allErrors.length > 0}>
                    {t("error_rows")}
                  </Button>
                </Badge>
              </Col>
            </Row>
            {previewTab === "valid" && (
              <Table rowKey="parliament_number" columns={previewValidCols} dataSource={mergedValid}
                size="small" scroll={{ x: 700, y: 280 }} pagination={{ pageSize: 50, showTotal: (t) => `${t} rows` }} />
            )}
            {previewTab === "errors" && (
              <Table rowKey="row" columns={previewErrorCols} dataSource={allErrors}
                size="small" scroll={{ y: 280 }} pagination={{ pageSize: 50 }} />
            )}
            <Divider />
            <Row justify="space-between">
              <Button onClick={() => setUploadStep(0)}>← Back</Button>
              <Button type="primary" loading={confirming}
                disabled={mergedValid.length === 0 || !uploadTenureId} onClick={confirmImport}
                style={{ background: "#1a4b8c" }}>
                Confirm Import ({mergedValid.length} rows)
              </Button>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
}
