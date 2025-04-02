import { Table, Button, Dropdown, Modal, Menu, Form, Input, message } from "antd";
import { PlusOutlined, MoreOutlined, MenuOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { createClientList, editClientList, getAllClientLists } from "../../../config/apiClient";

// Define types for List Item and API Response
interface ClientList {
    _id: string;
    listName: string;
    color: string;
    status?: string;
}

interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
}

const List = () => {
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [colorList, setColorList] = useState<ClientList[]>([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [editingItem, setEditingItem] = useState<ClientList | null>(null);
    const [val, setVal] = useState<boolean>(false);
    const [form] = Form.useForm();

    useEffect(() => {
        const getAllClientColor = async () => {
            try {
                const res: ApiResponse<ClientList[]> = await getAllClientLists();
                if (res.success && res.data) {
                    setColorList(res.data);
                }
            } catch (error) {
                console.error("Error fetching client lists:", error);
                message.error("Failed to fetch client lists.");
            }
        };
        getAllClientColor();
    }, [val]);

    const columns = [
        {
            title: "List name",
            dataIndex: "listName",
            key: "listName",
            render: (text: string) => (
                <div className="flex items-center">
                    <MenuOutlined className="mr-2 text-gray-400 cursor-pointer" />
                    {text}
                </div>
            ),
        },
        {
            title: "Color",
            dataIndex: "color",
            key: "color",
            render: (color: string) => (
                <div className="flex items-center">
                    <span className="w-4 h-4 rounded-full" style={{ backgroundColor: color }}></span>
                    <span className="ml-2">{color}</span>
                </div>
            ),
        },
        {
            render: (_: any, record: ClientList) => (
                <Dropdown
                    overlay={
                        <Menu>
                            <Menu.Item key="edit" onClick={() => handleEditClick(record)}>
                                Edit
                            </Menu.Item>
                        </Menu>
                    }
                    trigger={["click"]}
                >
                    <MoreOutlined className="cursor-pointer text-gray-500" />
                </Dropdown>
            ),
        },
    ];

    const handleEditClick = (record: ClientList) => {
        setEditingItem(record);
        form.setFieldsValue(record);
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async () => {
        try {
            const values = await form.validateFields();
            if (editingItem) {
                const payLoad = {
                    id: editingItem._id,
                    listName: values.listName,
                    status: editingItem.status,
                    color: values.color,
                };
                const res: ApiResponse<null> = await editClientList(payLoad);
                if (res.success) {
                    setIsEditModalOpen(false);
                    setEditingItem(null);
                    form.resetFields();
                    setVal(!val);
                }
            }
        } catch (error) {
            console.error("Error editing client list:", error);
            message.error("Failed to edit client list.");
        }
    };

    const showModal = () => setIsModalOpen(true);
    const handleCancel = () => setIsModalOpen(false);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            const data = {
                listName: values.name,
                color: values.color,
            };
            const res: ApiResponse<null> = await createClientList(data);
            if (res.success) {
                setIsModalOpen(false);
                message.success(res.message || "Client list created successfully");
                form.resetFields();
                setVal(!val);
            }
        } catch (error) {
            console.error("Error creating client list:", error);
            message.error("Failed to create client list.");
        }
    };

    return (
        <div className="p-6 bg-white shadow-md rounded-md">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-xl font-semibold">Client Lists</h2>
                    <p className="text-gray-500 text-sm">
                        Use lists to divide clients by different groups. A client can be added to multiple lists.
                    </p>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
                    List
                </Button>
            </div>

            <Table<ClientList>
                columns={columns}
                dataSource={colorList}
                pagination={false}
                rowKey={(record) => record._id}
                className="shadow-sm rounded-md"
            />

            <Modal title="Add New List" open={isModalOpen} onOk={handleOk} onCancel={handleCancel}>
                <Form form={form} layout="vertical">
                    <Form.Item label="List Name" name="name" rules={[{ required: true, message: "Please enter a list name" }]}>
                        <Input placeholder="Enter list name" />
                    </Form.Item>
                    <Form.Item label="Color Code" name="color" rules={[{ required: true, message: "Please enter a color code" }]}>
                        <Input placeholder="Enter color code (e.g., #428BCA)" />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal 
                title="Edit List" 
                open={isEditModalOpen} 
                onCancel={() => setIsEditModalOpen(false)} 
                onOk={handleEditSubmit}
            >
                <Form form={form} layout="vertical">
                    <Form.Item label="List Name" name="listName" rules={[{ required: true, message: "List name is required" }]}>
                        <Input placeholder="Enter list name" />
                    </Form.Item>
                    <Form.Item label="Color" name="color" rules={[{ required: true, message: "Color is required" }]}>
                        <Input placeholder="Enter color code" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default List;
