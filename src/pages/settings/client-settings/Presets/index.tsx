import { Collapse, Table, Button, Dropdown, Menu } from 'antd';
import { FiMoreVertical } from 'react-icons/fi';
import { PlusOutlined } from '@ant-design/icons';

const { Panel } = Collapse;

const data = [
  {
    key: '1',
    label: 'Cover',
    kind: 'Profile',
    field: 'Cover',
  },
  {
    key: '2',
    label: 'Verified Profile',
    kind: 'Profile',
    field: 'Verified Profile',
  },
  {
    key: '3',
    label: 'Image',
    kind: 'Profile',
    field: 'Image',
  },
  {
    key: '4',
    label: 'Religion',
    kind: 'Profile',
    field: 'Religion',
  },
  {
    key: '5',
    label: 'Gender',
    kind: 'Profile',
    field: 'Gender',
  },
  // Add more fields here
];

const Index = () => {
  const menu = (
    <Menu>
      <Menu.Item key="edit">Edit</Menu.Item>
      <Menu.Item key="delete">Delete</Menu.Item>
    </Menu>
  );

  const columns = [
    {
      title: 'Label',
      dataIndex: 'label',
      key: 'label',
    },
    {
      title: 'Kind',
      dataIndex: 'kind',
      key: 'kind',
    },
    {
      title: 'Field',
      dataIndex: 'field',
      key: 'field',
    },
    {
      title: 'Required (Profile update only)',
      key: 'required',
      render: () => (
        <div className="flex justify-center">
          <input type="checkbox" disabled />
        </div>
      ),
    },
    {
      title: 'Allow Edit (Member Portal)',
      key: 'allowEdit',
      render: () => (
        <div className="flex justify-center">
          <input type="checkbox" checked readOnly />
        </div>
      ),
    },
    {
      title: '',
      key: 'action',
      render: () => (
        <Dropdown overlay={menu} trigger={['click']}>
          <Button type="text" icon={<FiMoreVertical size={20} />} />
        </Dropdown>
      ),
    },
  ];

  return (
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Top Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Presets</h2>
          <div className="flex gap-2">
            <Button type="primary" icon={<PlusOutlined />}>
              Preset
            </Button>
            <Button type="default" danger>
              Delete
            </Button>
          </div>
        </div>

        {/* Panels */}
        <Collapse defaultActiveKey={['1']} bordered={false} ghost>
          <Panel header={<span className="text-lg font-medium">Default</span>} key="1">
            {/* Table inside the panel */}
            <Table
              columns={columns}
              dataSource={data}
              pagination={false}
              bordered
              className="ant-table-striped"
            />
          </Panel>
        </Collapse>
      </div>
  );
};

export default Index;
