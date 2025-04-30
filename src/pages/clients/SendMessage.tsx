import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Button, message, Select } from 'antd';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { sendCustomerMail, getAllEmailTemplates } from '../../config/apiClient';

const { Option } = Select;

interface Props {
  customerId: string | null;
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
  const [content, setContent] = useState('');

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
    setContent('');
    form.resetFields();
  };

  const decodeHtml = (html: string) => {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  };

  const handleTemplateSelect = (templateId: string) => {
    const selected = templates.find((t) => t._id === templateId);
    if (selected) {
      setSelectedTemplateId(templateId);
      form.setFieldsValue({
        subject: selected.subject,
      });
      setContent(decodeHtml(selected.body));
    }
  };

  const handleSend = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        customerId: customerId || '',
        subject: values.subject,
        body: content,
      };
      const res = await sendCustomerMail(payload);
      if (!res.success) {
        message.error(res.message);
        return;
      }
      message.success(res.message);
      onClose();
      resetForm();
    } catch (error) {
      // silently fail validation error
    }
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
          name="subject"
          rules={[{ required: true, message: 'Please enter subject' }]}
        >
          <Input placeholder="Subject" />
        </Form.Item>

        <Form.Item
          label="Content"
          name="content"
          required
          validateStatus={!content ? 'error' : ''}
          help={!content ? 'Please enter email content' : ''}
        >
          <CKEditor
            editor={ClassicEditor}
            data={content}
            onChange={(_, editor) => setContent(editor.getData())}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SendMessage;
