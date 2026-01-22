import React, { useEffect, useState } from "react";
import { Table, Button, Space, Typography, Modal, message } from "antd";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    HolderOutlined,
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
                    _id: field.presetFieldId || field.id, // Use presetFieldId if available, fallback to id
                    presetFieldId: field.presetFieldId, // Store the PresetFields document ID
                    fieldsId: field.id, // Store the FormField/PreferencesField ID
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

    const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null);
    const [draggedFieldId, setDraggedFieldId] = useState<{ groupId: string; fieldId: string } | null>(null);
    const [draggedOverGroupIndex, setDraggedOverGroupIndex] = useState<number | null>(null);
    const [draggedOverFieldIndex, setDraggedOverFieldIndex] = useState<number | null>(null);
    const [originalGroupIndex, setOriginalGroupIndex] = useState<number | null>(null);
    const [originalFieldIndex, setOriginalFieldIndex] = useState<number | null>(null);

    const handleGroupDragStart = (groupId: string, e: React.DragEvent) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', groupId);
        const currentIndex = groups.findIndex(g => g._id === groupId);
        setDraggedGroupId(groupId);
        setOriginalGroupIndex(currentIndex);
        setDraggedOverGroupIndex(currentIndex);
    };

    const handleGroupDragOver = (index: number, e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        
        if (draggedGroupId && originalGroupIndex !== null && index !== draggedOverGroupIndex) {
            // Update UI immediately
            const newGroups = [...groups];
            const draggedItem = newGroups[originalGroupIndex];
            newGroups.splice(originalGroupIndex, 1);
            newGroups.splice(index, 0, draggedItem);
            setGroups(newGroups);
            setDraggedOverGroupIndex(index);
        }
    };

    const handleGroupDrop = async (targetIndex: number, e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (draggedGroupId !== null && originalGroupIndex !== null && targetIndex !== null) {
            // Only call API if position actually changed
            if (originalGroupIndex !== targetIndex) {
                // Calculate direction and moves needed
                const direction = targetIndex < originalGroupIndex ? 'up' : 'down';
                const moves = Math.abs(targetIndex - originalGroupIndex);
                
                // Move step by step
                let success = true;
                for (let i = 0; i < moves; i++) {
                    try {
                        const res = await apiClient.post("/admin/updatePresetGroupOrder", { 
                            presetId: draggedGroupId, 
                            direction 
                        });
                        // Check if the response indicates it's already at the boundary
                        if (!res.data.success && res.data.message && 
                            (res.data.message.includes("already at") || res.data.message.includes("Cannot move"))) {
                            // Skip this move, it's already at the boundary
                            break;
                        }
                    } catch (error: any) {
                        // Only show error if it's not a boundary case
                        if (error.response?.data?.message && 
                            !error.response.data.message.includes("already at")) {
                            message.error(error.response?.data?.message || "Failed to update preset order.");
                            success = false;
                        }
                        // Revert UI on error
                        fetchAll();
                        break;
                    }
                }
                if (success) {
                    message.success("Preset order updated!");
                    fetchAll();
                }
            }
        }
        setDraggedGroupId(null);
        setDraggedOverGroupIndex(null);
        setOriginalGroupIndex(null);
    };

    const handleGroupDragEnd = () => {
        // If drag ended without drop, revert to original order
        if (originalGroupIndex !== null && draggedOverGroupIndex !== null && originalGroupIndex !== draggedOverGroupIndex) {
            fetchAll();
        }
        setDraggedGroupId(null);
        setDraggedOverGroupIndex(null);
        setOriginalGroupIndex(null);
    };

    const handleFieldDragStart = (groupId: string, fieldId: string, e: React.DragEvent) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', fieldId);
        const group = groups.find(g => g._id === groupId);
        if (group) {
            const currentIndex = group.formFields.findIndex(f => f._id === fieldId);
            setDraggedFieldId({ groupId, fieldId });
            setOriginalFieldIndex(currentIndex);
            setDraggedOverFieldIndex(currentIndex);
        }
    };

    const handleFieldDragOver = (index: number, groupId: string, e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        
        if (draggedFieldId && draggedFieldId.groupId === groupId && originalFieldIndex !== null && index !== draggedOverFieldIndex) {
            // Update UI immediately
            const newGroups = [...groups];
            const group = newGroups.find(g => g._id === groupId);
            if (group) {
                const newFields = [...group.formFields];
                const draggedItem = newFields[originalFieldIndex];
                newFields.splice(originalFieldIndex, 1);
                newFields.splice(index, 0, draggedItem);
                group.formFields = newFields;
                setGroups(newGroups);
                setDraggedOverFieldIndex(index);
            }
        }
    };

    const handleFieldDrop = async (targetIndex: number, groupId: string, e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (draggedFieldId && targetIndex !== null && draggedFieldId.groupId === groupId && originalFieldIndex !== null) {
            // Only call API if position actually changed
            if (originalFieldIndex !== targetIndex) {
                // Calculate direction and moves needed
                const direction = targetIndex < originalFieldIndex ? 'up' : 'down';
                const moves = Math.abs(targetIndex - originalFieldIndex);
                
                // Move step by step
                let success = true;
                for (let i = 0; i < moves; i++) {
                    try {
                        const res = await apiClient.post("/admin/updatePresetFieldOrder", { 
                            presetFieldId: draggedFieldId.fieldId, 
                            direction 
                        });
                        // Check if the response indicates it's already at the boundary
                        if (!res.data.success && res.data.message && 
                            (res.data.message.includes("already at") || res.data.message.includes("Cannot move"))) {
                            // Skip this move, it's already at the boundary
                            break;
                        }
                    } catch (error: any) {
                        // Only show error if it's not a boundary case
                        if (error.response?.data?.message && 
                            !error.response.data.message.includes("already at")) {
                            message.error(error.response?.data?.message || "Failed to update preset field order.");
                            success = false;
                        }
                        // Revert UI on error
                        fetchAll();
                        break;
                    }
                }
                if (success) {
                    message.success("Preset field order updated!");
                    fetchAll();
                }
            }
        }
        setDraggedFieldId(null);
        setDraggedOverFieldIndex(null);
        setOriginalFieldIndex(null);
    };

    const handleFieldDragEnd = () => {
        // If drag ended without drop, revert to original order
        if (originalFieldIndex !== null && draggedOverFieldIndex !== null && originalFieldIndex !== draggedOverFieldIndex) {
            fetchAll();
        }
        setDraggedFieldId(null);
        setDraggedOverFieldIndex(null);
        setOriginalFieldIndex(null);
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
                            setEditingField(record);
                            setSelectedGroup(groups.find(group => group.formFields.some(field => field._id === record._id)) || null);
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
                {groups.map((group: Group, groupIndex: number) => (
                    <Panel
                        header={
                            <div 
                                draggable
                                onDragStart={(e) => handleGroupDragStart(group._id, e)}
                                onDragOver={(e) => handleGroupDragOver(groupIndex, e)}
                                onDrop={(e) => handleGroupDrop(groupIndex, e)}
                                onDragEnd={handleGroupDragEnd}
                                className="flex justify-between items-center w-full pr-4"
                                style={{ 
                                    cursor: 'move',
                                    opacity: draggedGroupId === group._id ? 0.3 : 1,
                                    backgroundColor: draggedOverGroupIndex === groupIndex && draggedGroupId !== group._id ? '#f0f0f0' : 'transparent',
                                    minHeight: draggedOverGroupIndex === groupIndex && draggedGroupId !== group._id ? '50px' : 'auto',
                                    border: draggedOverGroupIndex === groupIndex && draggedGroupId !== group._id ? '2px dashed #d9d9d9' : 'none',
                                    borderRadius: draggedOverGroupIndex === groupIndex && draggedGroupId !== group._id ? '4px' : '0',
                                    padding: '8px'
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    <HolderOutlined style={{ color: '#999', cursor: 'grab' }} />
                                    <span>{group.name}</span>
                                </div>
                                <Space>
                                    <EditOutlined
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingGroup(group);
                                            setGroupModalVisible(true);
                                        }}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <DeleteOutlined
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDeleteTarget({ id: group._id, type: "presets" });
                                            setDeleteModalVisible(true);
                                        }}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedGroup(group);
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
                            components={{
                                body: {
                                    row: (props: any) => {
                                        const index = group.formFields.findIndex((f: Field) => f._id === props['data-row-key']);
                                        const record = group.formFields[index];
                                        if (!record) return <tr {...props} />;
                                        
                                        // Show blank placeholder at drop position
                                        const isDropTarget = draggedFieldId?.groupId === group._id && 
                                                           draggedOverFieldIndex === index && 
                                                           draggedFieldId?.fieldId !== record._id;
                                        
                                        if (isDropTarget) {
                                            return (
                                                <tr
                                                    {...props}
                                                    onDragOver={(e) => {
                                                        handleFieldDragOver(index, group._id, e);
                                                    }}
                                                    onDrop={(e) => handleFieldDrop(index, group._id, e)}
                                                    style={{
                                                        height: '50px',
                                                        backgroundColor: '#f0f0f0',
                                                        border: '2px dashed #d9d9d9'
                                                    }}
                                                >
                                                    <td colSpan={6} style={{ textAlign: 'center', color: '#999' }}></td>
                                                </tr>
                                            );
                                        }
                                        
                                        return (
                                            <tr
                                                {...props}
                                                draggable
                                                onDragStart={(e) => handleFieldDragStart(group._id, record._id, e)}
                                                onDragOver={(e) => {
                                                    handleFieldDragOver(index, group._id, e);
                                                }}
                                                onDrop={(e) => handleFieldDrop(index, group._id, e)}
                                                onDragEnd={handleFieldDragEnd}
                                                style={{
                                                    cursor: 'move',
                                                    opacity: draggedFieldId?.fieldId === record._id ? 0.3 : 1,
                                                    backgroundColor: 'transparent'
                                                }}
                                            />
                                        );
                                    }
                                }
                            }}
                            columns={[
                                {
                                    title: "Label",
                                    dataIndex: "label",
                                    key: "label",
                                    render: (text: string) => (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <HolderOutlined style={{ color: '#999' }} />
                                            <span>{text}</span>
                                        </div>
                                    )
                                },
                                ...preferenceFieldColumns.slice(1)
                            ]}
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
