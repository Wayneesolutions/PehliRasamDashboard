import { useState, useEffect } from 'react';
import { Button, Input, Radio, message, Card, Modal, Switch, Table, Popconfirm } from 'antd';
import { MailOutlined, SendOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { FaInbox } from 'react-icons/fa';
import { getEmailSettings, updateEmailSettings, sendTestEmail, getAllEmailTemplates, deleteEmailTemplate } from '../../../config/apiClient';
import AddEmailTemplateModal from './AddEmailTemplateModal';

const EmailSettings = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingMethod, setSendingMethod] = useState<'default' | 'smtp'>('default');
  const [defaultSender, setDefaultSender] = useState('');
  const [smtpSettings, setSmtpSettings] = useState({
    host: '',
    port: '',
    username: '',
    password: '',
    connectionType: '',
    sender: '',
  });
  const [replyToEmail, setReplyToEmail] = useState('');
  const [inboundEmail, setInboundEmail] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [imapSettings, setImapSettings] = useState({
    host: '',
    port: '993',
    username: '',
    password: '',
    secure: true,
  });
  const [sendingTest, setSendingTest] = useState(false);
  const [testEmailModalVisible, setTestEmailModalVisible] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  
  // Email Templates state
  const [templates, setTemplates] = useState<any[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [editTemplateId, setEditTemplateId] = useState<string | null>(null);
  const [refreshTemplates, setRefreshTemplates] = useState(false);

  // Fetch email settings and templates on component mount
  useEffect(() => {
    fetchEmailSettings();
    fetchTemplates();
  }, []);

  // Refresh templates when refreshTemplates changes
  useEffect(() => {
    fetchTemplates();
  }, [refreshTemplates]);

  const fetchEmailSettings = async () => {
    setLoading(true);
    try {
      const res = await getEmailSettings();
      if (res.success && res.data) {
        setSendingMethod(res.data.sendingMethod || 'default');
        setSmtpSettings(res.data.smtpSettings || {
          host: '',
          port: '',
          username: '',
          password: '',
          connectionType: '',
          sender: '',
        });
        setReplyToEmail(res.data.replyToEmail || '');
        setInboundEmail(res.data.inboundEmail || '');
        setContactEmail(res.data.contactEmail || '');
        setImapSettings(res.data.imapSettings || {
          host: '',
          port: '993',
          username: '',
          password: '',
          secure: true,
        });
        setDefaultSender(res.data.defaultSender || 'info@pehlirasam.com');
      }
    } catch (error) {
      console.error('Error fetching email settings:', error);
      message.error('Failed to load email settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSmtpChange = (field: string, value: string) => {
    setSmtpSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImapChange = (field: string, value: string | boolean) => {
    setImapSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await updateEmailSettings({
        sendingMethod,
        smtpSettings,
        replyToEmail,
        inboundEmail,
        contactEmail,
        imapSettings
      });
      
      if (res.success) {
        message.success('Email settings saved successfully!');
      } else {
        message.error(res.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving email settings:', error);
      message.error('Failed to save email settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestMessage = async () => {
    if (sendingMethod === 'smtp') {
      // Validate SMTP fields
      if (!smtpSettings.host || !smtpSettings.port || !smtpSettings.username || !smtpSettings.password) {
        message.warning('Please fill in all required SMTP fields');
        return;
      }
    }
    
    // Show modal to enter test email address
    setTestEmailModalVisible(true);
  };

  const handleConfirmTestEmail = async () => {
    if (!testEmailAddress || !testEmailAddress.includes('@')) {
      message.warning('Please enter a valid email address');
      return;
    }

    setSendingTest(true);
    try {
      const res = await sendTestEmail({
        sendingMethod,
        smtpSettings: sendingMethod === 'smtp' ? smtpSettings : undefined,
        testEmail: testEmailAddress
      });
      
      if (res.success) {
        message.success('Test email sent successfully!');
        setTestEmailModalVisible(false);
        setTestEmailAddress('');
      } else {
        message.error(res.message || 'Failed to send test email');
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      message.error('Failed to send test email');
    } finally {
      setSendingTest(false);
    }
  };

  // Fetch email templates
  const fetchTemplates = async () => {
    setTemplatesLoading(true);
    try {
      const res = await getAllEmailTemplates();
      if (res.success && Array.isArray(res.data)) {
        setTemplates(res.data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      message.error('Failed to load email templates');
    } finally {
      setTemplatesLoading(false);
    }
  };

  // Handle add template
  const handleAddTemplate = () => {
    setEditTemplateId(null);
    setTemplateModalVisible(true);
  };

  // Handle edit template
  const handleEditTemplate = (templateId: string) => {
    setEditTemplateId(templateId);
    setTemplateModalVisible(true);
  };

  // Handle delete template
  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const res = await deleteEmailTemplate(templateId);
      if (res.success) {
        message.success('Template deleted successfully');
        fetchTemplates();
      } else {
        message.error(res.message || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      message.error('Failed to delete template');
    }
  };

  // Decode HTML entities
  const decodeHtml = (html: string) => {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  };

  // Template columns
  const templateColumns = [
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
      width: '40%',
    },
    {
      title: 'Preview',
      dataIndex: 'body',
      key: 'body',
      render: (body: string) => {
        const decoded = decodeHtml(body);
        const plainText = decoded.replace(/<[^>]*>/g, '');
        return plainText.slice(0, 100) + (plainText.length > 100 ? '...' : '');
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '20%',
      render: (_: any, record: any) => (
        <div className="flex gap-2">
          <Button
            type="default"
            icon={<EditOutlined />}
            onClick={() => handleEditTemplate(record._id)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this template?"
            onConfirm={() => handleDeleteTemplate(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="primary" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">Email Settings</h1>

        {/* Sending Emails Section */}
        <Card className="mb-6 shadow-sm">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Sending Emails:</label>
            <Radio.Group 
              value={sendingMethod} 
              onChange={(e) => setSendingMethod(e.target.value)}
              className="mb-4"
            >
              <Radio value="default">Default</Radio>
              <Radio value="smtp">SMTP</Radio>
            </Radio.Group>
          </div>

          {sendingMethod === 'default' ? (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <MailOutlined className="text-blue-600" />
                <span className="font-medium text-gray-800">
                  Pehli Rasam {defaultSender || 'info@pehli-rasam.smartmatchapp.com'}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                All automated messages from the system will be sent from this sender
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* SMTP Configuration Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMTP Host:
                  </label>
                  <Input
                    placeholder="Click to add"
                    value={smtpSettings.host}
                    onChange={(e) => handleSmtpChange('host', e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMTP Port:
                  </label>
                  <Input
                    placeholder="Click to add"
                    value={smtpSettings.port}
                    onChange={(e) => handleSmtpChange('port', e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMTP Username:
                  </label>
                  <Input
                    placeholder="Click to add"
                    value={smtpSettings.username}
                    onChange={(e) => handleSmtpChange('username', e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMTP Password:
                  </label>
                  <Input.Password
                    placeholder="Click to add"
                    value={smtpSettings.password}
                    onChange={(e) => handleSmtpChange('password', e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Connection Type:
                  </label>
                  <Input
                    placeholder="Click to add"
                    value={smtpSettings.connectionType}
                    onChange={(e) => handleSmtpChange('connectionType', e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sender:
                  </label>
                  <Input
                    placeholder="Click to add"
                    value={smtpSettings.sender}
                    onChange={(e) => handleSmtpChange('sender', e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Connected Account Options */}
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Button 
                    type="link" 
                    className="p-0 text-blue-600 hover:text-blue-700"
                    onClick={() => message.info('Gmail account connection feature coming soon')}
                  >
                    Use Connected Gmail Account
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    type="link" 
                    className="p-0 text-blue-600 hover:text-blue-700"
                    onClick={() => message.info('Outlook account connection feature coming soon')}
                  >
                    Use Connected Outlook Account
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    type="link" 
                    className="p-0 text-blue-600 hover:text-blue-700"
                    onClick={() => message.info('Yahoo Mail SMTP settings feature coming soon')}
                  >
                    SMTP server settings for Yahoo Mail
                  </Button>
                </div>
              </div>

              {/* Information Notes */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-700 mb-2">
                  For smtp.gmail.com - recommended to "Use Connected Gmail Account."
                </p>
                <p className="text-sm text-gray-700">
                  After adding or updating SMTP settings, click Send Test Message to verify it works.
                </p>
                <p className="text-sm text-gray-600 mt-2 italic">
                  (Gmail Connected Account) — If sending fails, reconnect your account in the Gmail Add-on and refresh your settings here, then try again.
                </p>
              </div>

              {/* Send Test Message Button */}
              <div className="mt-4">
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  loading={sendingTest}
                  onClick={handleSendTestMessage}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Send Test Message
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Reply To Email Section */}
        <Card className="mb-6 shadow-sm">
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reply To Email:
            </label>
            <p className="text-sm text-gray-600 mb-3">
              To set multiple email addresses, enter them separated by commas (e.g., <code className="bg-gray-100 px-1 rounded">email1@example.com, email2@example.com</code>). 
              When customers click "Reply", they'll see all these addresses to reply to.
            </p>
            <Input
              value={replyToEmail}
              onChange={(e) => setReplyToEmail(e.target.value)}
              placeholder="e.g., support@pehlirasam.com, contact@pehlirasam.com"
              className="w-full"
            />
            {replyToEmail && replyToEmail.includes(',') && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                <p className="text-xs text-blue-700">
                  <strong>✅ Multiple emails detected:</strong> {replyToEmail.split(',').map(e => e.trim()).join(' • ')}
                </p>
              </div>
            )}
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-xs text-green-800 font-medium mb-1">ℹ️ How Reply-To Works:</p>
              <ul className="text-xs text-green-700 space-y-1 list-disc list-inside">
                <li>The system will include BOTH reply-to emails AND inbound email in every email sent</li>
                <li>When customers reply, the email will go to ALL these addresses</li>
                <li><strong>Note:</strong> If you send to yourself, some email clients may not show Reply-To (this is normal)</li>
                <li><strong>Test properly:</strong> Send to a different email address to see all Reply-To addresses</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Inbound Email Address Section */}
        <Card className="mb-6 shadow-sm">
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Inbound Email Address:
            </label>
            <p className="text-sm text-gray-600 mb-3">
              The email address of your agency in Pehli Rasam as default reply to address
            </p>
            <div className="flex items-center gap-2">
              <MailOutlined className="text-gray-500" />
              <Input
                value={inboundEmail}
                onChange={(e) => setInboundEmail(e.target.value)}
                placeholder="Enter inbound email address"
                className="w-full"
              />
            </div>
          </div>
        </Card>

        {/* Contact Email Section */}
        <Card className="mb-6 shadow-sm">
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Email:
            </label>
            <p className="text-sm text-gray-600 mb-3">
              This address will be used to send different kinds of notifications to the agency
            </p>
            <div className="flex items-center gap-2">
              <MailOutlined className="text-gray-500" />
              <Input
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="Enter contact email address"
                className="w-full"
              />
            </div>
          </div>
        </Card>

        {/* IMAP Settings Section */}
        <Card className="mb-6 shadow-sm">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              IMAP Settings (for receiving emails):
            </label>
            <p className="text-sm text-gray-600 mb-3">
              Configure IMAP settings to receive emails for inbox tracking. Use the same email account as your SMTP settings.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IMAP Host:
                </label>
                <Input
                  placeholder="e.g., imap.gmail.com or mail.pehlirasam.com"
                  value={imapSettings.host}
                  onChange={(e) => handleImapChange('host', e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IMAP Port:
                </label>
                <Input
                  placeholder="993 (SSL) or 143 (TLS)"
                  value={imapSettings.port}
                  onChange={(e) => handleImapChange('port', e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IMAP Username:
                </label>
                <Input
                  placeholder="Your email address"
                  value={imapSettings.username}
                  onChange={(e) => handleImapChange('username', e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IMAP Password:
                </label>
                <Input.Password
                  placeholder="Your email password or app password"
                  value={imapSettings.password}
                  onChange={(e) => handleImapChange('password', e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="flex items-center gap-2">
                <Switch
                  checked={imapSettings.secure}
                  onChange={(checked) => handleImapChange('secure', checked)}
                />
                <span className="text-sm text-gray-700">Use SSL/TLS (recommended)</span>
              </label>
            </div>
          </div>
        </Card>

        {/* Inbox Tracking Info Section */}
        <Card className="mb-6 shadow-sm">
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-3">
              <FaInbox className="text-2xl text-blue-600" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Inbox Message Tracking
                </label>
                <p className="text-sm text-gray-600">
                  All emails sent to your inbound email address are tracked and stored
                </p>
              </div>
            </div>
            
            <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-medium mb-2">ℹ️ How Inbox Tracking Works:</p>
              <ul className="text-sm text-blue-700 space-y-2 list-disc list-inside">
                <li><strong>Emails to Inbound Address:</strong> Tracked and shown in Inbox page</li>
                <li><strong>Emails to Reply-To Addresses:</strong> NOT tracked (for customer convenience only)</li>
                <li><strong>Auto-Reply:</strong> Disabled - Only tracking customer messages</li>
                <li><strong>IMAP Check:</strong> Every 5 minutes for new messages</li>
              </ul>
            </div>

            {(!inboundEmail || !imapSettings.host || !imapSettings.username) && (
              <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800 font-medium mb-2">⚠️ Configuration Required:</p>
                <ul className="text-sm text-orange-700 list-disc list-inside space-y-1">
                  {!inboundEmail && <li>Set your Inbound Email Address above</li>}
                  {!imapSettings.host && <li>Configure IMAP Host</li>}
                  {!imapSettings.username && <li>Configure IMAP Username</li>}
                </ul>
              </div>
            )}
          </div>
        </Card>

        {/* Save Settings Button - Before Templates */}
        <div className="flex justify-end mb-6">
          <Button
            type="primary"
            size="large"
            className="bg-blue-600 hover:bg-blue-700"
            loading={saving}
            onClick={handleSaveSettings}
          >
            Save Settings
          </Button>
        </div>

        {/* Email Templates Section */}
        <Card className="mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Email Templates</h3>
              <p className="text-sm text-gray-600">
                Create and manage email templates for quick messaging
              </p>
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddTemplate}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Add Template
            </Button>
          </div>
          <Table
            columns={templateColumns}
            dataSource={templates}
            loading={templatesLoading}
            rowKey="_id"
            pagination={{
              pageSize: 5,
              showSizeChanger: false,
            }}
            locale={{
              emptyText: 'No templates found. Click "Add Template" to create one.',
            }}
          />
        </Card>
      </div>

      {/* Add/Edit Template Modal */}
      <AddEmailTemplateModal
        isOpen={templateModalVisible}
        onClose={() => {
          setTemplateModalVisible(false);
          setEditTemplateId(null);
        }}
        func={setRefreshTemplates}
        val={refreshTemplates}
        editId={editTemplateId}
      />

      {/* Test Email Modal */}
      <Modal
        title="Send Test Email"
        open={testEmailModalVisible}
        onOk={handleConfirmTestEmail}
        onCancel={() => {
          setTestEmailModalVisible(false);
          setTestEmailAddress('');
        }}
        confirmLoading={sendingTest}
        okText="Send Test Email"
      >
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test Email Address:
          </label>
          <Input
            type="email"
            placeholder="Enter email address to send test email"
            value={testEmailAddress}
            onChange={(e) => setTestEmailAddress(e.target.value)}
            onPressEnter={handleConfirmTestEmail}
          />
        </div>
        <p className="text-sm text-gray-600">
          A test email will be sent to verify your email settings are configured correctly.
        </p>
      </Modal>
    </div>
  );
};

export default EmailSettings;
