import { useState } from "react";
import logo from "../assets/parliament-logo.png";
import { Layout, Menu, Button, Space, Typography, Avatar, Dropdown, Divider } from "antd";
import {
  DashboardOutlined, TeamOutlined, UserOutlined,
  BuildOutlined, SwapOutlined, FileTextOutlined,
  AuditOutlined, SettingOutlined, LogoutOutlined, MenuFoldOutlined,
  MenuUnfoldOutlined, BankOutlined, OrderedListOutlined, HistoryOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import { LanguageToggle } from "./LanguageToggle";

const { Sider, Header, Content, Footer } = Layout;
const { Text } = Typography;

export function AppLayout() {
  const { t } = useTranslation();
  const { user, logout, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { key: "/",            icon: <DashboardOutlined />, label: t("dashboard") },
    { key: "/tenure",      icon: <BankOutlined />,      label: t("tenure") },
    {
      key: "mps-group",
      icon: <TeamOutlined />,
      label: t("mps"),
      children: [
        { key: "/mps",            label: t("mps") },
        { key: "/offices",        label: t("offices") },
        { key: "/flats",          label: t("flats") },
      ],
    },
    {
      key: "staff-group",
      icon: <UserOutlined />,
      label: t("staff"),
      children: [
        { key: "/staff",          label: t("staff") },
        { key: "/quarters",       label: t("quarters") },
      ],
    },
    { key: "/allocations",    icon: <SwapOutlined />,       label: t("allocations") },
    { key: "/reports",        icon: <FileTextOutlined />,   label: t("reports") },
    { key: "/lookups",        icon: <OrderedListOutlined />, label: t("lookups") },
    { key: "/upload-history", icon: <HistoryOutlined />,    label: t("upload") + " History" },
    ...(isSuperAdmin
      ? [
          { key: "/audit",   icon: <AuditOutlined />,   label: t("audit_log") },
          { key: "/users",   icon: <BuildOutlined />,   label: t("users") },
        ]
      : []),
    { key: "/settings",    icon: <SettingOutlined />,   label: t("settings") },
  ];

  const selectedKey = menuItems.flatMap((m: any) => m.children ?? [m]).find((m: any) =>
    location.pathname === m.key || (m.key !== "/" && location.pathname.startsWith(m.key)),
  )?.key ?? location.pathname;

  const openKeys = menuItems
    .filter((m: any) => m.children?.some((c: any) => location.pathname.startsWith(c.key)))
    .map((m) => m.key);

  const userMenuItems = [
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: t("logout"),
      onClick: () => { logout(); navigate("/login"); },
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        trigger={null}
        width={220}
        style={{ background: "#1a4b8c" }}
      >
        <div
          onClick={() => navigate("/")}
          style={{
            height: 64, display: "flex", alignItems: "center", justifyContent: "center",
            background: "#163d73", padding: "0 12px", overflow: "hidden", gap: 8,
            cursor: "pointer",
          }}
        >
          <img src={logo} alt="Parliament" style={{ width: 36, height: 36, objectFit: "contain", flexShrink: 0 }} />
          {!collapsed && (
            <Text style={{ color: "#fff", fontSize: 11, lineHeight: 1.3 }}>
              {t("app_name")}
            </Text>
          )}
        </div>

        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={openKeys}
          items={menuItems}
          onClick={({ key }) => { if (!key.endsWith("-group")) navigate(key); }}
          style={{ background: "#1a4b8c", border: "none", color: "#c8d8f0" }}
          theme="dark"
        />
      </Sider>

      <Layout>
        <Header style={{
          background: "#1a4b8c", padding: "0 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ color: "#fff", fontSize: 18 }}
          />

          <Space>
            <LanguageToggle />
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: "pointer" }}>
                <Avatar style={{ background: "#163d73" }} icon={<UserOutlined />} />
                {user && (
                  <Text style={{ color: "#fff", fontSize: 13 }}>
                    {user.full_name}
                  </Text>
                )}
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ margin: 24, minHeight: 280 }}>
          <Outlet />
        </Content>

        <Footer style={{ padding: "10px 24px", background: "#f5f5f5", borderTop: "1px solid #e8e8e8" }}>
          <Divider style={{ margin: "0 0 8px" }} />
          <Space split={<span style={{ color: "#ccc" }}>|</span>} style={{ width: "100%", justifyContent: "center", flexWrap: "wrap" }}>
            <Text style={{ fontSize: 11, color: "#888" }}>
              © Bangladesh Parliament Secretariat — B&amp;IT
            </Text>
            <Text style={{ fontSize: 11, color: "#aaa" }}>
              Developed by{" "}
              <span style={{ color: "#666", fontWeight: 600 }}>Md. Al-Amin Hossain</span>
              , Computer Programmer, BPS
            </Text>
          </Space>
        </Footer>
      </Layout>
    </Layout>
  );
}
