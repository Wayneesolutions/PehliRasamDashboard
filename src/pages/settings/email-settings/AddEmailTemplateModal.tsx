import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, message } from 'antd';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { createEmailTemplate, getEmailTemplateById, updateEmailTemplate } from '../../../config/apiClient';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  func: React.Dispatch<React.SetStateAction<boolean>>;
  val: boolean;
  editId?: string | null;
}

const AddEmailTemplateModal: React.FC<Props> = ({ isOpen, func, val, onClose, editId }) => {
  const [form] = Form.useForm();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editId) {
      const fetchTemplate = async () => {
        setLoading(true);
        const res = await getEmailTemplateById(editId);
        if (res?.success && res?.data) {
          form.setFieldsValue({ subject: res.data.subject });
          setContent(res.data.body);
        }
        setLoading(false);
      };
      fetchTemplate();
    } else {
      form.resetFields();
      setContent('');
    }
  }, [editId, isOpen]);

  const handleOk = () => {
    form
      .validateFields()
      .then(async (values) => {
        if (!content) return;

        const obj = {
          subject: values.subject,
          body: content,
          id: editId ?? localStorage.getItem('adminId'),
        };

        let res;
        if (editId) {
          res = await updateEmailTemplate({
            subject: values.subject,
            body: content,
            id: editId!,
          });

        } else {
          res = await createEmailTemplate(obj);
        }

        if (!res.success) {
          message.error(res.message);
          return;
        }

        message.success(res.message);
        onClose();
        form.resetFields();
        setContent('');
        func(!val);
      })
      .catch((info) => {
        console.log('Validation Failed:', info);
      });
  };

  return (
    <Modal
      title={editId ? 'Edit Template' : 'New Template'}
      open={isOpen}
      onOk={handleOk}
      onCancel={onClose}
      okText="Save"
      cancelText="Cancel"
      confirmLoading={loading}
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
