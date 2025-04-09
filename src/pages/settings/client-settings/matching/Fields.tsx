import { useEffect, useState } from "react";
import { Table, Button, Collapse, Space, Typography, Modal, message } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import apiClient from "../../../../config/apiClient";
import GroupModal from "./GroupModal";
import FieldModal from "./MatchingModal";
import { Field, Group } from "./types";

const { Panel } = Collapse;
const { confirm } = Modal;

const Fields = () => {
    const [isGroupModalVisible, setGroupModalVisible] = useState(false);
    const [isFieldModalVisible, setFieldModalVisible] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);
    const [editingField, setEditingField] = useState<Field | null>(null);
    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

    useEffect(() => {
        fetchGroupsWithFields();
    }, []);

    const fetchGroupsWithFields = async () => {
        try {
            const response = await apiClient.get("/admin/getAllPreferencesGroupFields");
            const formatted = response.data.data.map((group: any) => ({
                _id: group._id,
                name: group.groupName,
                formFields: (group.fields || []).map((field: any) => ({
                    ...field,
                    _id: field.fieldId,
                    label: field.fieldName,
                })),
            }));
            setGroups(formatted);
        } catch (error) {
            message.error("Failed to load group fields.");
        }
    };
    


    const showDeleteConfirm = (id: string, type: "group" | "field") => {
        confirm({
            title: `Are you sure you want to delete this ${type}?`,
            icon: <ExclamationCircleOutlined />,
            content: "This action cannot be undone.",
            onOk() {
                type === "group" ? handleDeleteGroup(id) : handleDeleteField(id);
            },
        });
    };

    const handleDeleteGroup = async (id: string) => {
        try {
            await apiClient.post("/admin/deletePreferencesGroup", { groupId: id });
            message.success("Group deleted!");
            fetchGroupsWithFields();
        } catch {
            message.error("Failed to delete group.");
        }
    };

    const handleDeleteField = async (id: string) => {
        try {
            await apiClient.post("/admin/deletePreferencesField", { fieldId: id });
            message.success("Field deleted!");
            fetchGroupsWithFields();
        } catch {
            message.error("Failed to delete field.");
        }
    };

    return (
        <div style={{ padding: 20 }}>
            <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 16 }}>
                <Typography.Title level={4}>Client Fields</Typography.Title>
                <Space>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                        setEditingField(null);
                        setFieldModalVisible(true);
                    }}>
                        Add Field
                    </Button>
                    <Button icon={<PlusOutlined />} onClick={() => {
                        setEditingGroup(null);
                        setGroupModalVisible(true);
                    }}>
                        Add Group
                    </Button>
                </Space>
            </Space>

            <Collapse accordion>
                {groups.map(group => (
                    <Panel
                        header={
                            <Space>
                                {group.name}
                                <EditOutlined onClick={() => {
                                    setEditingGroup(group);
                                    setGroupModalVisible(true);
                                }} />
                                <DeleteOutlined onClick={() => showDeleteConfirm(group._id, "group")} />
                            </Space>
                        }
                        key={group._id}
                    >
                        <Table
                            columns={[
                                { title: "Label", dataIndex: "label", key: "label" },
                                { title: "Profile Field", dataIndex: "profileField", key: "profileField" },
                                { title: "Client Types", dataIndex: "clientTypes", key: "clientTypes" },
                                { title: "Weight", dataIndex: "weight", key: "weight" },
                                {
                                    title: "Use in Match",
                                    dataIndex: "useInMatch",
                                    key: "useInMatch",
                                    render: (value) => (value ? "Yes" : "No"),
                                },
                                {
                                    title: "Deal Break",
                                    dataIndex: "dealBreak",
                                    key: "dealBreak",
                                    render: (value) => (value ? "Yes" : "No"),
                                },
                                {
                                    title: "Actions",
                                    key: "actions",
                                    render: (_, record) => (
                                        <Space>
                                            <EditOutlined
                                                onClick={() => {
                                                    setEditingField(record);
                                                    setFieldModalVisible(true);
                                                }}
                                            />
                                            <DeleteOutlined onClick={() => showDeleteConfirm(record._id, "field")} />
                                        </Space>
                                    ),
                                },
                            ]}
                            dataSource={group.formFields}
                            pagination={false}
                            rowKey="_id"
                        />

                        <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            style={{ marginTop: 10 }}
                            onClick={() => {
                                setSelectedGroup(group);
                                setEditingField(null);
                                setFieldModalVisible(true);
                            }}
                        >
                            Add Field to {group.name}
                        </Button>
                    </Panel>
                ))}
            </Collapse>

            <GroupModal
                visible={isGroupModalVisible}
                onClose={() => {
                    setGroupModalVisible(false);
                    setEditingGroup(null);
                    fetchGroupsWithFields();
                }}
                editingGroup={editingGroup}
                fetchGroups={fetchGroupsWithFields}
            />

            <FieldModal
                visible={isFieldModalVisible}
                onClose={() => {
                    setFieldModalVisible(false);
                    setEditingField(null);
                    setSelectedGroup(null);
                    fetchGroupsWithFields();
                }}
                editingField={editingField}
                selectedGroup={selectedGroup}
                fetchGroups={fetchGroupsWithFields}
            />
        </div>
    );
};

export default Fields;
