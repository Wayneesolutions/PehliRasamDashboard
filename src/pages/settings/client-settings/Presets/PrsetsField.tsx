import { Modal, Form, Select, Button, message, Switch } from "antd";
import { useEffect, useState } from "react";
import apiClient from "../../../../config/apiClient";
const { Option, OptGroup } = Select;
import { Group } from "../Fields/types";
import { Field as PreferenceField, Group as PreferenceGroup } from "../matching/types";
import { Field as PresetField, Group as PresetGroup } from './types';


interface FieldModalProps {
    visible: boolean;
    onClose: () => void;
    editingField: PresetField | null;
    selectedGroup: PresetGroup | null;
    fetchPresetsGroups: () => Promise<void>;
}

const PrsetsField: React.FC<FieldModalProps> = ({ visible,
    onClose,
    editingField,
    selectedGroup,
    fetchPresetsGroups }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState<boolean>(false);
    const [editingGroup, setEditingGroup] = useState<PresetGroup | null>(null);

    const [, setGroups] = useState<Group[]>([]);
    const [fields, setFields] = useState<Group[]>([]);
    const [, setSelectedField] = useState<{ fieldsId: string; fieldsFor: string } | null>(null);
    const [preferenceGroups, setPreferenceGroups] = useState<PreferenceGroup[]>([]);

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchProfileFieldGroups = async () => {
        try {
            const response = await apiClient.get("/admin/getFromGroupList");
            const formatted = (response.data.data || []).map((group: any) => ({
                _id: group._id,
                name: group.groupName,
                formFields: (group.fields || []).map((field: any) => ({
                    _id: field.attributeId,
                    attributeName: field.attributeName,
                    attributeType: field.attributeType,
                    attributeOption: field.attributeOption || [],
                })),
            }));
            setFields(formatted);
        } catch (error) {
            console.error("Error fetching profile field groups:", error);
            message.error("Failed to load profile field groups.");
        }
    };

    const fetchAll = async () => {
        await Promise.all([
            fetchProfileFieldGroups(),
            fetchPreferenceGroupsWithFields(),
        ]);
    };




    const fetchPreferenceGroupsWithFields = async () => {
        try {
            const response = await apiClient.get("/admin/getAllPreferencesGroupFields");
            const formatted = response.data.data.map((group: any) => ({
                _id: group._id,
                name: group.groupName,
                formFields: (group.fields || []).map((field: any) => ({
                    _id: field.fieldId,
                    label: field.fieldName,
                    profileField: field.profileField,
                    clientTypes: field.clientTypes,
                    weight: field.weight,
                    useInMatch: field.useInMatch,
                    choices: field.choices,
                    helpText: field.helpText,
                    dealBreak: field.dealBreak,
                    isActive: field.isActive,
                })),
            }));
            setPreferenceGroups(formatted);
        } catch (error) {
            message.error("Failed to load preference group fields.");
        }
    };

    useEffect(() => {
        const fetchAndSetData = async () => {
            if (visible) {
                await fetchGroupList();
                // Refresh profile and preference fields when modal opens
                await fetchProfileFieldGroups();
                await fetchPreferenceGroupsWithFields();

                if (editingField && selectedGroup) {
                    setEditingGroup(selectedGroup);

                    // Check if editingGroup is not null
                    if (editingGroup) {
                        const profileFieldIds = editingGroup.formFields
                            .filter((f: PresetField) => f.fieldsFor === "profile")
                            .map((f: PresetField) => f._id);

                        const preferenceFieldIds = editingGroup.formFields
                            ?.filter((f: PresetField) => f.fieldsFor === "preferences")
                            .map((f: PresetField) => f._id) || [];

                        form.setFieldsValue({
                            profileField: profileFieldIds,
                            preferenceField: preferenceFieldIds,
                            AllowEdit: editingGroup.formFields?.[0]?.AllowEdit ?? true,
                            isRequired: editingGroup.formFields?.[0]?.isRequired ?? false,
                        });
                    }
                } else {
                    form.resetFields();
                    form.setFieldsValue({
                        profileField: [],
                        preferenceField: [],
                        AllowEdit: true,
                        isRequired: false,
                    });
                    setEditingGroup(null);
                }
            }
        };

        fetchAndSetData();
    }, [visible, editingField, selectedGroup]); // Add selectedGroup as a dependency to update the group on change





    const fetchGroupList = async () => {
        try {
            const response = await apiClient.get("/admin/allPreferencesGroupList");
            setGroups(response.data.data || []);
        } catch (error) {
            console.error("Error fetching group list:", error);
            message.error("Failed to fetch group list.");
        }
    };

    const handleFinish = async (values: any) => {
        try {
            setLoading(true);

            if (editingField && editingField._id) {
                // Use presetFieldId if available, otherwise use _id
                const presetFieldId = (editingField as any).presetFieldId || editingField._id;
                
                // Update payload
                const updatePayload = {
                    presetFieldId: presetFieldId,
                    AllowEdit: values.AllowEdit ?? true,
                    isRequired: values.isRequired ?? false,
                };

                const response = await apiClient.post("/admin/updatePresetField", updatePayload);

                if (response.data?.success) {
                    message.success("Field updated successfully!");
                } else {
                    message.error(response.data?.message || "Failed to update the field.");
                }
            } else {
                // Create payload
                const { profileField = [], preferenceField = [], AllowEdit, isRequired } = values;

                // Validate selectedGroup
                if (!selectedGroup || !selectedGroup._id) {
                    message.error("No group selected. Please select a group.");
                    return;
                }

                // Combine selected fields from both types
                const createPayload = [
                    ...profileField.map((id: string) => ({
                        fieldsId: id,
                        fieldsFor: "profile",
                        AllowEdit: AllowEdit ?? true,
                        isRequired: isRequired ?? false,
                        presetId: selectedGroup._id,
                    })),
                    ...preferenceField.map((id: string) => ({
                        fieldsId: id,
                        fieldsFor: "Preferences",
                        AllowEdit: AllowEdit ?? true,
                        isRequired: isRequired ?? false,
                        presetId: selectedGroup._id,
                    })),
                ];

                if (createPayload.length === 0) {
                    message.error("Please select at least one field to create.");
                    return;
                }

                const response = await apiClient.post("/admin/createPresetField", createPayload);

                if (response.data?.success) {
                    message.success("Field(s) created successfully!");
                } else {
                    message.error("Failed to create the field(s).");
                }

            }

            await fetchPresetsGroups();
            onClose();
        } catch (error) {
            console.error("Error in handleFinish:", error);
            message.error("Failed to create or update the field.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={editingField ? "Edit Field" : "Create Field"}
            open={visible}
            onCancel={onClose}
            footer={null}
        >
            <Form form={form} onFinish={handleFinish} layout="vertical">
                {!editingField && (
                    <>
                        <Form.Item name="profileField" label="Profile">
                            <Select
                                mode="multiple"
                                placeholder="Select profile field(s)"
                                optionFilterProp="children"
                                showSearch
                                onChange={(values) => {
                                    setSelectedField({
                                        fieldsId: values,
                                        fieldsFor: "profile",
                                    });
                                }}
                            >
                                {fields.map((group) => (
                                    <OptGroup
                                        key={group._id}
                                        label={<span style={{ fontWeight: "bold", color: "#999" }}>{group.name}</span>}
                                    >
                                        {group.formFields.map((field) => (
                                            <Option key={field._id} value={field._id}>
                                                {field.attributeName}
                                            </Option>
                                        ))}
                                    </OptGroup>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item name="preferenceField" label="Preference">
                            <Select
                                mode="multiple"
                                placeholder="Select preference field(s)"
                                optionFilterProp="children"
                                showSearch
                                onChange={(values) => {
                                    setSelectedField({
                                        fieldsId: values,
                                        fieldsFor: "preference",
                                    });
                                }}
                            >
                                {preferenceGroups.map((group: PreferenceGroup) => (
                                    <OptGroup
                                        key={group._id}
                                        label={<span style={{ fontWeight: "bold", color: "#999" }}>{group.name}</span>}
                                    >
                                        {group.formFields.map((field: PreferenceField) => (
                                            <Option key={field._id} value={field._id}>
                                                {field.label}
                                            </Option>
                                        ))}
                                    </OptGroup>
                                ))}
                            </Select>
                        </Form.Item>
                    </>
                )}


                <Form.Item label="Allow Edit" name="AllowEdit" valuePropName="checked">
                    <Switch />
                </Form.Item>

                <Form.Item label="Is Required" name="isRequired" valuePropName="checked">
                    <Switch />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        {editingField ? "Update Field" : "Create Field"}
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default PrsetsField;
