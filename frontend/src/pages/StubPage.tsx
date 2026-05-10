import { Card, Typography } from "antd";
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;

interface Props {
  titleKey: string;
  icon?: React.ReactNode;
}

export function StubPage({ titleKey, icon }: Props) {
  const { t } = useTranslation();
  return (
    <Card bordered={false} style={{ borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
      <Title level={4} style={{ color: "#1a4b8c", marginBottom: 8 }}>
        {icon} {t(titleKey)}
      </Title>
      <Text type="secondary">{t("loading")}</Text>
    </Card>
  );
}
