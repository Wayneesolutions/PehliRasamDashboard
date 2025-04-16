import React, { useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { sendCustomerMail } from '../../config/apiClient';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  func: () => void;
  val: any;
}

const SendMessage: React.FC<Props> = ({customerId, isOpen, onClose, func, val }) => {
  const [form] = Form.useForm();
  const [content, setContent] = useState('');
  const [subject,setSubject] = useState('')
  const [messageText, setMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  console.log('d',customerId?._id);
  const handleSend = async() => {
    message.success('Message sent successfully!');
    console.log(customerId?._id,content,subject);
    console.log("Sending Mail Payload:", {
      customerId: customerId?._id,
      subject: subject,
      body: content
    });
    
    let obj = {
      customerId:customerId?._id,
      subject:subject,
      body:content
    }
    let res = await sendCustomerMail(obj)
     if(!res.success){
      message.error(res.message)
      return
     }
    
    message.success(res?.message)
    setIsSendingMessage(false);
    onClose();
  };

  const handleSaveTemplate = () => {
    message.success('Template saved!');
    form.resetFields();
    setContent('');
    onClose();
  };

  return (
    <Modal
      title={isSendingMessage ? 'Send Message' : 'New Template'}
      open={isOpen}
      onCancel={onClose}
      footer={[
        !isSendingMessage && (
          <Button key="create" type="primary" onClick={handleSaveTemplate}>
            Save Template
          </Button>
        ),
        isSendingMessage ? (
          <>
            <Button key="cancel" onClick={() => setIsSendingMessage(false)}>
              Cancel
            </Button>
            <Button key="send" type="primary" onClick={handleSend}>
              Send
            </Button>
          </>
        ) : (
          <Button key="sendMessage" onClick={() => setIsSendingMessage(true)}>
            Send Message
          </Button>
        ),
      ]}
      width={800}
    >
      {!isSendingMessage ? (
        <Form layout="vertical" form={form}>
          <Form.Item
            label="Subject"
            name="subject"
            rules={[{ required: true, message: 'Please enter subject' }]}
          >
            <Input placeholder="Subject" value={subject} onChange={(e)=>setSubject(e.target.value)}/>
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
      ) : (
        <Input.TextArea
          rows={4}
          placeholder="Type your message here"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
        />
      )}
    </Modal>
  );
};

export default SendMessage;
