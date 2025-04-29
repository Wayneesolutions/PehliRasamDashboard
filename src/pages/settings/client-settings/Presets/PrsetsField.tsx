import { Modal, Form, Select, Button, message, Switch } from "antd";
import { useEffect, useState } from "react";
import apiClient from "../../../../config/apiClient";
const { Option, OptGroup } = Select;
import {  Group } from "../Fields/types";
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
    const [preferenceGroups, setPreferenceGroups] = useState <PreferenceGroup[]>([]);



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

                if (editingGroup  && selectedGroup) {
                    setEditingGroup(selectedGroup)
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
    }, [visible, editingField]);



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

            const presetId = selectedGroup?._id; // Use selected group ID as presetId
            if (!presetId) {
                message.error("No group selected. Please try again.");
                return;
            }

            const profilePayload = (values.profileField || []).map((fieldId: string) => ({
                fieldsId: fieldId,
                fieldsFor: "profile",
                AllowEdit: values.AllowEdit ?? true,
                isRequired: values.isRequired ?? false,
                presetId,
            }));

            const preferencePayload = (values.preferenceField || []).map((fieldId: string) => ({
                fieldsId: fieldId,
                fieldsFor: "Preferences",
                AllowEdit: values.AllowEdit ?? true,
                isRequired: values.isRequired ?? false,
                presetId,
            }));

            const payload = [...profilePayload, ...preferencePayload];

            if (editingGroup) {
                await apiClient.post("/admin/updatePresetField", {
                  presetId: editingGroup._id,
                  fields: payload,
                });
                message.success("Field updated successfully!");
              } else {
                await apiClient.post("/admin/createPresetField", payload);
                message.success("Field created successfully!");
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
                <Form.Item
                    name="profileField"
                    label="Profile"
                    rules={[{ required: true, message: "Please select at least one profile field" }]}
                >
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

                <Form.Item
                    name="preferenceField"
                    label="Preference"
                    rules={[{ required: true, message: "Please select at least one preference field" }]}
                >
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
