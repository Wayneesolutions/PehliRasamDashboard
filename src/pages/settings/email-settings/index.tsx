import { useEffect, useState } from 'react';
import { Button, Dropdown, Menu, Modal, Table, message } from 'antd';
import { EllipsisOutlined, PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import AddEmailTemplateModal from './AddEmailTemplateModal';
import { deleteEmailTemplate, getAllEmailTemplates } from '../../../config/apiClient';

interface EmailTemplateType {
  key: string;
  subject: string;
  body: string;
  _id: string;
}

const Index = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplateType[]>([]);
  const [val, setVal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

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

  const handleDeleteConfirm = (record: EmailTemplateType) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this template?',
      content: record.subject,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        const res = await deleteEmailTemplate(record._id);
        if (!res.success) {
          message.error(res?.message);
          return;
        }
        message.success(res?.message);
        setVal(!val);
      },
    });
  };

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
              <Menu.Item key="edit" onClick={() => {
                setEditId(record._id);
                setIsModalOpen(true);
              }}>
                Edit
              </Menu.Item>
              <Menu.Item key="delete" danger onClick={() => handleDeleteConfirm(record)}>
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

  return (
    <div className="p-4 bg-white rounded shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Email Templates</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditId(null);
            setIsModalOpen(true);
          }}
        >
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
        editId={editId}
        onClose={() => {
          setIsModalOpen(false);
          setEditId(null);
        }}
      />
    </div>
  );
};

export default Index;
