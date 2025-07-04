import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, Input, Select, message } from 'antd';
import apiClient, { getAllEmailTemplates } from '../../config/apiClient';
import { Editor as TinyMCEEditor } from '@tinymce/tinymce-react';

interface Props {
    link: string;
    customerId: string | null;
    isOpen: boolean;
    onClose: () => void;
}

const { Option } = Select;

const SendMailForIntro: React.FC<Props> = ({ link, customerId, isOpen, onClose }) => {
    const [email, setEmail] = useState<string>('');
    const [subject, setSubject] = useState<string>('');
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(undefined);
    const [form] = Form.useForm();
    const editorRef = useRef<any>(null);

    const fetchTemplates = async () => {
        try {
            const res = await getAllEmailTemplates();
            if (res.success && Array.isArray(res.data)) {
                setTemplates(res.data);
            }
        } catch (error) {
            message.error('Failed to load email templates.');
        }
    };


    const handleTemplateSelect = (templateId: string) => {
        const selected = templates.find((t) => t._id === templateId);
        if (selected) {
            setSelectedTemplateId(templateId);
            setSubject(selected.subject);
            form.setFieldsValue({ subject: selected.subject });

            const decodedBody = decodeHtml(selected.body);
            const fullContentWithLink = `${decodedBody}<p><a href="${link}">Click here to view the introduction</a></p>`;
            setContent(fullContentWithLink);

            if (editorRef.current) {
                editorRef.current.setContent(fullContentWithLink);
            }
        }
    };




    const decodeHtml = (html: string) => {
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    };


    const handleSendEmail = async () => {


        if (!email || !subject || !content) {
            message.error('Please fill in all fields.');
            return;
        }

        setLoading(true);
        try {
            const response = await apiClient.post('/admin/sendMailForIntro', {
                customerId,
                subject,
                body: content,
                extraEmails: [email],
                introLink: link,
            });


            if (response.data.success) {
                message.success('Email sent successfully!');
                onClose();
            } else {
                message.error(response.data.message || 'Failed to send email.');
            }
        } catch (error) {
            message.error('Error sending email.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchTemplates();
        }
    }, [isOpen]);

    return (
        <Modal
            title="Send Intro Email"
            open={isOpen}
            onCancel={onClose}
            width={800}
            footer={[
                <Button key="cancel" onClick={onClose}>
                    Cancel
                </Button>,
                <Button key="send" type="primary" loading={loading} onClick={handleSendEmail}>
                    Send Email
                </Button>
            ]}
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
                    label="Email"
                    required
                    validateTrigger="onSubmit"
                    help="Enter the recipient's email address"
                >
                    <Input
                        type="email"
                        placeholder="Recipient's email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </Form.Item>

                <Form.Item
                    label="Subject"
                    name="subject"
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
                    name="content"
                    required
                    validateStatus={!content ? 'error' : ''}
                    help={!content ? 'Please enter email content' : ''}
                >
                    <TinyMCEEditor
                        onInit={(_, editor) => (editorRef.current = editor)}

                        onEditorChange={(newContent) => setContent(newContent)}
                        apiKey="1ya1d1zav4tgpip8exgsyyatkcy07funukfyfrnn93t7wslj"
                        init={{
                            height: 500,
                            menubar: true,
                            plugins: [
                                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor',
                                'searchreplace', 'visualblocks', 'code', 'fullscreen',
                                'insertdatetime', 'media', 'table', 'help', 'wordcount',
                            ],
                            toolbar:
                                'undo redo | formatselect | ' +
                                'bold italic forecolor backcolor | alignleft aligncenter ' +
                                'alignright alignjustify | bullist numlist outdent indent | ' +
                                'removeformat | help',
                            content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                        }}
                    />

                </Form.Item>
            </Form>
        </Modal>
    );
};

export default SendMailForIntro;
