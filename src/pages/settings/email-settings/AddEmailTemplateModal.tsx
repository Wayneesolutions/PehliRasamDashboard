import React, { useState } from 'react';
import { Modal, Form, Input, Select } from 'antd';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const { Option } = Select;

const AddEmailTemplateModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [form] = Form.useForm();
  const [content, setContent] = useState('');

  const handleOk = () => {
    form
      .validateFields()
      .then(values => {
        console.log('Template Data:', { ...values, content });
        onClose();
        form.resetFields();
        setContent('');
      })
      .catch(info => {
        console.log('Validation Failed:', info);
      });
  };

  return (
    <Modal
      title="New Template"
      open={isOpen}
      onOk={handleOk}
      onCancel={onClose}
      okText="Save"
      cancelText="Cancel"
      width={800}
    >
      <Form layout="vertical" form={form}>
        <Form.Item
          label="Subject"
          name="subject"
          rules={[{ required: true, message: 'Please enter subject' }]}
        >
          <Input placeholder="Subject" />
        </Form.Item>

        <Form.Item
          label="Content"
          required
          validateStatus={!content ? 'error' : ''}
          help={!content ? 'Please enter email content' : ''}
        >
          <ReactQuill
            theme="snow"
            value={content}
            onChange={setContent}
            placeholder="Write your email content..."
            style={{ height: 200 }}
          />
        </Form.Item>

  
      </Form>
    </Modal>
  );
};

export default AddEmailTemplateModal;
