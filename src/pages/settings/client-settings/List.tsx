import { Button, Dropdown, Modal, Menu, Form, Input, message } from "antd";
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
        <div className="p-6 bg-white">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Client Lists</h2>
                    <p className="text-sm text-gray-600">
                        Use lists to divide clients by different groups. A client can be added to multiple lists.
                    </p>
                </div>
                <Button 
                    icon={<PlusOutlined />} 
                    onClick={showModal}
                    className="bg-blue-600  !text-black border-0 shadow-sm"
                >
                    List
                </Button>
            </div>

            {/* Custom Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Table Header */}
                <div className="bg-gray-50 border-b border-gray-200 grid grid-cols-12 gap-4 px-4 py-3">
                    <div className="col-span-1"></div>
                    <div className="col-span-5">
                        <span className="text-sm font-semibold text-gray-700">List name</span>
                    </div>
                    <div className="col-span-6">
                        <span className="text-sm font-semibold text-gray-700">Color</span>
                    </div>
                </div>

                {/* Table Body */}
                <div className="bg-white">
                    {colorList.length > 0 ? (
                        colorList.map((list, index) => (
                            <div 
                                key={list._id} 
                                className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors items-center"
                            >
                                {/* Drag Handle */}
                                <div className="col-span-1 flex items-center">
                                    <MenuOutlined className="text-gray-400 cursor-move" style={{ fontSize: '16px' }} />
                                </div>

                                {/* List Name */}
                                <div className="col-span-5">
                                    <span className="text-sm text-gray-900">{list.listName}</span>
                                </div>

                                {/* Color */}
                                <div className="col-span-5 flex items-center gap-2">
                                    <span 
                                        className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0" 
                                        style={{ backgroundColor: list.color }}
                                    ></span>
                                    <span className="text-sm text-gray-600">{list.color}</span>
                                </div>

                                {/* Actions Menu */}
                                <div className="col-span-1 flex justify-end">
                                    <Dropdown
                                        overlay={
                                            <Menu>
                                                <Menu.Item key="edit" onClick={() => handleEditClick(list)}>
                                                    Edit
                                                </Menu.Item>
                                            </Menu>
                                        }
                                        trigger={["click"]}
                                        placement="bottomRight"
                                    >
                                        <MoreOutlined className="cursor-pointer text-gray-500 hover:text-gray-700 transition-colors" style={{ fontSize: '18px' }} />
                                    </Dropdown>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="px-4 py-8 text-center text-gray-500">
                            No lists found. Create your first list to get started.
                        </div>
                    )}
                </div>
            </div>

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
