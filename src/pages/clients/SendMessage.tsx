import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Button, message, Select } from 'antd';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { sendCustomerMail, getAllEmailTemplates } from '../../config/apiClient';
import { Customer } from '../../schema/customernew';

const { Option } = Select;

interface Props {
  customerId: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  func: () => void;
  val: any;
}

interface EmailTemplate {
  _id: string;
  subject: string;
  body: string;
}


const SendMessage: React.FC<Props> = ({ customerId, isOpen, onClose }) => {
  const [form] = Form.useForm();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [, setMessageText] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      resetForm();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    const res = await getAllEmailTemplates();
    if (res.success && Array.isArray(res.data)) {
      setTemplates(res.data);
    }
  };

  const resetForm = () => {
    setSelectedTemplateId(null);
    setSubject('');
    setContent('');
    setMessageText('');
    form.resetFields();
  };

  const handleTemplateSelect = (templateId: string) => {
    const selected = templates.find((t) => t._id === templateId);
    if (selected) {
      setSelectedTemplateId(templateId);
      setSubject(selected.subject);
      setContent(decodeHtml(selected.body));
    }
  };

  const decodeHtml = (html: string) => {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  };

  const handleSend = async () => {
    if (!subject.trim() || !content.trim()) {
      message.error('Please fill in both subject and content before sending.');
      return;
    }

    const obj = {
      customerId: customerId?._id || '',
      subject: subject,
      body: content,
    };

    if (!obj.customerId) {
      message.error('Customer ID is required.');
      return;
    }

    const res = await sendCustomerMail(obj);

    if (!res.success) {
      message.error(res.message);
      return;
    }

    message.success(res.message);
    onClose();
    resetForm();
  };

  return (
    <Modal
      title="Send Message"
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="send" type="primary" onClick={handleSend}>
          Send
        </Button>,
      ]}
      width={800}
    >
      <Form layout="vertical" form={form}>
        <Form.Item label="Choose Template">
          <Select
            placeholder="Select a template"
            onChange={handleTemplateSelect}
            value={selectedTemplateId || undefined}
            allowClear
          >
            {templates.map((tpl) => (
              <Option key={tpl._id} value={tpl._id}>
                {tpl.subject} - {decodeHtml(tpl.body).slice(0, 30)}...
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Subject"
          rules={[{ required: true, message: 'Please enter subject' }]}
        >
          <Input
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
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

export default SendMessage;
