import { Card, Col, Row, Statistic, Typography, Table, Tag } from "antd";
import {
  TeamOutlined, UserOutlined, HomeOutlined,
  ApartmentOutlined, SwapOutlined, BuildOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import api from "../services/api";

const { Title, Text } = Typography;

// ─── Colours ─────────────────────────────────────────────────────────────────
const BLUE   = "#1a4b8c";
const GREEN  = "#52c41a";
const ORANGE = "#faad14";
const PURPLE = "#722ed1";
const TEAL   = "#13c2c2";

// ─── Types ───────────────────────────────────────────────────────────────────
interface AssetStat { total: number; occupied: number; vacant: number; maintenance: number }

interface CategoryStat {
  name_en: string; name_bn: string;
  occupied: number; vacant: number; maintenance: number; total: number;
}

interface DashboardStats {
  mps:   { total: number };
  staff: { total: number; by_class: { class: string; count: number }[] };
  assets: { offices: AssetStat; flats: AssetStat; quarters: AssetStat };
  quarters_by_category:  CategoryStat[];
  flats_by_category:     CategoryStat[];
  offices_by_building:   CategoryStat[];
  allocations: { total_active: number; by_type: { type: string; count: number }[] };
  recent_allocations: RecentAlloc[];
}

interface RecentAlloc {
  id: number;
  allocation_type: string;
  occupant_type: string;
  allotment_date: string;
  mp?:    { name_en: string; name_bn: string; parliament_number: string } | null;
  staff?: { name_en: string; name_bn: string; internal_user_id: string }  | null;
  mp_office?:    { room_number: string; building?: { name_en: string; name_bn: string } } | null;
  mp_flat?:      { flat_number: string; building_name: string | null } | null;
  staff_quarter?: { quarter_number: string; location: string } | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function classLabel(cls: string, t: (k: string) => string) {
  const map: Record<string, string> = {
    CLASS_1: t("class_1"), CLASS_2: t("class_2"),
    CLASS_3: t("class_3"), CLASS_4: t("class_4"), NO_CLASS: t("no_class"),
  };
  return map[cls] ?? cls;
}

function allocTypeLabel(type: string, t: (k: string) => string) {
  const map: Record<string, string> = {
    OFFICE: t("office"), MP_FLAT: t("mp_flat"), STAFF_QUARTER: t("staff_quarter"),
  };
  return map[type] ?? type;
}

const chartCard = { borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" };

const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.04) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  return (
    <text
      x={cx + r * Math.cos(-midAngle * RADIAN)}
      y={cy + r * Math.sin(-midAngle * RADIAN)}
      fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// ─── Reusable grouped bar (Occupied / Vacant / Maintenance) ───────────────────
function OccupancyBar({ data, height = 220, isBn }: { data: CategoryStat[]; height?: number; isBn: boolean }) {
  const { t } = useTranslation();
  const chartData = data.map((d) => ({
    name: isBn ? d.name_bn : d.name_en,
    [t("occupied")]:          d.occupied,
    [t("vacant")]:            d.vacant,
    [t("under_maintenance")]: d.maintenance,
  }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 4, right: 16, left: -8, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" interval={0} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip />
        <Legend iconType="square" wrapperStyle={{ paddingTop: 8 }} />
        <Bar dataKey={t("occupied")}          fill={BLUE}   radius={[3, 3, 0, 0]} />
        <Bar dataKey={t("vacant")}            fill={GREEN}  radius={[3, 3, 0, 0]} />
        <Bar dataKey={t("under_maintenance")} fill={ORANGE} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────
export function DashboardPage() {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === "bn";
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<DashboardStats>("/dashboard/stats")
      .then((r) => { setStats(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // ── Stat cards ──────────────────────────────────────────────────────────
  const statCards = [
    { title: t("total_mps"),          icon: <TeamOutlined />,      value: stats?.mps.total ?? 0,                color: BLUE    },
    { title: t("total_staff"),        icon: <UserOutlined />,      value: stats?.staff.total ?? 0,              color: "#0050b3" },
    { title: t("total_offices"),      icon: <ApartmentOutlined />, value: stats?.assets.offices.total ?? 0,     color: TEAL,
      suffix: `/ ${stats?.assets.offices.occupied ?? 0} ${t("occupied")}` },
    { title: t("total_flats"),        icon: <HomeOutlined />,      value: stats?.assets.flats.total ?? 0,       color: PURPLE,
      suffix: `/ ${stats?.assets.flats.occupied ?? 0} ${t("occupied")}` },
    { title: t("total_quarters"),     icon: <BuildOutlined />,     value: stats?.assets.quarters.total ?? 0,    color: "#096dd9",
      suffix: `/ ${stats?.assets.quarters.occupied ?? 0} ${t("occupied")}` },
    { title: t("active_allocations"), icon: <SwapOutlined />,      value: stats?.allocations.total_active ?? 0, color: GREEN   },
  ];

  // ── Asset occupancy overview ────────────────────────────────────────────
  const assetOccupancyData = stats ? [
    { name: t("offices"),  [t("occupied")]: stats.assets.offices.occupied,  [t("vacant")]: stats.assets.offices.vacant,  [t("under_maintenance")]: stats.assets.offices.maintenance },
    { name: t("flats"),    [t("occupied")]: stats.assets.flats.occupied,    [t("vacant")]: stats.assets.flats.vacant,    [t("under_maintenance")]: stats.assets.flats.maintenance },
    { name: t("quarters"), [t("occupied")]: stats.assets.quarters.occupied, [t("vacant")]: stats.assets.quarters.vacant, [t("under_maintenance")]: stats.assets.quarters.maintenance },
  ] : [];

  // ── Staff by class ──────────────────────────────────────────────────────
  const staffClassData  = (stats?.staff.by_class ?? []).map((s) => ({ name: classLabel(s.class, t), value: s.count }));
  const classColors     = [BLUE, TEAL, GREEN, ORANGE, "#8c8c8c"];

  // ── Allocation type ─────────────────────────────────────────────────────
  const allocTypeData   = (stats?.allocations.by_type ?? []).map((a) => ({ name: allocTypeLabel(a.type, t), value: a.count }));
  const allocTypeColors = [TEAL, PURPLE, BLUE];

  // ── Recent allocations table ────────────────────────────────────────────
  const recentColumns = [
    {
      title: t("occupant"), key: "occupant",
      render: (_: any, row: RecentAlloc) => {
        const name = row.mp
          ? (isBn ? row.mp.name_bn : row.mp.name_en)
          : row.staff ? (isBn ? row.staff.name_bn : row.staff.name_en) : "—";
        return <Text>{name}</Text>;
      },
    },
    {
      title: t("asset_label"), key: "asset",
      render: (_: any, row: RecentAlloc) => {
        if (row.mp_office)     return `${row.mp_office.building?.name_en ?? ""} - ${row.mp_office.room_number}`;
        if (row.mp_flat)       return `${row.mp_flat.building_name ?? ""} - ${row.mp_flat.flat_number}`;
        if (row.staff_quarter) return `${row.staff_quarter.location} - ${row.staff_quarter.quarter_number}`;
        return "—";
      },
    },
    {
      title: t("asset_type"), dataIndex: "allocation_type", key: "type",
      render: (v: string) => <Tag color={v === "OFFICE" ? "cyan" : v === "MP_FLAT" ? "purple" : "blue"}>{allocTypeLabel(v, t)}</Tag>,
    },
    {
      title: t("date"), dataIndex: "allotment_date", key: "date",
      render: (v: string) => new Date(v).toLocaleDateString(isBn ? "bn-BD" : "en-GB"),
    },
  ];

  return (
    <div style={{ padding: "0 4px" }}>
      <Title level={4} style={{ marginBottom: 20, color: BLUE }}>{t("dashboard")}</Title>

      {/* ── Row 1: Stat cards ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map((c) => (
          <Col xs={24} sm={12} md={8} lg={4} key={c.title}>
            <Card loading={loading} bordered={false} style={{ ...chartCard, borderTop: `3px solid ${c.color}` }}>
              <Statistic
                title={<span style={{ fontSize: 13 }}>{c.title}</span>}
                value={c.value}
                prefix={<span style={{ color: c.color, marginRight: 4 }}>{c.icon}</span>}
                suffix={c.suffix ? <span style={{ fontSize: 12, color: "#8c8c8c" }}>{c.suffix}</span> : undefined}
                valueStyle={{ color: c.color, fontWeight: 700, fontSize: 24 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* ── Row 2: Asset Occupancy Overview + Allocation by Type ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={16}>
          <Card bordered={false} style={chartCard} title={<span style={{ color: BLUE, fontWeight: 600 }}>{t("asset_occupancy")}</span>}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={assetOccupancyData} margin={{ top: 4, right: 16, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 13 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Legend iconType="square" />
                <Bar dataKey={t("occupied")}          fill={BLUE}   radius={[4, 4, 0, 0]} />
                <Bar dataKey={t("vacant")}            fill={GREEN}  radius={[4, 4, 0, 0]} />
                <Bar dataKey={t("under_maintenance")} fill={ORANGE} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card bordered={false} style={{ ...chartCard, height: "100%" }} title={<span style={{ color: BLUE, fontWeight: 600 }}>{t("allocation_by_type")}</span>}>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={allocTypeData} cx="50%" cy="50%" innerRadius={55} outerRadius={95}
                  dataKey="value" labelLine={false} label={renderPieLabel}>
                  {allocTypeData.map((_, i) => <Cell key={i} fill={allocTypeColors[i % allocTypeColors.length]} />)}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* ── Row 3: Quarters by Category + Staff by Class ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={16}>
          <Card bordered={false} style={chartCard} title={<span style={{ color: BLUE, fontWeight: 600 }}>{t("quarters_by_category")}</span>}>
            <OccupancyBar data={stats?.quarters_by_category ?? []} height={260} isBn={isBn} />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card bordered={false} style={{ ...chartCard, height: "100%" }} title={<span style={{ color: BLUE, fontWeight: 600 }}>{t("staff_by_class")}</span>}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={staffClassData} cx="50%" cy="50%" innerRadius={50} outerRadius={88}
                  dataKey="value" labelLine={false} label={renderPieLabel}>
                  {staffClassData.map((_, i) => <Cell key={i} fill={classColors[i % classColors.length]} />)}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* ── Row 4: MP Flats by Category + MP Offices by Building ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={chartCard} title={<span style={{ color: BLUE, fontWeight: 600 }}>{t("flats_by_category")}</span>}>
            <OccupancyBar data={stats?.flats_by_category ?? []} height={250} isBn={isBn} />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card bordered={false} style={chartCard} title={<span style={{ color: BLUE, fontWeight: 600 }}>{t("offices_by_building")}</span>}>
            <OccupancyBar data={stats?.offices_by_building ?? []} height={250} isBn={isBn} />
          </Card>
        </Col>
      </Row>

      {/* ── Row 5: Recent Allocations ── */}
      <Row>
        <Col span={24}>
          <Card bordered={false} style={chartCard}
            title={<span style={{ color: BLUE, fontWeight: 600 }}>{t("recent_allocations")}</span>}>
            <Table
              rowKey="id"
              dataSource={stats?.recent_allocations ?? []}
              columns={recentColumns}
              loading={loading}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
