import React, { useEffect, useState } from "react";
import { Table, Button, Tag, Modal, Form, Input, message, Popconfirm } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import apiClient from "../../../config/apiClient";

interface User {
    key: string;
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    status: string;
    lastLogin: string;
}

const UserManagement: React.FC = () => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem("token");

            if (!token) {
                message.error("Unauthorized. Please log in again.");
                return;
            }

            const response = await apiClient.get("/admin/adminList", {
                headers: { Authorization: `Bearer ${token}` },
            });

            const formattedUsers = response.data.admin.map((user: any) => ({
                key: user._id,
                userId: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                status: user.status || "Active",
                lastLogin: user.lastLogin || "N/A",
            }));

            setUsers(formattedUsers);
        } catch (error: unknown) {
            console.error("Error fetching users:", error);

            if (error instanceof Error) {
                // If error is an Axios error with a response object
                const axiosError = error as { response?: { status?: number } };

                if (axiosError.response?.status === 401) {
                    message.error("Session expired. Please log in again.");
                } else {
                    message.error("Failed to fetch users");
                }
            } else {
                message.error("An unexpected error occurred.");
            }
        }
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            const token = localStorage.getItem("token");

            if (!token) {
                message.error("Unauthorized. Please log in again.");
                return;
            }

            await apiClient.post("/admin/adminCreation", values, {
                headers: { Authorization: `Bearer ${token}` },
            });

            message.success("Admin created successfully!");
            setIsModalVisible(false);
            form.resetFields();
            fetchUsers();
        } catch (error: unknown) {
            console.error("Error creating admin:", error);

            if (error instanceof Error) {
                // Check if error has a response property (common in Axios errors)
                const axiosError = error as { response?: { data?: { error?: string } } };
                message.error(axiosError.response?.data?.error || "Failed to create admin");
            } else {
                message.error("An unexpected error occurred.");
            }
        }

    };

    const handleDelete = async (userId: string) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                message.error("Unauthorized. Please log in again.");
                return;
            }

            await apiClient.post("/admin/deleteAdmin",
                { userId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            message.success("Admin deleted successfully!");
            fetchUsers();
        } catch (error: unknown) {
            console.error("Error deleting admin:", error);

            if (error instanceof Error) {
                // Type assertion for Axios-style errors
                const axiosError = error as { response?: { data?: { message?: string } } };
                message.error(axiosError.response?.data?.message || "Failed to delete admin");
            } else {
                message.error("An unexpected error occurred.");
            }
        }

    };

    const columns = [
        {
            title: "Name",
            dataIndex: "firstName",
            render: (_: any, record: User) => `${record.firstName} ${record.lastName}`,
        },
        { title: "Email", dataIndex: "email" },
        {
            title: "Status",
            dataIndex: "status",
            render: (status: string) => <Tag color="blue">{status}</Tag>,
        },
        { title: "Last Login", dataIndex: "lastLogin" },
        {
            title: "Actions",
            render: (_: any, record: User) => (
                <div style={{ display: "flex", gap: "8px" }}>
                    <Popconfirm
                        title="Are you sure to delete this admin?"
                        onConfirm={() => handleDelete(record.userId)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button icon={<DeleteOutlined />} danger />
                    </Popconfirm>
                </div>
            ),
        },
    ];

    return (
        <div style={{ padding: 20, background: "#fff", borderRadius: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <h2>Users</h2>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                        setIsModalVisible(true);
                        form.resetFields();
                    }}
                >
                    New Admin
                </Button>
            </div>

            <Table columns={columns} dataSource={users} pagination={false} />

            <Modal
                title="Add New Admin"
                visible={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onOk={handleOk}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        label="First Name"
                        name="firstName"
                        rules={[{ required: true, message: "Enter first name" }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label="Last Name"
                        name="lastName"
                        rules={[{ required: true, message: "Enter last name" }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[{ required: true, type: "email", message: "Enter valid email" }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item label="Password" name="password">
                        <Input.Password placeholder="Leave empty for default (123456789)" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default UserManagement;
