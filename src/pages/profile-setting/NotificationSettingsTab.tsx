import React, { useEffect, useState } from "react";
import { Table, Switch, message, Spin, Card, Button } from "antd";
import apiClient from "../../config/apiClient";

interface NotificationType {
  email: boolean;
  sms: boolean;
  web: boolean;
}

const NotificationSettingsTab: React.FC = () => {
  const [notificationSettings, setNotificationSettings] = useState<Record<string, NotificationType>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedData = JSON.parse(localStorage.getItem("admin") || "{}");
    if (storedData.notification) {
      setNotificationSettings(storedData.notification);
    }
  }, []);

  const handleToggle = (key: string, field: keyof NotificationType, value: boolean) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    try {
      const storedData = JSON.parse(localStorage.getItem("admin") || "{}");
      const userId: string | undefined = storedData._id;

      if (!userId) {
        message.error("User ID is missing. Please log in again.");
        return;
      }

      const payload = {
        userId,
        notification: notificationSettings,
      };

      const response = await apiClient.post("/admin/updateAdminNotification", payload);

      storedData.notification = notificationSettings;
      localStorage.setItem("admin", JSON.stringify(storedData));

      message.success(response.data.message || "Notification settings updated successfully.");
    } catch (error) {
      message.error("Failed to update notification settings.");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Notification Type",
      dataIndex: "type",
      key: "type",
      className: "font-medium text-gray-700",
    },
    {
      title: "Email",
      dataIndex: "key",
      key: "email",
      render: (key: string) => (
        <Switch
          checked={notificationSettings[key]?.email || false}
          onChange={(checked) => handleToggle(key, "email", checked)}
        />
      ),
    },
    {
      title: "SMS",
      dataIndex: "key",
      key: "sms",
      render: (key: string) => (
        <Switch
          checked={notificationSettings[key]?.sms || false}
          onChange={(checked) => handleToggle(key, "sms", checked)}
        />
      ),
    },
    {
      title: "Web",
      dataIndex: "key",
      key: "web",
      render: (key: string) => (
        <Switch
          checked={notificationSettings[key]?.web || false}
          onChange={(checked) => handleToggle(key, "web", checked)}
        />
      ),
    },
  ];

  const data = [
    { key: "birthdayReminder", type: "Birthday Reminder" },
    { key: "newSubmittedClient", type: "New Submitted Client" },
    { key: "reminder", type: "Reminder" },
    { key: "incomingTextMessage", type: "Incoming Text Message" },
    { key: "systemMessage", type: "System Message" },
    { key: "systemError", type: "System Error" },
    { key: "newTaskAssigned", type: "New Task Assigned" },
    { key: "clientProfileUpdate", type: "Client Profile Update" },
    { key: "mentions", type: "Mentions" },
  ];

  return (
    <Spin spinning={loading}>
      <Card title="Notification Settings" className="mb-4">
        <Table columns={columns} dataSource={data} pagination={false} rowKey="key" bordered />
      </Card>
      <div className="flex justify-end mt-4">
        <Button type="primary" onClick={handleSaveChanges}>
          Save Changes
        </Button>
      </div>
    </Spin>
  );
};

export default NotificationSettingsTab;
