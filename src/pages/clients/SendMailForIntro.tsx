import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, Input, Select, message, Tag } from 'antd';
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
    const [emails, setEmails] = useState<string[]>([]);
    const [emailInput, setEmailInput] = useState<string>('');
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
        if (!templateId) {
            // Clear selection
            setSelectedTemplateId(undefined);
            setSubject('');
            setContent('');
            form.setFieldsValue({ subject: '' });
            if (editorRef.current) {
                editorRef.current.setContent('');
            }
            return;
        }
        
        const selected = templates.find((t) => t._id === templateId);
        if (selected) {
            setSelectedTemplateId(templateId);
            setSubject(selected.subject);
            form.setFieldsValue({ subject: selected.subject });

            const decodedBody = decodeHtml(selected.body);
            setContent(decodedBody);

            // Set content in editor after a small delay to ensure editor is ready
            setTimeout(() => {
                if (editorRef.current) {
                    editorRef.current.setContent(decodedBody);
                }
            }, 100);
        }
    };

    const decodeHtml = (html: string) => {
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    };

    // Email validation function
    const isValidEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.trim());
    };

    // Handle email input changes
    const handleEmailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEmailInput(value);

        // If user types comma or presses enter, process the email
        if (value.includes(',') || value.includes(';')) {
            const newEmails = value.split(/[,;]/).map(email => email.trim()).filter(email => email);
            addEmails(newEmails);
            setEmailInput('');
        }
    };

    // Handle key press events
    const handleEmailInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            if (emailInput.trim()) {
                addEmails([emailInput.trim()]);
                setEmailInput('');
            }
        }
    };

    // Add emails to the list
    const addEmails = (newEmails: string[]) => {
        const validEmails: string[] = [];
        const invalidEmails: string[] = [];

        newEmails.forEach(email => {
            if (email && isValidEmail(email)) {
                if (!emails.includes(email)) {
                    validEmails.push(email);
                }
            } else if (email) {
                invalidEmails.push(email);
            }
        });

        if (validEmails.length > 0) {
            setEmails(prev => [...prev, ...validEmails]);
        }

        if (invalidEmails.length > 0) {
            message.warning(`Invalid email(s): ${invalidEmails.join(', ')}`);
        }
    };

    // Remove email from list
    const removeEmail = (emailToRemove: string) => {
        setEmails(prev => prev.filter(email => email !== emailToRemove));
    };

    // Handle input blur (when user clicks outside)
    const handleEmailInputBlur = () => {
        if (emailInput.trim()) {
            addEmails([emailInput.trim()]);
            setEmailInput('');
        }
    };

    const handleSendEmail = async () => {
        if (emails.length === 0) {
            message.error('Please add at least one email address.');
            return;
        }

        if (!subject || !content) {
            message.error('Please fill in all fields.');
            return;
        }

        if (!customerId) {
            message.error('Customer ID is missing.');
            return;
        }

        if (!link) {
            message.error('Intro link is missing.');
            return;
        }

        setLoading(true);
        try {
            const response = await apiClient.post('/admin/sendMailForIntro', {
                customerId,
                subject,
                body: content,
                extraEmails: emails,
                introLink: link,
            });

            if (response.data.success) {
                message.success('Email sent successfully!');
                onClose();
                // Reset form
                setEmails([]);
                setEmailInput('');
                setSubject('');
                setContent('');
                setSelectedTemplateId(undefined);
                form.resetFields();
            } else {
                message.error(response.data.message || 'Failed to send email.');
            }
        } catch (error: any) {
            const errorMsg = error?.response?.data?.message || 'Error sending email.';
            message.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            if (!customerId) {
                message.error('Customer ID is missing. Cannot send intro email.');
                onClose();
                return;
            }
            if (!link) {
                message.error('Intro link is missing. Cannot send intro email.');
                onClose();
                return;
            }
            fetchTemplates();
        }
    }, [isOpen, customerId, link, onClose]);

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setEmails([]);
            setEmailInput('');
            setSubject('');
            setContent('');
            setSelectedTemplateId(undefined);
            form.resetFields();
        }
    }, [isOpen, form]);

    return (
        <Modal
            title="Send Intro Email"
            open={isOpen}
            onCancel={onClose}
            width={900}
            centered
            destroyOnClose
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
                    label="Email Recipients"
                    required
                    validateStatus={emails.length === 0 ? 'error' : ''}
                    help={emails.length === 0 ? 'Please add at least one email address' : `${emails.length} recipient(s) added. Type email and press Enter or comma to add more.`}
                >
                    <div style={{
                        border: '1px solid #d9d9d9',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        minHeight: '32px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        {emails.map((email, index) => (
                            <Tag
                                key={index}
                                closable
                                onClose={() => removeEmail(email)}
                                style={{ margin: '2px' }}
                            >
                                {email}
                            </Tag>
                        ))}
                        <Input
                            type="email"
                            placeholder={emails.length === 0 ? "Enter email addresses (separated by comma or press Enter)" : "Add more emails..."}
                            value={emailInput}
                            onChange={handleEmailInputChange}
                            onKeyPress={handleEmailInputKeyPress}
                            onBlur={handleEmailInputBlur}
                            style={{
                                border: 'none',
                                outline: 'none',
                                boxShadow: 'none',
                                flex: 1,
                                minWidth: '200px'
                            }}
                        />
                    </div>
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
                    required
                    validateStatus={!content ? 'error' : ''}
                    help={!content ? 'Please enter email content' : ''}
                >
                    <TinyMCEEditor
                        value={content}
                        onInit={(_, editor) => (editorRef.current = editor)}
                        onEditorChange={(newContent) => setContent(newContent)}
                        apiKey="1ya1d1zav4tgpip8exgsyyatkcy07funukfyfrnn93t7wslj"
                        init={{
                            height: 400,
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
                            branding: false,
                            promotion: false,
                        }}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default SendMailForIntro;