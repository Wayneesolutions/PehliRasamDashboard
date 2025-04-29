import { Modal, Form, Input, Button, message } from "antd";
import { useEffect } from "react";
import apiClient from "../../../../config/apiClient";

interface Group {
    _id: string;
    name: string;
}

interface GroupModalProps {
    visible: boolean;
    onClose: () => void;
    editingGroup: Group | null;
    fetchGroups: () => void;
}

const Presetsgroup: React.FC<GroupModalProps> = ({ visible, onClose, editingGroup, fetchGroups }) => {
    const [form] = Form.useForm();

    useEffect(() => {
        if (visible) {
            if (editingGroup) {
                form.setFieldsValue({ name: editingGroup.name });
            } else {
                form.resetFields();
            }
        }
    }, [visible, editingGroup, form]);

    const handleFinish = async (values: { name: string }) => {
        try {
            if (editingGroup) {
                await apiClient.post(`/admin/updatePreset`, { id: editingGroup._id, ...values });
                message.success("Preset updated successfully!");
            } else {
                await apiClient.post("/admin/createPreset", values);
                message.success("Preset created successfully!");
            }
            fetchGroups();
            onClose();
            form.resetFields();
        } catch (error) {
            message.error("Failed to process request.");
        }
    };

    return (
        <Modal title={editingGroup ? "Edit Preset" : "Create Preset"} open={visible} onCancel={onClose} footer={null}>
            <Form form={form} onFinish={handleFinish} layout="vertical">
                <Form.Item name="name" label="Preset Name" rules={[{ required: true, message: "Please enter a group name" }]}>
                    <Input />
                </Form.Item>
                <Button type="primary" htmlType="submit">
                    {editingGroup ? "Update" : "Create"}
                </Button>
            </Form>
        </Modal>
    );
};

export default Presetsgroup;
