import { Table, Button,Dropdown, Modal,Menu ,Form, Input } from "antd";
import { PlusOutlined, MoreOutlined, MenuOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { createClientList, editClientList, getAllClientLists } from "../../../config/apiClient";
import { message } from "antd";


const List = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [colorList,setColorList] = useState([])
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [val,setVal]= useState(false)
    const [form] = Form.useForm();

    useEffect(()=>{
     async function getAllClientColor(){
        let res = await getAllClientLists()
        if(res.success){
            setColorList(res.data)
        }
     }
     getAllClientColor()
    },[val])
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
            render: (_, record) => (
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

    const handleEditClick = (record) => {
        setEditingItem(record);
        form.setFieldsValue(record); // Set form values with the existing record data
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = () => {
        form.validateFields().then(async(values) => {
            console.log("Edited Data:", { ...editingItem, ...values });
            let obj = { ...editingItem, ...values }
            console.log('===',obj);
            let payLoad={
                id:obj._id,
                listName:obj.listName,
                status:obj.status,
                color:obj.color
            }
            let res = await editClientList(payLoad)
            // TODO: Add API request to update data here
            
            
            
             if(res.success){
                setIsEditModalOpen(false);
                setEditingItem(null);
                form.resetFields();
                setVal(!val)
             }
            
        });
    };

    const showModal = () => setIsModalOpen(true);
    const handleCancel = () => setIsModalOpen(false);
    const handleOk = () => {
        form.validateFields().then(async(values) => {
            console.log(values);
            let data={
                listName:values.name,
                color:values.color
            }
           let res = await createClientList(data)
           console.log(res);
           
           if(res.success){
            setIsModalOpen(false);
            message.success(res.message)
            form.resetFields();
            setVal(!val)
           }
           

        });
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

            <Table
                columns={columns}
                dataSource={colorList}
                pagination={false}
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
