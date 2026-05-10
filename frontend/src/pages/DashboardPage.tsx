import { Card, Col, Row, Statistic, Typography } from "antd";
import {
  TeamOutlined, UserOutlined, HomeOutlined,
  ApartmentOutlined, SwapOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import api from "../services/api";

const { Title } = Typography;

interface Stats {
  mps: number;
  staff: number;
  offices: number;
  flats: number;
  quarters: number;
  active_allocations: number;
}

export function DashboardPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<Partial<Stats>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get("/mps").then((r) => r.data?.length ?? 0),
      api.get("/staff").then((r) => r.data?.length ?? 0),
      api.get("/offices").then((r) => r.data?.length ?? 0),
      api.get("/mp-flats").then((r) => r.data?.length ?? 0),
      api.get("/quarters").then((r) => r.data?.length ?? 0),
      api.get("/allocations?status=ACTIVE").then((r) => r.data?.length ?? 0),
    ]).then(([mps, staff, offices, flats, quarters, allocs]) => {
      setStats({
        mps:               mps.status === "fulfilled" ? mps.value : 0,
        staff:             staff.status === "fulfilled" ? staff.value : 0,
        offices:           offices.status === "fulfilled" ? offices.value : 0,
        flats:             flats.status === "fulfilled" ? flats.value : 0,
        quarters:          quarters.status === "fulfilled" ? quarters.value : 0,
        active_allocations:allocs.status === "fulfilled" ? allocs.value : 0,
      });
      setLoading(false);
    });
  }, []);

  const cards = [
    { title: t("mps"),        value: stats.mps,               icon: <TeamOutlined style={{ color: "#1a4b8c" }} /> },
    { title: t("staff"),      value: stats.staff,              icon: <UserOutlined style={{ color: "#1a4b8c" }} /> },
    { title: t("offices"),    value: stats.offices,            icon: <ApartmentOutlined style={{ color: "#1a4b8c" }} /> },
    { title: t("flats"),      value: stats.flats,              icon: <HomeOutlined style={{ color: "#1a4b8c" }} /> },
    { title: t("quarters"),   value: stats.quarters,           icon: <HomeOutlined style={{ color: "#1a4b8c" }} /> },
    { title: t("allocations"),value: stats.active_allocations, icon: <SwapOutlined style={{ color: "#1a4b8c" }} /> },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24, color: "#1a4b8c" }}>
        {t("dashboard")}
      </Title>
      <Row gutter={[16, 16]}>
        {cards.map((c) => (
          <Col xs={24} sm={12} md={8} lg={6} key={c.title}>
            <Card loading={loading} bordered={false} style={{ borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              <Statistic
                title={c.title}
                value={c.value ?? 0}
                prefix={c.icon}
                valueStyle={{ color: "#1a4b8c", fontWeight: 700 }}
              />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
