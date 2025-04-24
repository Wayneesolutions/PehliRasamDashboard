import { useEffect, useState } from "react";
import { Table, Button, Collapse, Space, Typography, Modal, message } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import apiClient from "../../../../config/apiClient";
import GroupModal from "./GroupModal";
import FieldModal from "./FieldModal";
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
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            const response = await apiClient.get("/admin/getFromGroupList");
            const formattedGroups: Group[] = response.data.data.map((group: { _id: string; groupName: string; fields: any[]; }) => ({
                _id: group._id,
                name: group.groupName,
                formFields: group.fields.map((field) => ({
                    _id: field.attributeId,
                    attributeName: field.attributeName,
                    attributeType: field.attributeType,
                    attributeOption: field.attributeOption || [],
                    attributeStatus: field.attributeStatus ?? true,
                    attributePlaceHolder: field.attributePlaceHolder ?? "",
                    visibility: field.visibility ?? true,
                    active: field.active ?? true,
                    form_group_id: group._id,
                })),
            }));
            setGroups(formattedGroups);
        } catch (error) {
            message.error("Failed to load groups.");
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
            await apiClient.post("/admin/deleteFromGroup", { groupId: id });
            message.success("Group deleted!");
            fetchGroups();
        } catch {
            message.error("Failed to delete group.");
        }
    };

    const handleDeleteField = async (id: string) => {
        try {
            await apiClient.post("/admin/deleteFormField", { fieldId: id });
            message.success("Field deleted!");
            fetchGroups();
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

            <Collapse accordion style={{
                background:"white"
            }}>
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
                                { title: "Name", dataIndex: "attributeName", key: "attributeName" },
                                { title: "Type", dataIndex: "attributeType", key: "attributeType" },
                                { title: "Options", dataIndex: "attributeOption", key: "attributeOption", render: (options) => options.join(", ") },
                                { title: "Visibility", dataIndex: "visibility", key: "visibility", render: (visible) => (visible ? "Yes" : "No") },
                                { title: "Active", dataIndex: "active", key: "active", render: (active) => (active ? "Yes" : "No") },
                                {
                                    title: "Actions",
                                    render: (_, record) => (
                                        <Space>
                                            <EditOutlined onClick={() => {
                                                setEditingField(record);
                                                setFieldModalVisible(true);
                                            }} />
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
                    fetchGroups();
                }}
                editingGroup={editingGroup}
                fetchGroups={fetchGroups}
            />

            <FieldModal
                visible={isFieldModalVisible}
                onClose={() => {
                    setFieldModalVisible(false);
                    setEditingField(null);
                    setSelectedGroup(null);
                    fetchGroups();
                }}
                editingField={editingField}
                selectedGroup={selectedGroup}
                fetchGroups={fetchGroups}
            />
        </div>
    );
};

export default Fields;
