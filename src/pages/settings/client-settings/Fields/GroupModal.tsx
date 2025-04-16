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

const GroupModal: React.FC<GroupModalProps> = ({ visible, onClose, editingGroup, fetchGroups }) => {
    const [form] = Form.useForm();

    useEffect(() => {
        if (visible) {
            if (editingGroup) {
                form.setFieldsValue({ name: editingGroup.name });
            } else {
                form.resetFields(); // Reset fields when creating a new group
            }
        }
    }, [visible, editingGroup, form]);

    const handleFinish = async (values: { name: string }) => {
        try {
            if (editingGroup) {
                await apiClient.post(`/admin/updateFromGroup`, { groupId: editingGroup._id, ...values });
                message.success("Group updated successfully!");
            } else {
                await apiClient.post("/admin/createFromGroup", values);
                message.success("Group created successfully!");
            }
            fetchGroups();
            onClose();
            form.resetFields();
        } catch (error) {
            message.error("Failed to process request.");
        }
    };

    return (
        <Modal title={editingGroup ? "Edit Group" : "Create Group"} open={visible} onCancel={onClose} footer={null}>
            <Form form={form} onFinish={handleFinish} layout="vertical">
                <Form.Item name="name" label="Group Name" rules={[{ required: true, message: "Please enter a group name" }]}>
                    <Input />
                </Form.Item>
                <Button type="primary" htmlType="submit">
                    {editingGroup ? "Update" : "Create"}
                </Button>
            </Form>
        </Modal>
    );
};

export default GroupModal;
