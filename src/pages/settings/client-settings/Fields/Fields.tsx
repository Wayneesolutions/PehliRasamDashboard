import React, { useEffect, useState } from "react";
import { Table, Button, Collapse, Space, Typography, Modal, message } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined, HolderOutlined } from "@ant-design/icons";
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
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            // Add cache-busting parameter to ensure fresh data
            const response = await apiClient.get("/admin/getFromGroupList", {
                params: {
                    _t: Date.now() // Cache buster
                }
            });
            const formattedGroups: Group[] = response.data.data.map((group: { _id: string; groupName: string; fields: any[]; }) => {
                // Sort fields by order to ensure correct display order
                const sortedFields = [...(group.fields || [])].sort((a, b) => {
                    const orderA = a.order !== undefined ? a.order : 999;
                    const orderB = b.order !== undefined ? b.order : 999;
                    return orderA - orderB;
                });
                
                return {
                    _id: group._id,
                    name: group.groupName,
                    formFields: sortedFields.map((field) => ({
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
                };
            });
            // Force state update by creating a new array reference
            setGroups([...formattedGroups]);
            // Increment refresh key to force table re-render
            setRefreshKey(prev => prev + 1);
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
            
            // If we found the dragged group, update state
            const currentIndex = groups.findIndex(g => g._id === draggedGroupId);
            if (currentIndex !== -1 && currentIndex !== index) {
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
                        await fetchGroups();
                        return;
                    }

                    // Prepare bulk update payload: array of {id, position}
                    // Use 0-based positions to match backend default order = 0
                    const groupsOrder = currentGroups.map((group, index) => ({
                        id: group._id,
                        position: index // 0-based position
                    }));

                    // Single API call with all group positions - returns updated data
                    const response = await apiClient.post("/admin/updateGroupsOrder", { 
                        groups: groupsOrder
                    });
                    
                    // Reset drag state immediately to clear UI drag indicators
                    setDraggedGroupId(null);
                    setDraggedOverGroupIndex(null);
                    setOriginalGroupIndex(null);
                    
                    // Use the updated data returned from the API
                    if (response.data && response.data.success && response.data.data) {
                        const formattedGroups: Group[] = response.data.data.map((group: { _id: string; groupName: string; fields: any[]; }) => {
                            // Sort fields by order to ensure correct display order
                            const sortedFields = [...(group.fields || [])].sort((a, b) => {
                                const orderA = a.order !== undefined ? a.order : 999;
                                const orderB = b.order !== undefined ? b.order : 999;
                                return orderA - orderB;
                            });
                            
                            return {
                                _id: group._id,
                                name: group.groupName,
                                formFields: sortedFields.map((field) => ({
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
                            };
                        });
                        // Force state update by creating a new array reference
                        setGroups([...formattedGroups]);
                        // Increment refresh key to force table re-render
                        setRefreshKey(prev => prev + 1);
                        message.success("Group order updated!");
                    } else {
                        // Fallback to fetchGroups if response format is unexpected
                        await fetchGroups();
                        message.success("Group order updated!");
                    }
                } catch (error: any) {
                    // Reset drag state on error
                    setDraggedGroupId(null);
                    setDraggedOverGroupIndex(null);
                    setOriginalGroupIndex(null);
                    message.error("Failed to update group order.");
                    // Revert UI on error
                    await fetchGroups();
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
            fetchGroups();
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
                        fetchGroups();
                        return;
                    }

                    // Prepare bulk update payload: array of {id, position}
                    // Use 0-based positions to match backend default order = 0
                    const fieldsOrder = currentGroup.formFields.map((field, index) => ({
                        id: field._id,
                        position: index // 0-based position
                    }));

                    // Single API call with all field positions - returns updated data
                    const response = await apiClient.post("/admin/updateFieldsOrder", { 
                        fields: fieldsOrder
                    });
                    
                    // Reset drag state immediately to clear UI drag indicators
                    setDraggedFieldId(null);
                    setDraggedOverFieldIndex(null);
                    setOriginalFieldIndex(null);
                    
                    // Use the updated data returned from the API
                    if (response.data && response.data.success && response.data.data) {
                        const formattedGroups: Group[] = response.data.data.map((group: { _id: string; groupName: string; fields: any[]; }) => {
                            // Sort fields by order to ensure correct display order
                            const sortedFields = [...(group.fields || [])].sort((a, b) => {
                                const orderA = a.order !== undefined ? a.order : 999;
                                const orderB = b.order !== undefined ? b.order : 999;
                                return orderA - orderB;
                            });
                            
                            return {
                                _id: group._id,
                                name: group.groupName,
                                formFields: sortedFields.map((field) => ({
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
                            };
                        });
                        // Force state update by creating a new array reference
                        setGroups([...formattedGroups]);
                        // Increment refresh key to force table re-render
                        setRefreshKey(prev => prev + 1);
                        message.success("Field order updated!");
                    } else {
                        // Fallback to fetchGroups if response format is unexpected
                        await fetchGroups();
                        message.success("Field order updated!");
                    }
                } catch (error: any) {
                    // Reset drag state on error
                    setDraggedFieldId(null);
                    setDraggedOverFieldIndex(null);
                    setOriginalFieldIndex(null);
                    message.error("Failed to update field order.");
                    // Revert UI on error
                    await fetchGroups();
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
            // Reset state first, then refresh
            setDraggedFieldId(null);
            setDraggedOverFieldIndex(null);
            setOriginalFieldIndex(null);
            fetchGroups();
        } else {
            // Reset drag state
            setDraggedFieldId(null);
            setDraggedOverFieldIndex(null);
            setOriginalFieldIndex(null);
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
                {groups.map((group, groupIndex) => (
                    <Panel
                        header={
                            <div 
                                draggable
                                onDragStart={(e) => handleGroupDragStart(group._id, e)}
                                onDragOver={(e) => handleGroupDragOver(groupIndex, e)}
                                onDrop={(e) => handleGroupDrop(groupIndex, e)}
                                onDragEnd={handleGroupDragEnd}
                                style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 8,
                                    cursor: 'move',
                                    opacity: draggedGroupId === group._id ? 0.3 : 1,
                                    backgroundColor: draggedOverGroupIndex === groupIndex && draggedGroupId !== group._id ? '#f0f0f0' : 'transparent',
                                    minHeight: draggedOverGroupIndex === groupIndex && draggedGroupId !== group._id ? '50px' : 'auto',
                                    border: draggedOverGroupIndex === groupIndex && draggedGroupId !== group._id ? '2px dashed #d9d9d9' : 'none',
                                    borderRadius: draggedOverGroupIndex === groupIndex && draggedGroupId !== group._id ? '4px' : '0'
                                }}
                            >
                                <HolderOutlined style={{ color: '#999', cursor: 'grab' }} />
                                <span style={{ flex: 1 }}>{group.name}</span>
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
                                            showDeleteConfirm(group._id, "group");
                                        }} 
                                        style={{ cursor: 'pointer' }}
                                    />
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
                                    title: "Name", 
                                    dataIndex: "attributeName", 
                                    key: "attributeName",
                                    render: (text: string, _record: Field) => (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <HolderOutlined style={{ color: '#999' }} />
                                            <span>{text}</span>
                                        </div>
                                    )
                                },
                                { title: "Type", dataIndex: "attributeType", key: "attributeType" },
                                { title: "Options", dataIndex: "attributeOption", key: "attributeOption", render: (options) => options.join(", ") },
                                { title: "Visibility", dataIndex: "visibility", key: "visibility", render: (visible) => (visible ? "Yes" : "No") },
                                { title: "Active", dataIndex: "active", key: "active", render: (active) => (active ? "Yes" : "No") },
                                {
                                    title: "Actions",
                                    render: (_, record) => (
                                        <Space>
                                            <EditOutlined 
                                                onClick={() => {
                                                    setEditingField(record);
                                                    setFieldModalVisible(true);
                                                }}
                                                style={{ cursor: 'pointer' }}
                                            />
                                            <DeleteOutlined 
                                                onClick={() => showDeleteConfirm(record._id, "field")}
                                                style={{ cursor: 'pointer' }}
                                            />
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
