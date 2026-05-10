import { useState } from "react";
import {
  Card, Form, Select, Button, Typography, Divider,
  Checkbox, Radio, Space, Table, Tag, Popover, message,
} from "antd";
import {
  FileTextOutlined, FilePdfOutlined, FileExcelOutlined,
  EyeOutlined, DownloadOutlined, SettingOutlined, CloseOutlined,
} from "@ant-design/icons";
import { useLang } from "../../hooks/useLang";
import { downloadReport } from "../../services/api";
import api from "../../services/api";

const { Title, Text } = Typography;
const { Option } = Select;

// ─── Column definitions per report ───────────────────────────────────────────

const REPORT_COLUMNS: Record<string, { key: string; label_en: string; label_bn: string }[]> = {
  r01: [
    { key: "category",       label_en: "Category",          label_bn: "ক্যাটাগরি" },
    { key: "quarter_no",     label_en: "Quarter No.",        label_bn: "কোয়ার্টার নং" },
    { key: "location",       label_en: "Location",           label_bn: "অবস্থান" },
    { key: "house_flat_no",  label_en: "House/Flat No.",     label_bn: "বাড়ি/ফ্ল্যাট নং" },
    { key: "area_sqft",      label_en: "Area (sqft)",        label_bn: "আয়তন (বর্গফুট)" },
    { key: "floor",          label_en: "Floor",              label_bn: "তলা" },
    { key: "building",       label_en: "Building",           label_bn: "ভবন" },
    { key: "full_address",   label_en: "Full Address",       label_bn: "সম্পূর্ণ ঠিকানা" },
    { key: "staff_name",     label_en: "Officer Name",       label_bn: "কর্মকর্তার নাম" },
    { key: "designation",    label_en: "Designation",        label_bn: "পদবী" },
    { key: "allotment_date", label_en: "Allotment Date",     label_bn: "বরাদ্দের তারিখ" },
    { key: "vacated_date",   label_en: "Vacated Date",       label_bn: "খালি করার তারিখ" },
    { key: "status",         label_en: "Status",             label_bn: "অবস্থা" },
  ],
  r02: [
    { key: "category",       label_en: "Category",          label_bn: "ক্যাটাগরি" },
    { key: "quarter_no",     label_en: "Quarter No.",        label_bn: "কোয়ার্টার নং" },
    { key: "location",       label_en: "Location",           label_bn: "অবস্থান" },
    { key: "full_address",   label_en: "Full Address",       label_bn: "সম্পূর্ণ ঠিকানা" },
    { key: "status",         label_en: "Status",             label_bn: "অবস্থা" },
    { key: "staff_name",     label_en: "Current Occupant",   label_bn: "বর্তমান বাসিন্দা" },
    { key: "allotment_date", label_en: "Allotment Date",     label_bn: "বরাদ্দের তারিখ" },
  ],
  r03: [
    { key: "staff_name",     label_en: "Officer Name",       label_bn: "কর্মকর্তার নাম" },
    { key: "user_id",        label_en: "User ID",            label_bn: "ইউজার আইডি" },
    { key: "designation",    label_en: "Designation",        label_bn: "পদবী" },
    { key: "department",     label_en: "Department",         label_bn: "দপ্তর" },
    { key: "grade",          label_en: "Grade",              label_bn: "গ্রেড" },
    { key: "category",       label_en: "Quarter Category",   label_bn: "কোয়ার্টার ক্যাটাগরি" },
    { key: "quarter_no",     label_en: "Quarter No.",        label_bn: "কোয়ার্টার নং" },
    { key: "location",       label_en: "Location",           label_bn: "অবস্থান" },
    { key: "allotment_date", label_en: "Allotment Date",     label_bn: "বরাদ্দের তারিখ" },
  ],
  r04: [
    { key: "member_name",    label_en: "Member Name",        label_bn: "সদস্যের নাম" },
    { key: "relation",       label_en: "Relation",           label_bn: "সম্পর্ক" },
    { key: "dob",            label_en: "Date of Birth",      label_bn: "জন্ম তারিখ" },
    { key: "identity_no",    label_en: "Identity No.",       label_bn: "পরিচয় নং" },
    { key: "staff_name",     label_en: "Officer",            label_bn: "কর্মকর্তা" },
    { key: "quarter_no",     label_en: "Quarter No.",        label_bn: "কোয়ার্টার নং" },
    { key: "location",       label_en: "Location",           label_bn: "অবস্থান" },
  ],
  r05: [
    { key: "quarter_no",     label_en: "Quarter No.",        label_bn: "কোয়ার্টার নং" },
    { key: "location",       label_en: "Location",           label_bn: "অবস্থান" },
    { key: "staff_name",     label_en: "Officer Name",       label_bn: "কর্মকর্তার নাম" },
    { key: "designation",    label_en: "Designation",        label_bn: "পদবী" },
    { key: "allotment_date", label_en: "Allotment Date",     label_bn: "বরাদ্দের তারিখ" },
    { key: "vacated_date",   label_en: "Vacated Date",       label_bn: "খালি করার তারিখ" },
    { key: "duration_days",  label_en: "Duration (days)",    label_bn: "মেয়াদ (দিন)" },
    { key: "status",         label_en: "Status",             label_bn: "অবস্থা" },
  ],
  r06: [
    { key: "mp_name",        label_en: "MP Name",            label_bn: "সংসদ সদস্যের নাম" },
    { key: "parl_no",        label_en: "Parliament No.",      label_bn: "সংসদ নম্বর" },
    { key: "party",          label_en: "Party",              label_bn: "দল" },
    { key: "constituency",   label_en: "Constituency",       label_bn: "নির্বাচনী এলাকা" },
    { key: "office_building",label_en: "Office Building",    label_bn: "অফিস ভবন" },
    { key: "office_room",    label_en: "Office Room",        label_bn: "অফিস কক্ষ" },
    { key: "flat_category",  label_en: "Flat Category",      label_bn: "ফ্ল্যাট ক্যাটাগরি" },
    { key: "flat_number",    label_en: "Flat No.",           label_bn: "ফ্ল্যাট নং" },
    { key: "flat_allotment", label_en: "Flat Allotment",     label_bn: "ফ্ল্যাট বরাদ্দ" },
  ],
  r07: [
    { key: "category",       label_en: "Category",          label_bn: "ক্যাটাগরি" },
    { key: "flat_number",    label_en: "Flat No.",           label_bn: "ফ্ল্যাট নং" },
    { key: "building",       label_en: "Building",           label_bn: "ভবন" },
    { key: "floor",          label_en: "Floor",              label_bn: "তলা" },
    { key: "area_sqft",      label_en: "Area (sqft)",        label_bn: "আয়তন (বর্গফুট)" },
    { key: "status",         label_en: "Status",             label_bn: "অবস্থা" },
    { key: "mp_name",        label_en: "MP Name",            label_bn: "সংসদ সদস্যের নাম" },
    { key: "allotment_date", label_en: "Allotment Date",     label_bn: "বরাদ্দের তারিখ" },
  ],
  r08: [
    { key: "asset_type",     label_en: "Asset Type",        label_bn: "সম্পদের ধরন" },
    { key: "category",       label_en: "Category",          label_bn: "ক্যাটাগরি" },
    { key: "identifier",     label_en: "Identifier",        label_bn: "পরিচিতি" },
    { key: "location",       label_en: "Location/Building", label_bn: "অবস্থান/ভবন" },
    { key: "status",         label_en: "Status",            label_bn: "অবস্থা" },
  ],
  r10: [
    { key: "asset_type",     label_en: "Asset Type",        label_bn: "সম্পদের ধরন" },
    { key: "category",       label_en: "Category",          label_bn: "ক্যাটাগরি" },
    { key: "total",          label_en: "Total",             label_bn: "মোট" },
    { key: "occupied",       label_en: "Occupied",          label_bn: "অধিকৃত" },
    { key: "vacant",         label_en: "Vacant",            label_bn: "খালি" },
    { key: "maintenance",    label_en: "Under Maintenance", label_bn: "মেরামতাধীন" },
  ],
  r11: [
    { key: "mp_name",        label_en: "MP Name",           label_bn: "সংসদ সদস্যের নাম" },
    { key: "parl_no",        label_en: "Parliament No.",     label_bn: "সংসদ নম্বর" },
    { key: "constituency",   label_en: "Constituency",      label_bn: "নির্বাচনী এলাকা" },
    { key: "party",          label_en: "Party",             label_bn: "দল" },
    { key: "office_vacated", label_en: "Office Vacated",    label_bn: "অফিস খালি" },
    { key: "flat_vacated",   label_en: "Flat Vacated",      label_bn: "ফ্ল্যাট খালি" },
    { key: "mp_status",      label_en: "MP Status",         label_bn: "এমপি অবস্থা" },
  ],
};

const REPORTS = [
  { code: "r01", label_en: "R01 — Quarter Detail Report" },
  { code: "r02", label_en: "R02 — All Quarters Occupancy Status" },
  { code: "r03", label_en: "R03 — Staff Housing Directory" },
  { code: "r04", label_en: "R04 — Household Member List" },
  { code: "r05", label_en: "R05 — Quarter Occupancy History" },
  { code: "r06", label_en: "R06 — MP Office & Flat Directory" },
  { code: "r07", label_en: "R07 — MP Flat Occupancy" },
  { code: "r08", label_en: "R08 — Vacant Assets Summary" },
  { code: "r10", label_en: "R10 — Category-wise Summary" },
  { code: "r11", label_en: "R11 — Tenure Changeover Report" },
];

interface PreviewData {
  columns: { key: string; label_en: string; label_bn: string }[];
  rows: Record<string, unknown>[];
  title: string;
  generated_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  Occupied: "green", Vacant: "blue", "Under Maintenance": "orange",
  Active: "green", Vacated: "red",
};

export function ReportsPage() {
  const { lang } = useLang();

  const [selectedReport, setSelectedReport] = useState<string>("r01");
  const [reportLang, setReportLang]         = useState<"en" | "bn">(lang);
  const [format, setFormat]                 = useState<"pdf" | "excel">("pdf");
  const [selectedCols, setSelectedCols]     = useState<string[]>([]);
  const [generating, setGenerating]         = useState(false);
  const [previewing, setPreviewing]         = useState(false);
  const [previewData, setPreviewData]       = useState<PreviewData | null>(null);
  const [colPopoverOpen, setColPopoverOpen] = useState(false);

  const allCols = REPORT_COLUMNS[selectedReport] ?? [];

  function handleReportChange(code: string) {
    setSelectedReport(code);
    setSelectedCols([]);
    setPreviewData(null);
  }

  function buildParams() {
    const params: Record<string, string> = { lang: reportLang };
    if (selectedCols.length > 0 && selectedCols.length < allCols.length) {
      params.columns = selectedCols.join(",");
    }
    return params;
  }

  async function generate() {
    setGenerating(true);
    try {
      await downloadReport(selectedReport, { format, ...buildParams() } as any);
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? "Failed to generate report");
    } finally {
      setGenerating(false);
    }
  }

  async function preview() {
    setPreviewing(true);
    try {
      const res = await api.get<PreviewData>(
        `/reports/${selectedReport.toLowerCase()}`,
        { params: { format: "json", ...buildParams() } },
      );
      setPreviewData(res.data);
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? "Failed to load preview");
    } finally {
      setPreviewing(false);
    }
  }

  // Build Ant Design Table columns from preview data
  const previewCols = (previewData?.columns ?? []).map((c) => ({
    key: c.key,
    dataIndex: c.key,
    title: reportLang === "bn" ? c.label_bn : c.label_en,
    render: (v: unknown) => {
      const str = String(v ?? "");
      if (!str || str === "null" || str === "undefined") return <Text type="secondary">—</Text>;
      if (c.key === "status") {
        return <Tag color={STATUS_COLORS[str] ?? "default"}>{str}</Tag>;
      }
      return str;
    },
  }));

  // Column selector popover content
  const colSelector = (
    <div style={{ width: 260 }}>
      <Space style={{ marginBottom: 8 }}>
        <Button size="small" onClick={() => setSelectedCols(allCols.map((c) => c.key))}>
          All
        </Button>
        <Button size="small" onClick={() => setSelectedCols([])}>
          None
        </Button>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {selectedCols.length === 0 ? allCols.length : selectedCols.length} / {allCols.length}
        </Text>
      </Space>
      <Divider style={{ margin: "8px 0" }} />
      <Checkbox.Group
        value={selectedCols}
        onChange={(vals) => setSelectedCols(vals as string[])}
        style={{ display: "flex", flexDirection: "column", gap: 6 }}
      >
        {allCols.map((col) => (
          <Checkbox key={col.key} value={col.key}>
            <Text style={{ fontSize: 13 }}>
              {reportLang === "bn" ? col.label_bn : col.label_en}
            </Text>
          </Checkbox>
        ))}
      </Checkbox.Group>
    </div>
  );

  return (
    <div>
      {/* ── Controls bar ─────────────────────────────────────────────────────── */}
      <Card
        bordered={false}
        style={{ borderRadius: 8, marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}
        bodyStyle={{ padding: "14px 20px" }}
      >
        <Form layout="inline" style={{ gap: 12, flexWrap: "wrap", alignItems: "center" }}>

          {/* Report selector */}
          <Form.Item style={{ marginBottom: 0, flex: "1 1 280px", minWidth: 220 }}>
            <Select
              value={selectedReport}
              onChange={handleReportChange}
              style={{ width: "100%" }}
              size="middle"
            >
              {REPORTS.map((r) => (
                <Option key={r.code} value={r.code}>{r.label_en}</Option>
              ))}
            </Select>
          </Form.Item>

          {/* Language */}
          <Form.Item label={<Text style={{ fontSize: 12 }}>Lang</Text>} style={{ marginBottom: 0 }}>
            <Radio.Group
              value={reportLang}
              onChange={(e) => setReportLang(e.target.value)}
              size="small"
              buttonStyle="solid"
            >
              <Radio.Button value="en">EN</Radio.Button>
              <Radio.Button value="bn">বাং</Radio.Button>
            </Radio.Group>
          </Form.Item>

          {/* Format */}
          <Form.Item label={<Text style={{ fontSize: 12 }}>Format</Text>} style={{ marginBottom: 0 }}>
            <Radio.Group
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              size="small"
              buttonStyle="solid"
            >
              <Radio.Button value="pdf"><FilePdfOutlined /> PDF</Radio.Button>
              <Radio.Button value="excel"><FileExcelOutlined /> Excel</Radio.Button>
            </Radio.Group>
          </Form.Item>

          {/* Column selector popover */}
          <Form.Item style={{ marginBottom: 0 }}>
            <Popover
              content={colSelector}
              title="Select Columns"
              trigger="click"
              open={colPopoverOpen}
              onOpenChange={setColPopoverOpen}
              placement="bottomLeft"
            >
              <Button icon={<SettingOutlined />} size="small">
                Columns
                {selectedCols.length > 0 && selectedCols.length < allCols.length && (
                  <Tag color="blue" style={{ marginLeft: 6, fontSize: 11, lineHeight: "16px", padding: "0 4px" }}>
                    {selectedCols.length}
                  </Tag>
                )}
              </Button>
            </Popover>
          </Form.Item>

          {/* Action buttons */}
          <Form.Item style={{ marginBottom: 0, marginLeft: "auto" }}>
            <Space>
              <Button
                icon={<EyeOutlined />}
                loading={previewing}
                onClick={preview}
              >
                Preview
              </Button>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                loading={generating}
                onClick={generate}
                style={{ background: "#1a4b8c" }}
              >
                Download {format.toUpperCase()}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* ── Preview table ─────────────────────────────────────────────────────── */}
      {previewData && (
        <Card
          bordered={false}
          style={{ borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}
          bodyStyle={{ padding: 0 }}
          title={
            <Space style={{ padding: "4px 0" }}>
              <FileTextOutlined style={{ color: "#1a4b8c" }} />
              <Text strong style={{ color: "#1a4b8c" }}>{previewData.title}</Text>
              <Tag color="blue">{previewData.rows.length} rows</Tag>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {new Date(previewData.generated_at).toLocaleTimeString()}
              </Text>
            </Space>
          }
          extra={
            <Button
              type="text"
              icon={<CloseOutlined />}
              size="small"
              onClick={() => setPreviewData(null)}
            />
          }
        >
          <Table
            rowKey={(_, idx) => String(idx)}
            columns={previewCols}
            dataSource={previewData.rows}
            size="small"
            scroll={{ x: "max-content" }}
            style={{ borderRadius: "0 0 8px 8px" }}
            pagination={{
              pageSize: 50,
              showSizeChanger: true,
              pageSizeOptions: ["25", "50", "100", "200"],
              showTotal: (total) => `${total} records`,
              style: { padding: "12px 16px" },
            }}
          />
        </Card>
      )}

      {/* Empty state when no preview */}
      {!previewData && (
        <Card
          bordered={false}
          style={{
            borderRadius: 8,
            textAlign: "center",
            padding: "48px 0",
            background: "#fafafa",
            border: "1px dashed #d9d9d9",
          }}
        >
          <FileTextOutlined style={{ fontSize: 48, color: "#d9d9d9", marginBottom: 12, display: "block" }} />
          <Title level={5} style={{ color: "#999", fontWeight: 400 }}>
            Select a report and click <strong>Preview</strong> to view data,
            or <strong>Download</strong> to export
          </Title>
        </Card>
      )}
    </div>
  );
}
