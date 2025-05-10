import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, message } from 'antd';
import { Editor } from '@tinymce/tinymce-react';
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
  const [, setLoading] = useState(false);

  function decodeHtmlEntities(str: string) {
    const txt = document.createElement('textarea');
    txt.innerHTML = str;
    return txt.value;
  }


  useEffect(() => {
    if (editId) {
      const fetchTemplate = async () => {
        setLoading(true);
        const res = await getEmailTemplateById(editId);
        if (res?.success && res?.data) {
          form.setFieldsValue({ subject: res.data.subject });
          setContent(decodeHtmlEntities(res.data.body)); // decode if it's escaped
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
    form.validateFields().then(async (values) => {
      if (!content) return;

      const obj = {
        subject: values.subject,
        body: content,
        id: editId ?? localStorage.getItem('adminId'),
      };

      const res = editId
        ? await updateEmailTemplate({ ...obj, id: editId! })
        : await createEmailTemplate(obj);

      if (!res.success) {
        message.error(res.message);
        return;
      }

      message.success(res.message);
      onClose();
      form.resetFields();
      setContent('');
      func(!val);
    }).catch((info) => {
      console.log('Validation Failed:', info);
    });
  };

  return (
    <Modal
      title="New Template"
      open={isOpen}
      onOk={handleOk}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <Form layout="vertical" form={form} onFinish={handleOk}>
        <Form.Item
          label="Subject"
          name="subject"
          rules={[{ required: true, message: 'Please enter subject' }]}
        >
          <Input placeholder="Subject" />
        </Form.Item>
        <Editor
          value={content}
          onEditorChange={(newValue) => setContent(newValue)}
          apiKey="1ya1d1zav4tgpip8exgsyyatkcy07funukfyfrnn93t7wslj"
          init={{
            height: 500,
            menubar: true,
            plugins: [
              'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor',
              'searchreplace', 'visualblocks', 'code', 'fullscreen',
              'insertdatetime', 'media', 'table', 'help', 'wordcount'
            ],
            toolbar:
              'undo redo | formatselect | ' +
              'bold italic forecolor backcolor | alignleft aligncenter ' +
              'alignright alignjustify | bullist numlist outdent indent | ' +
              'removeformat | help',
            content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
          }}
        />



        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-blue-600 !text-white hover:bg-blue-700 transition"
          >
            Save
          </button>
        </div>
      </Form>
    </Modal>
  );
};

export default AddEmailTemplateModal;
