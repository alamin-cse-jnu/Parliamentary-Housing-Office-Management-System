import { useState, useEffect } from "react";
import {
  Card, Button, List, Typography, Space, Divider,
  Alert, Spin, message, Row, Col, Statistic,
} from "antd";
import {
  DatabaseOutlined, ReloadOutlined,
  CheckCircleOutlined, ClockCircleOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import api from "../../services/api";

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

interface BackupEntry {
  filename: string;
  size_bytes: number;
  created_at: string;
}

function fmtBytes(b: number): string {
  if (b < 1024)        return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

export function SettingsPage() {
  const { t } = useTranslation();
  const [backups, setBackups]       = useState<BackupEntry[]>([]);
  const [backing, setBacking]       = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [lastResult, setLastResult] = useState<BackupEntry | null>(null);

  async function loadBackups() {
    setListLoading(true);
    try {
      const res = await api.get<BackupEntry[]>("/backup/list");
      setBackups(res.data);
    } finally {
      setListLoading(false);
    }
  }

  useEffect(() => { loadBackups(); }, []);

  async function triggerBackup() {
    setBacking(true);
    setLastResult(null);
    try {
      const res = await api.post<BackupEntry>("/backup/trigger");
      setLastResult(res.data);
      message.success(`Backup created: ${res.data.filename}`);
      loadBackups();
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? "Backup failed");
    } finally {
      setBacking(false);
    }
  }

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24, color: "#1a4b8c" }}>
        {t("settings")}
      </Title>

      <Row gutter={[24, 24]}>
        {/* Backup trigger */}
        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            style={{ borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
            title={
              <Space>
                <DatabaseOutlined style={{ color: "#1a4b8c" }} />
                <Text strong>Database Backup</Text>
              </Space>
            }
          >
            <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
              Creates a compressed pg_dump of the full database. The file is stored
              on the server at the configured backup directory.
            </Text>

            {lastResult && (
              <Alert
                type="success"
                icon={<CheckCircleOutlined />}
                message="Backup created successfully"
                description={
                  <Space direction="vertical" size={2}>
                    <Text style={{ fontSize: 12 }}>File: <Text code style={{ fontSize: 12 }}>{lastResult.filename}</Text></Text>
                    <Text style={{ fontSize: 12 }}>Size: {fmtBytes(lastResult.size_bytes)}</Text>
                  </Space>
                }
                style={{ marginBottom: 16 }}
              />
            )}

            <Button
              type="primary"
              size="large"
              icon={backing ? <Spin size="small" /> : <DatabaseOutlined />}
              loading={backing}
              onClick={triggerBackup}
              style={{ background: "#1a4b8c" }}
            >
              Trigger Manual Backup
            </Button>

            <Divider />

            {/* Backup list */}
            <Space style={{ marginBottom: 12, justifyContent: "space-between", width: "100%", display: "flex" }}>
              <Text strong>Recent Backups ({backups.length})</Text>
              <Button size="small" icon={<ReloadOutlined />} onClick={loadBackups} loading={listLoading}>
                Refresh
              </Button>
            </Space>

            {backups.length === 0 ? (
              <Text type="secondary">No backups found on server.</Text>
            ) : (
              <List
                size="small"
                loading={listLoading}
                dataSource={backups.slice(0, 10)}
                renderItem={(b) => (
                  <List.Item
                    extra={
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {fmtBytes(b.size_bytes)}
                      </Text>
                    }
                  >
                    <List.Item.Meta
                      avatar={<CheckCircleOutlined style={{ color: "#52c41a", marginTop: 4 }} />}
                      title={
                        <Text style={{ fontSize: 12 }} code>{b.filename}</Text>
                      }
                      description={
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          <ClockCircleOutlined style={{ marginRight: 4 }} />
                          {dayjs(b.created_at).format("DD/MM/YYYY HH:mm")}
                          {" — "}
                          {dayjs(b.created_at).fromNow()}
                        </Text>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        {/* System info */}
        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            style={{ borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
            title={<Text strong>System Information</Text>}
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="System"
                  value="Parliamentary Housing"
                  valueStyle={{ fontSize: 14 }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Parliament"
                  value="13th Parliament"
                  valueStyle={{ fontSize: 14 }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Backend"
                  value="NestJS + Prisma"
                  valueStyle={{ fontSize: 14 }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Database"
                  value="PostgreSQL"
                  valueStyle={{ fontSize: 14 }}
                />
              </Col>
            </Row>

            <Divider />

            <Alert
              type="info"
              showIcon
              message="Backup Policy"
              description="Automated weekly backups are configured by Parliament IT. Use the manual trigger above for on-demand backups before major changes."
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
