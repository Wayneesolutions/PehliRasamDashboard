import { useEffect, useState } from 'react';
import { Button, Dropdown, Menu, Modal, Table } from 'antd';
import { EllipsisOutlined, PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import AddEmailTemplateModal from './AddEmailTemplateModal';
import { deleteEmailTemplate, getAllEmailTemplates } from '../../../config/apiClient';
import { message } from "antd";
interface EmailTemplateType {
  key: string;
  subject: string;
  body: string;
  _id: string;
}

const Index = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplateType[]>([]);
  const [val,setVal] = useState(false)
  useEffect(() => {
    const getAllEmail = async () => {
      const res = await getAllEmailTemplates();
      if (res.success && Array.isArray(res.data)) {
        const formattedData = res.data.map((item: any) => ({
          key: item._id,
          subject: item.subject,
          body: item.body,
          _id: item._id,
        }));
        setTemplates(formattedData);
      }
    };
    getAllEmail();
  }, [val]);

  const columns: ColumnsType<EmailTemplateType> = [
    {
      title: 'Email Templates',
      dataIndex: 'subject',
      key: 'subject',
      render: (text: string) => (
        <span style={{ color: '#1677ff', cursor: 'pointer' }}>{text}</span>
      ),
    },
    {
      key: 'action',
      render: (_, record) => (
        <Dropdown
          overlay={
            <Menu>
              <Menu.Item
                key="delete"
                danger
                onClick={() => handleDeleteConfirm(record)}
              >
                Delete
              </Menu.Item>
            </Menu>
          }
          trigger={['click']}
        >
          <EllipsisOutlined style={{ fontSize: 20, cursor: 'pointer' }} />
        </Dropdown>
      ),
      align: 'right',
    },
  ];

  const handleDeleteConfirm = (record: EmailTemplateType) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this template?',
      content: record.subject,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        console.log(record);
        let obj = {
          id:record._id
        }
        const res = await deleteEmailTemplate(obj)
        if(!res.success){
          message.error(res?.message)
          return
        }
        message.success(res?.message)
        setVal(!val)
        // try {
        //   const res = await deleteEmailTemplate({ id: record._id });
        //   if (res.success) {
        //     message.success('Template deleted successfully!');
        //     setTemplates((prev) => prev.filter((item) => item._id !== record._id));
        //   } else {
        //     message.error(res.message || 'Failed to delete template');
        //   }
        // } catch (err) {
        //   message.error('Something went wrong!');
        // }
      },
    });
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Email Templates</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          Email Template
        </Button>
      </div>

      <Table
        dataSource={templates}
        columns={columns}
        pagination={false}
        rowKey="key"
        bordered
      />

      <AddEmailTemplateModal
        isOpen={isModalOpen}
        func={setVal}
        val={val}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default Index;
