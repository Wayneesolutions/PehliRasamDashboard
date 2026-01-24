import { Modal, Form, Input, Select, Button, message, Switch } from "antd";
import { useEffect, useState } from "react";
import apiClient from "../../../../config/apiClient";

const { Option } = Select;

interface Field {
    _id: string;
    attributeName: string;
    attributeType: string;
    attributePlaceHolder?: string;
    attributeStatus: boolean;
    attributeOption?: string[];
    attributeEnum?: string[];
    form_group_id: string;
    isActive?: boolean;
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


const FieldModal: React.FC<FieldModalProps> = ({ visible, onClose, editingField }) => {
    const [form] = Form.useForm();
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [selectedType, setSelectedType] = useState<string | undefined>("");

    useEffect(() => {
        if (visible) {
            fetchGroups();
            if (editingField) {
                setSelectedType(editingField.attributeType);
                form.setFieldsValue({
                    attributeName: editingField.attributeName,
                    attributeType: editingField.attributeType,
                    attributePlaceHolder: editingField.attributePlaceHolder || "",
                    attributeStatus: editingField.attributeStatus ?? false,
                    isActive: editingField.isActive ?? false,
                    attributeOption: editingField.attributeOption || [],
                    form_group_id: editingField.form_group_id,
                });
            } else {
                form.resetFields();
                setSelectedType("");
            }
        }
    }, [visible, editingField, form]);

    const fetchGroups = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get("/admin/allFromGroupList");
            // API returns { success: true, message: "...", data: [...] }
            if (response.data && response.data.success && response.data.data) {
                // Filter only active, non-deleted groups and sort by order
                const filteredGroups = response.data.data
                    .filter((group: any) => group.isActive && !group.isDeleted)
                    .sort((a: any, b: any) => {
                        const orderA = a.order !== undefined ? a.order : 999;
                        const orderB = b.order !== undefined ? b.order : 999;
                        return orderA - orderB;
                    })
                    .map((group: any) => ({
                        _id: group._id,
                        name: group.name
                    }));
                setGroups(filteredGroups);
            } else {
                setGroups([]);
            }
        } catch (error) {
            console.error("Error fetching groups:", error);
            message.error("Failed to fetch groups.");
            setGroups([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFinish = async (values: any) => {
        try {
            setLoading(true);


            const attributeOptionsArray = Array.isArray(values.attributeOption)
                ? values.attributeOption.map((item: string) => item.trim())
                : (typeof values.attributeOption === "string" ? values.attributeOption.split(",").map((item: string) => item.trim()) : []);

            const payload = {
                attributeName: values.attributeName,
                attributeType: values.attributeType,
                attributePlaceHolder: values.attributePlaceHolder,
                attributeOption: attributeOptionsArray,
                attributeEnum: attributeOptionsArray,
                attributeStatus: values.attributeStatus,
                isActive: values.isActive,
                form_group_id: values.form_group_id,
            };

            if (editingField) {
                await apiClient.post("/admin/updateFormField", { fieldId: editingField._id, ...payload });
                message.success("Field updated successfully!");
            } else {
                await apiClient.post("/admin/createFromField", payload);
                message.success("Field created successfully!");
            }
            onClose();
        } catch (error: unknown) {
            console.error("Error in handleFinish:", error);
            message.error("Failed to create or update the field.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal title={editingField ? "Edit Field" : "Create Field"} open={visible} onCancel={onClose} footer={null}>
            <Form form={form} onFinish={handleFinish} layout="vertical">
                <Form.Item name="form_group_id" label="Group" rules={[{ required: true, message: "Please select a group" }]}>
                    <Select 
                        placeholder="Select a group" 
                        disabled={!!editingField} 
                        loading={loading}
                        notFoundContent={loading ? "Loading groups..." : "No groups available"}
                    >
                        {groups.map((group) => (
                            <Option key={group._id} value={group._id}>{group.name}</Option>
                        ))}
                    </Select>
                </Form.Item>
                <Form.Item name="attributeName" label="Field Name" rules={[{ required: true, message: "Please enter a field name" }]}>
                    <Input />
                </Form.Item>
                <Form.Item name="attributeType" label="Field Type" rules={[{ required: true, message: "Please select a field type" }]}>
                    <Select onChange={(value) => setSelectedType(value)}>
                        <Option value="text">Text</Option>
                        <Option value="number">Number</Option>
                        <Option value="date">Date</Option>
                        <Option value="select">Select</Option>
                        <Option value="radio">Radio</Option>
                        <Option value="checkbox">Checkbox</Option>
                        <Option value="Image">Image</Option>
                    </Select>
                </Form.Item>

                {/* Use correct placeholder field */}
                {selectedType !== "heading" && (
                    <Form.Item name="attributePlaceHolder" label="Placeholder">
                        <Input placeholder="Enter placeholder text" />
                    </Form.Item>
                )}

                <Form.Item name="attributeStatus" label="Status" valuePropName="checked">
                    <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                </Form.Item>

                <Form.Item name="isActive" label="Visibility" valuePropName="checked">
                    <Switch checkedChildren="Visible" unCheckedChildren="Hidden" />
                </Form.Item>

                {/* Show options only for 'select', 'radio', or 'checkbox' */}
                {(selectedType === "select" || selectedType === "radio" || selectedType === "checkbox") && (
                    <Form.Item name="attributeOption" label="Options">
                        <Select
                            mode="tags"
                            placeholder="Enter options and press Enter"
                            tokenSeparators={[","]}
                        />
                    </Form.Item>
                )}

                <Button type="primary" htmlType="submit" loading={loading} style={{ marginTop: "10px" }}>
                    {editingField ? "Update" : "Create"}
                </Button>
            </Form>
        </Modal>
    );
};

export default FieldModal;
