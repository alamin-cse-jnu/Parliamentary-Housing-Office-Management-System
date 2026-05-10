import { Form, Input, Button, Card, message, Typography, Space } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import logo from "../assets/parliament-logo.png";
import { authApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { LanguageToggle } from "../components/LanguageToggle";

const { Title, Text } = Typography;

export function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  async function onFinish(values: { username: string; password: string }) {
    try {
      const res = await authApi.login(values.username, values.password);
      login(res.data.access_token, res.data.user);
      navigate("/");
    } catch {
      message.error(t("login_failed"));
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1a4b8c 0%, #163d73 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ position: "absolute", top: 16, right: 16 }}>
        <LanguageToggle />
      </div>

      <Card style={{ width: 400, borderRadius: 16, boxShadow: "0 12px 40px rgba(0,0,0,0.35)", padding: "8px 0" }}>
        <Space direction="vertical" align="center" style={{ width: "100%", marginBottom: 24 }}>
          <img
            src={logo}
            alt="Bangladesh Jatiya Sangsad"
            style={{ width: 90, height: 90, objectFit: "contain" }}
          />
          <Title level={4} style={{ margin: "4px 0 0", textAlign: "center", color: "#1a4b8c", lineHeight: 1.35 }}>
            {t("app_name")}
          </Title>
          <Text type="secondary" style={{ fontSize: 12, letterSpacing: 0.3 }}>
            Bangladesh Parliament Secretariat
          </Text>
        </Space>

        <Form form={form} onFinish={onFinish} layout="vertical" requiredMark={false}>
          <Form.Item
            name="username"
            rules={[{ required: true, message: t("val_required") }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder={t("username")}
              size="large"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: t("val_required") }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder={t("password")}
              size="large"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              style={{ background: "#1a4b8c", height: 44, fontSize: 15 }}
            >
              {t("login")}
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <div style={{ marginTop: 24, textAlign: "center" }}>
        <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 11 }}>
          © Bangladesh Parliament Secretariat — B&IT
        </Text>
        <br />
        <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>
          Developed by{" "}
          <span style={{ color: "rgba(255,255,255,0.65)", fontWeight: 600 }}>
            Md. Al-Amin Hossain
          </span>
          , Computer Programmer, BPS
        </Text>
      </div>
    </div>
  );
}
