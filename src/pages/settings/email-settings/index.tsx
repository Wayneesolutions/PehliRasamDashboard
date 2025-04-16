import  { useState } from 'react';
import { Button, Dropdown, Menu, Modal, Table } from 'antd';

import { EllipsisOutlined, PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import AddEmailTemplateModal from './AddEmailTemplateModal';

const Index = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const data = [
        { key: '1', title: 'Greetings From Pehli Rasam :abc' },
        { key: '2', title: 'Pehli Rasam : abc' },
        { key: '3', title: 'Pehli Rasam : abc' },
        { key: '4', title: 'Pehli Rasam : abcd' },
        { key: '5', title: 'Pehli Rasam : abc' },
        { key: '6', title: 'Pehli Rasam : abcd' },
        { key: '7', title: 'Pehli Rasam : abcd' },
        { key: '8', title: 'Pehli Rasam : abcd' },
        { key: '9', title: 'Pehli Rasam : abcd' },
        { key: '10', title: 'Pehli Rasam :abcd' }
    ];

    const columns: ColumnsType<{ key: string; title: string }> = [
        {
          title: 'Email Templates',
          dataIndex: 'title',
          key: 'title',
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
      

    const handleDeleteConfirm = (record: { key: string; title: string }) => {
        Modal.confirm({
          title: 'Are you sure you want to delete this template?',
          content: record.title,
          okText: 'Delete',
          okType: 'danger',
          cancelText: 'Cancel',
          onOk: () => {
            console.log('Deleted:', record.key); // You can handle the deletion logic here
            // Example: setData(data.filter(item => item.key !== record.key));
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
                dataSource={data}
                columns={columns}
                pagination={false}
                rowKey="key"
                bordered
            />

            <AddEmailTemplateModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
};

export default Index;
