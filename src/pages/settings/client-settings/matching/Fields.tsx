import { useEffect, useState } from "react";
import { Table, Button, Space, Typography, Modal, message } from "antd";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    ExclamationCircleOutlined,
} from "@ant-design/icons";
import apiClient from "../../../../config/apiClient";
import GroupModal from "./GroupModal";
import FieldModal from "./MatchingModal";
import MatchGroupModal from "./MatchGroupModal";
import { Field, Group } from "./types";

import { Collapse } from "antd";

const { Panel } = Collapse;


const { Title } = Typography;
const { confirm } = Modal;

const Fields = () => {
    const [isGroupModalVisible, setGroupModalVisible] = useState(false);
    const [isFieldModalVisible, setFieldModalVisible] = useState(false);
    const [isMatchGroupModalVisible, setMatchGroupModalVisible] = useState(false);

    const [editingGroup, setEditingGroup] = useState<Group | null>(null);
    const [editingField, setEditingField] = useState<Field | null>(null);
    const [editingMatchGroup, setEditingMatchGroup] = useState<any | null>(null);

    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [matchGroups, setMatchGroups] = useState<any[]>([]);

    const fetchAll = async () => {
        await Promise.all([fetchGroupsWithFields(), fetchMatchGroups()]);
    };


    useEffect(() => {
        fetchAll();
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
                matchGroup: group.matchGroup,
            }));
            setGroups(formatted);

            const allMatchGroups = formatted.flatMap((group: any) =>
                (group.matchGroup || []).map((match: any) => ({
                    ...match,
                    groupId: group._id,
                    groupName: group.name,
                }))
            );
            setMatchGroups(allMatchGroups);
        } catch (error) {
            message.error("Failed to load group fields.");
        }
    };

    const fetchMatchGroups = async () => {
        try {
            const res = await apiClient.get("/admin/getAllMatchGroups");
            setMatchGroups(res.data.data || []);
        } catch {
            message.error("Failed to fetch match groups.");
        }
    };

    const showDeleteConfirm = (id: string, type: "group" | "field" | "matchGroup") => {
        confirm({
            title: `Are you sure you want to delete this ${type}?`,
            icon: <ExclamationCircleOutlined />,
            content: "This action cannot be undone.",
            onOk() {
                if (type === "group") handleDeleteGroup(id);
                else if (type === "field") handleDeleteField(id);
                else if (type === "matchGroup") handleDeleteMatchGroup(id);
            },
        });
    };


    const handleDeleteGroup = async (id: string) => {
        try {
            await apiClient.post("/admin/deletePreferencesGroup", { groupId: id });
            message.success("Group deleted!");
            fetchAll();
        } catch {
            message.error("Failed to delete group.");
        }
    };

    const handleDeleteField = async (id: string) => {
        try {
            await apiClient.post("/admin/deletePreferencesField", { fieldId: id });
            message.success("Field deleted!");
            fetchAll();
        } catch {
            message.error("Failed to delete field.");
        }
    };

    const handleDeleteMatchGroup = async (matchGroupId: string) => {
        console.log("Deleting Match Group:", matchGroupId);
        try {
            await apiClient.post("/admin/deleteMatchGroup", { id: matchGroupId });
            message.success("Match group deleted.");
            fetchAll();
        } catch {
            message.error("Failed to delete match group.");
        }
    };



    const preferenceFieldColumns = [
        { title: "Label", dataIndex: "label", key: "label" },
        { title: "Profile Field", dataIndex: "profileField", key: "profileField" },
        { title: "Client Types", dataIndex: "clientTypes", key: "clientTypes" },
        { title: "Weight", dataIndex: "weight", key: "weight" },
        {
            title: "Use in Match",
            dataIndex: "useInMatch",
            key: "useInMatch",
            render: (value: boolean) => (value ? "Yes" : "No"),
        },
        {
            title: "Deal Break",
            dataIndex: "dealBreak",
            key: "dealBreak",
            render: (value: boolean) => (value ? "Yes" : "No"),
        },
        {
            title: "Actions",
            key: "actions",
            render: (_: any, record: Field) => (
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
    ];

    return (
        <div style={{ padding: 20 }}>
            {/* Preference Fields */}
      {/* Preference Fields */}
<div className="flex justify-between items-center mb-6">
    <Title level={4} className="!mb-0">Preference Fields</Title>
    <Space>
        <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
                setEditingField(null);
                setFieldModalVisible(true);
            }}
        >
            Add Field
        </Button>
        <Button
            icon={<PlusOutlined />}
            onClick={() => {
                setEditingGroup(null);
                setGroupModalVisible(true);
            }}
        >
            Add Group
        </Button>
    </Space>
</div>

<Collapse accordion>
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
                                showDeleteConfirm(group._id, "group");
                            }}
                        />
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


            {/* Match Groups */}
            <div className="flex justify-between items-center mt-12 mb-4">
                <Title level={4} className="!mb-0">Match Groups</Title>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                        setEditingMatchGroup(null);
                        setMatchGroupModalVisible(true);
                    }}
                >
                    Add Match Group
                </Button>
            </div>

            <Table
                columns={[
                    { title: "Group Name", dataIndex: "groupName", key: "groupName" },
                    {
                        title: "Actions",
                        key: "actions",
                        render: (_: any, record: any) => (
                            <Space>
                                <EditOutlined
                                    onClick={() => {
                                        setEditingMatchGroup(record);
                                        setMatchGroupModalVisible(true);
                                    }}
                                />
                                <DeleteOutlined
                                    onClick={() =>
                                        showDeleteConfirm(record._id, "matchGroup")
                                    }
                                />
                            </Space>
                        ),
                    },
                ]}
                dataSource={matchGroups}
                rowKey="_id"
                pagination={false}
            />

            {/* Modals */}
            <GroupModal
                visible={isGroupModalVisible}
                onClose={() => {
                    setGroupModalVisible(false);
                    setEditingGroup(null);
                    fetchAll();
                }}
                editingGroup={editingGroup}
                fetchGroups={fetchAll}
            />

            <FieldModal
                visible={isFieldModalVisible}
                onClose={() => {
                    setFieldModalVisible(false);
                    setEditingField(null);
                    setSelectedGroup(null);
                    fetchAll();
                }}
                editingField={editingField}
                selectedGroup={selectedGroup}
                fetchGroups={fetchAll}
            />

            <MatchGroupModal
                visible={isMatchGroupModalVisible}
                onClose={() => {
                    setMatchGroupModalVisible(false);
                    setEditingMatchGroup(null);
                    fetchAll();
                }}
                editingMatchGroup={editingMatchGroup}
                fetchMatchGroups={fetchAll}
            />


        </div>
    );
};

export default Fields;
