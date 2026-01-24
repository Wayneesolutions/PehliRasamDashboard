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
    const [refreshKey, setRefreshKey] = useState(0);

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
            // Force state update by creating a new array reference
            setGroups([...formatted]);
            // Increment refresh key to force table re-render
            setRefreshKey(prev => prev + 1);
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
        
        if (draggedGroupId && index !== draggedOverGroupIndex) {
            // Update UI immediately - find current position of dragged item
            const currentIndex = groups.findIndex(g => g._id === draggedGroupId);
            
            if (currentIndex !== -1 && currentIndex !== index) {
                // Create new array with reordered groups
                const reorderedGroups = [...groups];
                const draggedItem = reorderedGroups[currentIndex];
                reorderedGroups.splice(currentIndex, 1);
                reorderedGroups.splice(index, 0, draggedItem);
                setGroups(reorderedGroups);
                setDraggedOverGroupIndex(index);
            }
        }
    };

    const handleGroupDrop = async (targetIndex: number, e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (draggedGroupId !== null && originalGroupIndex !== null && targetIndex !== null) {
            // Only call API if position actually changed
            if (originalGroupIndex !== targetIndex) {
                try {
                    // Get the current groups with updated order from state
                    const currentGroups = groups;
                    if (!currentGroups || currentGroups.length === 0) {
                        // Reset drag state first
                        setDraggedGroupId(null);
                        setDraggedOverGroupIndex(null);
                        setOriginalGroupIndex(null);
                        await fetchAll();
                        return;
                    }

                    // Prepare bulk update payload: array of {id, position}
                    // Use 0-based positions to match backend default order = 0
                    const presetsOrder = currentGroups.map((group, index) => ({
                        id: group._id,
                        position: index // 0-based position
                    }));

                    // Single API call with all preset positions - returns updated data
                    const response = await apiClient.post("/admin/updatePresetsOrder", { 
                        presets: presetsOrder
                    });
                    
                    // Reset drag state immediately to clear UI drag indicators
                    setDraggedGroupId(null);
                    setDraggedOverGroupIndex(null);
                    setOriginalGroupIndex(null);
                    
                    // Use the updated data returned from the API
                    if (response.data && response.data.success && response.data.data) {
                        const formatted = response.data.data.map((group: any) => ({
                            _id: group._id,
                            name: group.name,
                            formFields: (group.fields || []).map((field: any) => ({
                                _id: field.presetFieldId || field.id,
                                presetFieldId: field.presetFieldId,
                                fieldsId: field.id,
                                label: field.Label || "",
                                kind: field.Kind || "",
                                fieldType: field.Field || "",
                                required: field.Required,
                                allowEdit: field.AllowEdit,
                            })),
                        }));
                        // Force state update by creating a new array reference
                        setGroups([...formatted]);
                        // Increment refresh key to force table re-render
                        setRefreshKey(prev => prev + 1);
                        message.success("Preset order updated!");
                    } else {
                        // Fallback to fetchAll if response format is unexpected
                        await fetchAll();
                        message.success("Preset order updated!");
                    }
                } catch (error: any) {
                    // Reset drag state on error
                    setDraggedGroupId(null);
                    setDraggedOverGroupIndex(null);
                    setOriginalGroupIndex(null);
                    message.error("Failed to update preset order.");
                    // Revert UI on error
                    await fetchAll();
                }
            } else {
                // No change, just reset drag state
                setDraggedGroupId(null);
                setDraggedOverGroupIndex(null);
                setOriginalGroupIndex(null);
            }
        } else {
            // Reset drag state if conditions not met
            setDraggedGroupId(null);
            setDraggedOverGroupIndex(null);
            setOriginalGroupIndex(null);
        }
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
        
        if (draggedFieldId && draggedFieldId.groupId === groupId && index !== draggedOverFieldIndex) {
            // Update UI immediately - find current position of dragged item
            const newGroups = groups.map(g => {
                if (g._id === groupId) {
                    const newFields = [...g.formFields];
                    // Find current index of dragged field (may have changed from original)
                    const currentIndex = newFields.findIndex(f => f._id === draggedFieldId.fieldId);
                    
                    if (currentIndex !== -1 && currentIndex !== index) {
                        // Remove from current position and insert at new position
                        const draggedItem = newFields[currentIndex];
                        newFields.splice(currentIndex, 1);
                        newFields.splice(index, 0, draggedItem);
                        return { ...g, formFields: newFields };
                    }
                }
                return g;
            });
            
            setGroups(newGroups);
            setDraggedOverFieldIndex(index);
        }
    };

    const handleFieldDrop = async (targetIndex: number, groupId: string, e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (draggedFieldId && targetIndex !== null && draggedFieldId.groupId === groupId && originalFieldIndex !== null) {
            // Only call API if position actually changed
            if (originalFieldIndex !== targetIndex) {
                try {
                    // Get the current group with updated order from state
                    const currentGroup = groups.find(g => g._id === groupId);
                    if (!currentGroup) {
                        // Reset drag state first
                        setDraggedFieldId(null);
                        setDraggedOverFieldIndex(null);
                        setOriginalFieldIndex(null);
                        await fetchAll();
                        return;
                    }

                    // Prepare bulk update payload: array of {id, position}
                    // Use 0-based positions to match backend default order = 0
                    const fieldsOrder = currentGroup.formFields.map((field, index) => ({
                        id: field._id, // This is the presetFieldId
                        position: index // 0-based position
                    }));

                    // Single API call with all field positions - returns updated data
                    const response = await apiClient.post("/admin/updatePresetFieldsOrder", { 
                        fields: fieldsOrder
                    });
                    
                    // Reset drag state immediately to clear UI drag indicators
                    setDraggedFieldId(null);
                    setDraggedOverFieldIndex(null);
                    setOriginalFieldIndex(null);
                    
                    // Use the updated data returned from the API
                    if (response.data && response.data.success && response.data.data) {
                        const formatted = response.data.data.map((group: any) => ({
                            _id: group._id,
                            name: group.name,
                            formFields: (group.fields || []).map((field: any) => ({
                                _id: field.presetFieldId || field.id,
                                presetFieldId: field.presetFieldId,
                                fieldsId: field.id,
                                label: field.Label || "",
                                kind: field.Kind || "",
                                fieldType: field.Field || "",
                                required: field.Required,
                                allowEdit: field.AllowEdit,
                            })),
                        }));
                        // Force state update by creating a new array reference
                        setGroups([...formatted]);
                        // Increment refresh key to force table re-render
                        setRefreshKey(prev => prev + 1);
                        message.success("Preset field order updated!");
                    } else {
                        // Fallback to fetchAll if response format is unexpected
                        await fetchAll();
                        message.success("Preset field order updated!");
                    }
                } catch (error: any) {
                    // Reset drag state on error
                    setDraggedFieldId(null);
                    setDraggedOverFieldIndex(null);
                    setOriginalFieldIndex(null);
                    message.error("Failed to update preset field order.");
                    // Revert UI on error
                    await fetchAll();
                }
            } else {
                // No change, just reset drag state
                setDraggedFieldId(null);
                setDraggedOverFieldIndex(null);
                setOriginalFieldIndex(null);
            }
        } else {
            // Reset drag state if conditions not met
            setDraggedFieldId(null);
            setDraggedOverFieldIndex(null);
            setOriginalFieldIndex(null);
        }
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
                            key={`table-${group._id}-${refreshKey}`}
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
