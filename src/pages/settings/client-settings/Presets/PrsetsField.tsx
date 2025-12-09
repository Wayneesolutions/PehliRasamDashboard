import { Modal, Form, Select, Button, message, Switch } from "antd";
import { useEffect, useState } from "react";
import apiClient from "../../../../config/apiClient";
const { Option, OptGroup } = Select;
import { Group } from "../Fields/types";
import { Field as PreferenceField, Group as PreferenceGroup } from "../matching/types";
import { Field as PresetField, Group as PresetGroup } from './types';

// Dynamic basic info fields configuration - matches backend structure
// These fields are automatically included by the backend in getIntroFieldValues
const BASIC_INFO_FIELDS = [
    { key: 'basic-firstName', value: 'basic-firstName', label: 'First Name', fieldKey: 'firstName' },
    { key: 'basic-middleName', value: 'basic-middleName', label: 'Middle Name', fieldKey: 'middelName' },
    { key: 'basic-lastName', value: 'basic-lastName', label: 'Last Name', fieldKey: 'lastName' },
    { key: 'basic-email', value: 'basic-email', label: 'Email', fieldKey: 'email' },
    { key: 'basic-phone', value: 'basic-phone', label: 'Phone Number', fieldKey: 'Number' },
    { key: 'basic-address-street', value: 'basic-address-street', label: 'Address (Street)', fieldKey: 'address.street' },
    { key: 'basic-address-city', value: 'basic-address-city', label: 'City', fieldKey: 'address.city' },
    { key: 'basic-address-state', value: 'basic-address-state', label: 'State', fieldKey: 'address.state' },
    { key: 'basic-address-postalCode', value: 'basic-address-postalCode', label: 'Postal Code', fieldKey: 'address.postalCode' },
    { key: 'basic-address-country', value: 'basic-address-country', label: 'Country', fieldKey: 'address.country' },
];

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

    const fetchGroupsWithFields = async () => {
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
            setFields(formattedGroups);
        } catch (error) {
            message.error("Failed to load groups.");
        }
    };

    const fetchAll = async () => {
        await Promise.all([
            fetchGroupsWithFields(),
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
                // Update payload
                const updatePayload = {
                    presetFieldId: editingField._id,
                    AllowEdit: values.AllowEdit ?? true,
                    isRequired: values.isRequired ?? false,
                };

                const response = await apiClient.post("/admin/updatePresetField", updatePayload);

                if (response.status === 200) {
                    message.success("Field updated successfully!");
                } else {
                    message.error("Failed to update the field.");
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
                // Basic info fields (starting with "basic-") are now supported by the backend
                const createPayload = [
                    ...profileField.map((id: string) => ({
                        fieldsId: id, // Can be ObjectId for FormFields or string like "basic-firstName" for basic info
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
                                {/* Basic Information Fields - Dynamically loaded from configuration */}
                                {BASIC_INFO_FIELDS.length > 0 && (
                                    <OptGroup
                                        key="basic-info"
                                        label={<span style={{ fontWeight: "bold", color: "#999" }}>Basic Information</span>}
                                    >
                                        {BASIC_INFO_FIELDS.map((field) => (
                                            <Option key={field.key} value={field.value}>
                                                {field.label}
                                            </Option>
                                        ))}
                                    </OptGroup>
                                )}
                                
                                {/* Regular FormFields from database */}
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
