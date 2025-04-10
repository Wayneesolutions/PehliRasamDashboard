import React, { useEffect, useState } from "react";
import { Modal, Form, Input, message } from "antd";
import apiClient from "../../../../config/apiClient";

interface MatchGroupModalProps {
    visible: boolean;
    onClose: () => void;
    editingMatchGroup?: any;
    fetchMatchGroups: () => void;
}

const MatchGroupModal: React.FC<MatchGroupModalProps> = ({
    visible,
    onClose,
    editingMatchGroup,
    fetchMatchGroups,
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (editingMatchGroup) {
            form.setFieldsValue({
                groupName: editingMatchGroup.groupName,
            });
        } else {
            form.resetFields();
        }
    }, [editingMatchGroup, form]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            if (editingMatchGroup) {
                await apiClient.post("/admin/updateMatchGroupName", {
                    id: editingMatchGroup._id,
                    groupName: values.groupName,
                });
                message.success("Match group updated successfully.");
            } else {
                await apiClient.post("/admin/createMatchGroup", {
                    groupName: values.groupName,
                });
                message.success("Match group created successfully.");
            }

            form.resetFields();
            onClose();
            fetchMatchGroups();
        } catch (err: any) {
            if (err?.response?.data?.message) {
                message.error(err.response.data.message);
            } else if (err?.errorFields) {
                return;
            } else {
                message.error("Something went wrong.");
            }
        } finally {
            setLoading(false);
        }
    };


    return (
        <Modal
            title={editingMatchGroup ? "Edit Match Group" : "Create Match Group"}
            visible={visible}
            onCancel={() => {
                onClose();
                form.resetFields();
            }}
            onOk={handleSubmit}
            confirmLoading={loading}
            okText={editingMatchGroup ? "Update" : "Create"}
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    name="groupName"
                    label="Match Group Name"
                    rules={[{ required: true, message: "Please enter group name" }]}
                >
                    <Input placeholder="Enter group name" />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default MatchGroupModal;
