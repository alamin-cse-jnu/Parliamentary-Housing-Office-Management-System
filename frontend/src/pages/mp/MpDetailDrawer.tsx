import { useEffect, useState } from "react";
import {
  Drawer, Tabs, Descriptions, Avatar, Tag, Table, Typography,
  Space, Button, Spin, Empty, Badge,
} from "antd";
import { UserOutlined, EditOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import api from "../../services/api";
import { photoUrl } from "../../services/photoUrl";
import { useLang } from "../../hooks/useLang";

const { Text } = Typography;

interface MpDetail {
  id: number;
  parliament_number: string;
  internal_user_id: string | null;
  name_en: string;
  name_bn: string;
  constituency: string | null;
  gender: string;
  status: string;
  photo_path: string | null;
  designation_since: string | null;
  party: { id: number; name_en: string; name_bn: string } | null;
  designation: { id: number; name_en: string; name_bn: string } | null;
  tenure: { id: number; name: string } | null;
}

interface DesigLog {
  id: number;
  effective_date: string;
  old_designation: { name_en: string; name_bn: string } | null;
  new_designation: { name_en: string; name_bn: string } | null;
  changed_by_user: { username: string; full_name_en: string } | null;
}

interface AllocRecord {
  id: number;
  allocation_type: string;
  status: string;
  allotment_date: string;
  vacated_date: string | null;
  remarks: string | null;
  mp_office: { room_number: string; floor: string | null; building: { name_en: string } | null } | null;
  mp_flat: { flat_number: string; building_name: string | null; category: { name_en: string } | null } | null;
}

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "green", Active: "green",
  RESIGNED: "orange", Resigned: "orange",
  DECEASED: "red", Deceased: "red",
  SEAT_VACANT: "default", "Seat Vacant": "default",
};

const ALLOC_COLOR: Record<string, string> = { OFFICE: "cyan", MP_FLAT: "purple" };
const ALLOC_LABEL: Record<string, string> = { OFFICE: "MP Office", MP_FLAT: "MP Flat" };

function assetDesc(alloc: AllocRecord): string {
  if (alloc.allocation_type === "OFFICE" && alloc.mp_office)
    return `${alloc.mp_office.building?.name_en ?? "?"} — Room ${alloc.mp_office.room_number}`;
  if (alloc.allocation_type === "MP_FLAT" && alloc.mp_flat)
    return `Flat ${alloc.mp_flat.flat_number}${alloc.mp_flat.building_name ? ` (${alloc.mp_flat.building_name})` : ""}`;
  return "—";
}

interface Props {
  mpId: number | null;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
}

export function MpDetailDrawer({ mpId, open, onClose, onEdit }: Props) {
  const { lang } = useLang();

  const [mp, setMp]           = useState<MpDetail | null>(null);
  const [desigLogs, setDesigLogs] = useState<DesigLog[]>([]);
  const [allocs, setAllocs]   = useState<AllocRecord[]>([]);
  const [loadingMp, setLoadingMp]     = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    if (!open || !mpId) return;
    setActiveTab("profile");
    setLoadingMp(true);
    api.get<MpDetail>(`/mp/${mpId}`)
      .then((r) => setMp(r.data))
      .finally(() => setLoadingMp(false));
    setLoadingHistory(true);
    Promise.all([
      api.get<DesigLog[]>(`/mp/${mpId}/designation-history`),
      api.get<AllocRecord[]>(`/allocations/mp/${mpId}/history`),
    ]).then(([dRes, aRes]) => {
      setDesigLogs(dRes.data);
      setAllocs(aRes.data);
    }).finally(() => setLoadingHistory(false));
  }, [open, mpId]);

  const name = mp ? (lang === "bn" ? mp.name_bn : mp.name_en) : "";

  const desigCols: ColumnsType<DesigLog> = [
    {
      title: "Effective Date",
      dataIndex: "effective_date",
      width: 120,
      render: (v: string) => dayjs(v).format("DD MMM YYYY"),
    },
    {
      title: "From",
      key: "old",
      render: (_: unknown, row: DesigLog) =>
        row.old_designation
          ? (lang === "bn" ? row.old_designation.name_bn : row.old_designation.name_en)
          : <Text type="secondary">—</Text>,
    },
    {
      title: "To",
      key: "new",
      render: (_: unknown, row: DesigLog) =>
        row.new_designation
          ? <Text strong>{lang === "bn" ? row.new_designation.name_bn : row.new_designation.name_en}</Text>
          : <Text type="secondary">—</Text>,
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
      title: "Type",
      dataIndex: "allocation_type",
      width: 100,
      render: (v: string) => <Tag color={ALLOC_COLOR[v]}>{ALLOC_LABEL[v] ?? v}</Tag>,
    },
    {
      title: "Asset",
      key: "asset",
      render: (_: unknown, row: AllocRecord) => assetDesc(row),
    },
    {
      title: "Allotment Date",
      dataIndex: "allotment_date",
      width: 120,
      render: (v: string) => dayjs(v).format("DD MMM YYYY"),
    },
    {
      title: "Vacated Date",
      dataIndex: "vacated_date",
      width: 120,
      render: (v: string | null) => v ? dayjs(v).format("DD MMM YYYY") : <Text type="secondary">—</Text>,
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 90,
      render: (v: string) => <Tag color={v === "ACTIVE" ? "green" : "red"}>{v}</Tag>,
    },
  ];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={700}
      title={
        <Space>
          <Avatar
            src={photoUrl(mp?.photo_path)}
            icon={!mp?.photo_path ? <UserOutlined /> : undefined}
            size={36}
            style={!mp?.photo_path ? { background: "#1a4b8c" } : undefined}
          />
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{name || "MP Detail"}</div>
            {mp && <div style={{ fontSize: 12, color: "#888", fontWeight: 400 }}>MP #{mp.parliament_number}</div>}
          </div>
        </Space>
      }
      extra={
        <Button icon={<EditOutlined />} onClick={onEdit} style={{ borderColor: "#1a4b8c", color: "#1a4b8c" }}>
          Edit
        </Button>
      }
    >
      {loadingMp ? (
        <div style={{ textAlign: "center", paddingTop: 60 }}><Spin size="large" /></div>
      ) : mp ? (
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "profile",
              label: "Profile",
              children: (
                <Descriptions bordered size="small" column={1} labelStyle={{ width: 160 }}>
                  <Descriptions.Item label="User ID">{mp.internal_user_id || "—"}</Descriptions.Item>
                  <Descriptions.Item label="Name (English)">{mp.name_en}</Descriptions.Item>
                  <Descriptions.Item label="নাম (বাংলা)">{mp.name_bn}</Descriptions.Item>
                  <Descriptions.Item label="Constituency">{mp.constituency ?? "—"}</Descriptions.Item>
                  <Descriptions.Item label="Party">
                    {mp.party ? (lang === "bn" ? mp.party.name_bn : mp.party.name_en) : "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Tenure">{mp.tenure?.name ?? "—"}</Descriptions.Item>
                  <Descriptions.Item label="Designation">
                    {mp.designation ? (lang === "bn" ? mp.designation.name_bn : mp.designation.name_en) : "—"}
                    {mp.designation_since && (
                      <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                        since {dayjs(mp.designation_since).format("DD MMM YYYY")}
                      </Text>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Gender">{mp.gender}</Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Tag color={STATUS_COLOR[mp.status] ?? "default"}>{mp.status}</Tag>
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
                  Allocation History
                </Badge>
              ),
              children: loadingHistory ? (
                <Spin />
              ) : allocs.length === 0 ? (
                <Empty description="No allocations recorded" />
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
          ]}
        />
      ) : (
        <Empty />
      )}
    </Drawer>
  );
}
