import { Modal, Form, Input, Select, Button, message, Switch } from "antd";
import { useEffect, useState } from "react";
import apiClient from "../../../../config/apiClient";

const { Option } = Select;

interface Field {
    _id: string;
    label: string;
    profileField: string;
    helpText?: string;
    clientTypes?: string;
    weight?: "Low" | "Medium" | "High";
    useInMatch?: boolean;
    dealBreak?: boolean;
    preferencesGroupId: string;
    choices?: string[]; // Added this
}

interface Group {
    _id: string;
    name: string;
}

interface FieldModalProps {
    visible: boolean;
    onClose: () => void;
    editingField: Field | null;
    selectedGroup: Group | null;
    fetchGroups: () => Promise<void>;
}

const MatchingModal: React.FC<FieldModalProps> = ({ visible, onClose, editingField, fetchGroups }) => {
    const [form] = Form.useForm();
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [selectedProfileField, setSelectedProfileField] = useState<string | undefined>();

    useEffect(() => {
        const fetchAndSetData = async () => {
            if (visible) {
                await fetchGroupList();

                if (editingField) {
                    setSelectedProfileField(editingField.profileField);
                    form.setFieldsValue({
                        preferencesGroupId: editingField.preferencesGroupId,
                        label: editingField.label,
                        profileField: editingField.profileField,
                        helpText: editingField.helpText || "",
                        clientTypes: editingField.clientTypes || "General",
                        weight: editingField.weight || "Medium",
                        useInMatch: editingField.useInMatch ?? false,
                        dealBreak: editingField.dealBreak ?? false,
                        choices: editingField.choices || [],
                    });
                } else {
                    form.resetFields();
                    setSelectedProfileField(undefined);
                    form.setFieldValue("choices", []);
                }
            }
        };

        fetchAndSetData();
    }, [visible]);


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
            const payload: any = {
                label: values.label,
                profileField: values.profileField,
                helpText: values.helpText || "",
                clientTypes: values.clientTypes || "General",
                weight: values.weight || "Medium",
                useInMatch: values.useInMatch ?? false,
                dealBreak: values.dealBreak ?? false,
                preferencesGroupId: values.preferencesGroupId,
            };

            if (values.profileField === "select") {
                payload.choices = values.choices || [];
            }

            if (editingField) {
                await apiClient.post("/admin/updatePreferencesField", {
                    fieldId: editingField._id,
                    ...payload,
                });
                message.success("Field updated successfully!");
            } else {
                await apiClient.post("/admin/createPreferencesField", payload);
                message.success("Field created successfully!");
            }

            await fetchGroups();
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
                    name="preferencesGroupId"
                    label="Group"
                    rules={[{ required: true, message: "Please select a group" }]}
                >
                    <Select
                        placeholder="Select a group"
                        loading={groups.length === 0}
                        optionFilterProp="children"
                        showSearch
                    >
                        {groups.map((group) => (
                            <Option key={group._id} value={String(group._id)}>
                                {group.name}
                            </Option>
                        ))}

                    </Select>
                </Form.Item>


                <Form.Item
                    name="label"
                    label="Label"
                    rules={[{ required: true, message: "Please enter label" }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    name="profileField"
                    label="Profile Field"
                    rules={[{ required: true, message: "Please select profile field type" }]}
                >
                    <Select
                        placeholder="Select profile field type"
                        onChange={(value) => {
                            setSelectedProfileField(value);
                            if (value === "select") {
                                form.setFieldValue("choices", []);
                            } else {
                                form.setFieldValue("choices", undefined);
                            }
                        }}
                    >
                        <Option value="long text">Long Text</Option>
                        <Option value="select">Select</Option>
                        <Option value="number">Number</Option>
                        <Option value="date">Date</Option>
                        <Option value="height">Height</Option>
                    </Select>
                </Form.Item>

                {(selectedProfileField === "select" || selectedProfileField === "multiselect") && (
                    <Form.Item
                        name="choices"
                        label="Choices"
                        rules={[{ required: true, message: "Please enter at least one choice" }]}
                    >
                        <Select
                            mode="tags"
                            style={{ width: "100%" }}
                            placeholder="Enter choices and press Enter"
                        />
                    </Form.Item>
                )}

                <Form.Item name="helpText" label="Help Text">
                    <Input.TextArea rows={2} placeholder="Add help text for this field (optional)" />
                </Form.Item>

                <Form.Item name="clientTypes" label="Client Type">
                    <Select placeholder="Select client type" defaultValue="General">
                        <Option value="General">General</Option>
                        <Option value="Premium">Premium</Option>
                    </Select>
                </Form.Item>

                <Form.Item name="weight" label="Weight">
                    <Select placeholder="Select weight" defaultValue="Medium">
                        <Option value="Low">Low</Option>
                        <Option value="Medium">Medium</Option>
                        <Option value="High">High</Option>
                    </Select>
                </Form.Item>

                <Form.Item name="useInMatch" label="Use in Match" valuePropName="checked">
                    <Switch checkedChildren="Yes" unCheckedChildren="No" />
                </Form.Item>

                <Form.Item name="dealBreak" label="Deal Breaker" valuePropName="checked">
                    <Switch checkedChildren="Yes" unCheckedChildren="No" />
                </Form.Item>

                <Button type="primary" htmlType="submit" loading={loading} style={{ marginTop: "10px" }}>
                    {editingField ? "Update" : "Create"}
                </Button>
            </Form>
        </Modal>
    );
};

export default MatchingModal;
