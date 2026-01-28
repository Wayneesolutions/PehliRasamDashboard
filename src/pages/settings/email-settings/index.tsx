import { useState, useEffect } from 'react';
import { Button, Input, Radio, message, Card, Modal, Switch } from 'antd';
import { MailOutlined, SendOutlined } from '@ant-design/icons';
import { getEmailSettings, updateEmailSettings, sendTestEmail } from '../../../config/apiClient';

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
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [autoReplyMessage, setAutoReplyMessage] = useState('Thank you for contacting us. We have received your email and our team will contact you soon.');
  const [sendingTest, setSendingTest] = useState(false);
  const [testEmailModalVisible, setTestEmailModalVisible] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');

  // Fetch email settings on component mount
  useEffect(() => {
    fetchEmailSettings();
  }, []);

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
        setAutoReplyEnabled(res.data.autoReplyEnabled || false);
        setAutoReplyMessage(res.data.autoReplyMessage || 'Thank you for contacting us. We have received your email and our team will contact you soon.');
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
        imapSettings,
        autoReplyEnabled,
        autoReplyMessage
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
              To set multiple email addresses, enter them separated by commas. Default reply to is set to your agency email address Agency info@pehlirasam.com
            </p>
            <Input
              value={replyToEmail}
              onChange={(e) => setReplyToEmail(e.target.value)}
              placeholder="Enter email addresses separated by commas"
              className="w-full"
            />
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

        {/* IMAP Settings Section */}
        <Card className="mb-6 shadow-sm">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              IMAP Settings (for receiving emails):
            </label>
            <p className="text-sm text-gray-600 mb-3">
              Configure IMAP settings to receive emails for auto-reply functionality. Use the same email account as your SMTP settings.
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

        {/* Auto-Reply Settings Section */}
        <Card className="mb-6 shadow-sm">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auto-Reply:
                </label>
                <p className="text-sm text-gray-600">
                  Automatically reply to emails sent to your inbound email address
                </p>
              </div>
              <Switch
                checked={autoReplyEnabled}
                onChange={setAutoReplyEnabled}
              />
            </div>
            
            {!autoReplyEnabled && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Auto-reply is currently disabled.</strong> Enable the toggle above to activate automatic replies.
                </p>
              </div>
            )}
            
            {autoReplyEnabled && (!inboundEmail || !imapSettings.host || !imapSettings.username) && (
              <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800 font-medium mb-2">⚠️ Configuration Required:</p>
                <ul className="text-sm text-orange-700 list-disc list-inside space-y-1">
                  {!inboundEmail && <li>Set your Inbound Email Address above</li>}
                  {!imapSettings.host && <li>Configure IMAP Host</li>}
                  {!imapSettings.username && <li>Configure IMAP Username</li>}
                </ul>
              </div>
            )}
            {autoReplyEnabled && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auto-Reply Message:
                </label>
                <Input.TextArea
                  rows={4}
                  value={autoReplyMessage}
                  onChange={(e) => setAutoReplyMessage(e.target.value)}
                  placeholder="Enter the message that will be sent as auto-reply"
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-2">
                  This message will be sent automatically when someone sends an email to your inbound email address.
                </p>
              </div>
            )}
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

        {/* Save Button */}
        <div className="flex justify-end mt-6">
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
      </div>

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
