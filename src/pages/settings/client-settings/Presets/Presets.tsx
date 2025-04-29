import { useEffect, useState } from "react";
import { Table, Button, Space, Typography, Modal, message } from "antd";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
} from "@ant-design/icons";
import apiClient from "../../../../config/apiClient";
import Presetsgroup from "./Presetsgroup";
import PrsetsField from "./PrsetsField";
import { Field, Group } from "./types";

import { Collapse } from "antd";

const { Panel } = Collapse;


const { Title } = Typography;

const Presets = () => {
    const [isGroupModalVisible, setGroupModalVisible] = useState(false);
    const [isFieldModalVisible, setFieldModalVisible] = useState(false);

    const [editingGroup, setEditingGroup] = useState<Group | null>(null);
    const [editingField, setEditingField] = useState<Field | null>(null);

    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [, setMatchGroups] = useState<any[]>([]);

    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: "presets" | "field" } | null>(null);


    const fetchAll = async () => {
        await Promise.all([fetchGroupsWithFields(),]);
    };


    useEffect(() => {
        fetchAll();
    }, []);



    const fetchGroupsWithFields = async () => {
        try {
            const response = await apiClient.get("/admin/getAllPresetsWithFields");
            const formatted = response.data.data.map((group: any) => ({
                _id: group._id,
                name: group.name,
                formFields: (group.fields || []).map((field: any) => ({
                    _id: field.id,
                    label: field.Label || "",
                    kind: field.Kind || "",
                    fieldType: field.Field || "",
                    required: field.Required,
                    allowEdit: field.AllowEdit,
                })),
            }));
            setGroups(formatted);
            setMatchGroups([]);
        } catch (error) {
            message.error("Failed to load group fields.");
        }
    };





    const handleDeleteGroup = async (id: string) => {
        try {
            await apiClient.post("/admin/deletePreset", { id: id });
            message.success("Group deleted!");
            fetchAll();
        } catch {
            message.error("Failed to delete group.");
        }
    };

    const handleDeleteField = async (id: string) => {
        try {
            await apiClient.post("/admin/deletePresetFields", { id: id });
            message.success("Field deleted!");
            fetchAll();
        } catch {
            message.error("Failed to delete field.");
        }
    };





    const preferenceFieldColumns = [
        { title: "Label", dataIndex: "label", key: "label" },
        { title: "Kind", dataIndex: "kind", key: "kind" },
        { title: "Field", dataIndex: "fieldType", key: "fieldType" },
        { title: "Required", dataIndex: "required", key: "required", render: (value: boolean) => (value ? "Yes" : "No") },
        { title: "Allow Edit", dataIndex: "allowEdit", key: "allowEdit", render: (value: boolean) => (value ? "Yes" : "No") },
        {
            title: "Actions",
            key: "actions",
            render: (_: any, record: Field) => (
                <Space>
                    <EditOutlined
                        onClick={() => {
                            setEditingField(record);           // This is the field or preset being edited
                            setSelectedGroup(groups.find(group => group.formFields.some(field => field._id === record._id)) || null);
                            // This sets the selected group ID (needed for update)
                            setFieldModalVisible(true);  
                        }}
                    />
                    <DeleteOutlined
                        onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget({ id: record._id, type: "field" });
                            setDeleteModalVisible(true);
                        }}
                    />

                </Space>
            ),
        },
    ];



    return (
        <div style={{ padding: 20 }}>
            {/* Preference Fields */}
            <div className="flex justify-between items-center mb-6">
                <Title level={4} className="!mb-0">Presets</Title>
                <Space>
                    <Button
                        icon={<PlusOutlined />}
                        onClick={() => {
                            setEditingGroup(null);
                            setGroupModalVisible(true);
                        }}
                    >
                        Add Presets
                    </Button>
                </Space>
            </div>

            <Collapse accordion style={{ background: "white" }}>
                {groups.map((group: Group) => (
                    <Panel
                        header={
                            <div className="flex justify-between items-center w-full pr-4">
                                <span>{group.name}</span>
                                <Space>
                                    <EditOutlined
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingGroup(group);
                                            setGroupModalVisible(true);
                                        }}
                                    />
                                    <DeleteOutlined
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDeleteTarget({ id: group._id, type: "presets" });
                                            setDeleteModalVisible(true);
                                        }}
                                    />
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent collapse toggle
                                            setSelectedGroup(group); // Send group ID
                                            setEditingField(null);
                                            setFieldModalVisible(true);
                                        }}
                                    >
                                        Add Field
                                    </Button>
                                </Space>
                            </div>
                        }
                        key={group._id}
                    >
                        <Table
                            columns={preferenceFieldColumns}
                            dataSource={group.formFields}
                            pagination={false}
                            rowKey="_id"
                        />
                        <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            className="mt-4"
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



            {/* Modals */}
            <Presetsgroup
                visible={isGroupModalVisible}
                onClose={() => {
                    setGroupModalVisible(false);
                    setEditingGroup(null);
                    fetchAll();
                }}
                editingGroup={editingGroup}
                fetchGroups={fetchAll}
            />

            <PrsetsField
                visible={isFieldModalVisible}
                onClose={() => {
                    setFieldModalVisible(false);
                    setEditingField(null);
                    setSelectedGroup(null);
                    fetchAll();
                }}
                editingField={editingField}
                selectedGroup={selectedGroup}
                fetchPresetsGroups={fetchAll}
            />
            <Modal
                title={`Are you sure you want to delete this ${deleteTarget?.type}?`}
                open={deleteModalVisible}
                onOk={() => {
                    if (deleteTarget?.type === "presets") handleDeleteGroup(deleteTarget.id);
                    else if (deleteTarget?.type === "field") handleDeleteField(deleteTarget.id);
                    setDeleteModalVisible(false);
                }}
                onCancel={() => setDeleteModalVisible(false)}
                okText="Delete"
                okButtonProps={{ danger: true }}
            >
                <p>This action cannot be undone.</p>
            </Modal>


        </div>
    );
};

export default Presets;
