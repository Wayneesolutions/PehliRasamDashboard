import React, { useEffect, useState } from 'react';
import { Modal, Select, message, Spin, Avatar } from 'antd';
import apiClient from '../../config/apiClient';
import SendMailForIntro from './SendMailForIntro';

const { Option } = Select;

interface Props {
  customerId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

interface Group {
  _id: string;
  name: string;
}

interface Field {
  id: string;
  Kind: string;
  AllowEdit?: boolean;
  Required?: boolean;
}

const SendIntro: React.FC<Props> = ({ customerId, isOpen, onClose }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string | undefined>();
  const [presetFields, setPresetFields] = useState<Field[]>([]);
  const [basicInfo, setBasicInfo] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [introData, setIntroData] = useState<{ introId: string; link: string; customerId: string } | null>(null);

  const fetchGroups = async () => {
    try {
      const response = await apiClient.get("/admin/getAllPresetsWithFields");
      const formatted = response.data.data.map((group: any) => ({
        _id: group._id,
        name: group.name,
      }));
      setGroups(formatted);
    } catch (error) {
      message.error("Failed to load preset groups.");
    }
  };

  const fetchCustomerBasicDetail = async (id: string) => {
    try {
      setLoading(true);
      const response = await apiClient.post('/admin/getCustomerBasicDetail', { customerId: id });
      setBasicInfo(response.data.data || {});
    } catch (error) {
      message.error('Failed to load customer details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPresetById = async (presetId: string) => {
    try {
      const response = await apiClient.post('/admin/getPresetById', { presetId });
      const fields = response.data.data.fields || [];
      setPresetFields(fields);
    } catch (error) {
      message.error('Failed to load preset details.');
    }
  };

  const handlePresetChange = async (value: string) => {
    setSelectedPreset(value);
    await fetchPresetById(value);
    if (customerId) await fetchCustomerBasicDetail(customerId);
  };

  const handleOk = async () => {
    if (!selectedPreset) return message.error("Please select a preset.");
    if (!customerId) return message.error("Customer ID is missing.");
    if (presetFields.length === 0) return message.error("Selected preset has no fields.");

    // Filter out basic info fields - they are automatically included by getIntroFieldValues
    // Basic info fields have id starting with "basic-" and don't need to be stored in IntroFields
    const fields = presetFields
      .filter(field => {
        // Skip basic info fields (they're automatically included, don't need to be sent)
        if (typeof field.id === 'string' && field.id.startsWith('basic-')) {
          return false;
        }
        return true;
      })
      .map(field => ({
        fieldId: field.id,
        fieldsFor: field.Kind?.toLowerCase() === 'preference' ? 'Preferences' : 'Profile',
        AllowEdit: field.AllowEdit ?? true,  // Default to true if not specified
        isRequired: field.Required ?? false,  // Default to false if not specified
      }));


    const payload = {
      expiration: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days
      profileImage: basicInfo?.imagePath || "https://default-image-url.com",
      customerId,
      fields,
      presetId: selectedPreset, // Include the preset ID
    };

    try {
      const response = await apiClient.post("/admin/createIntro", payload);
      if (response.data.success) {
        if (!customerId) {
          message.error("Customer ID is missing. Cannot proceed with sending intro email.");
          return;
        }
        setIntroData({
          introId: response.data.data.intro.introId,
          link: response.data.data.intro.link,
          customerId: customerId, // Store customerId in introData
        });
        onClose(); // Close the SendIntro modal
      } else {
        message.error(response.data.message || "Failed to create intro.");
      }
    } catch (error) {
      message.error("Failed to create intro.");
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchGroups();
      if (customerId) fetchCustomerBasicDetail(customerId);
    }
  }, [isOpen]);

  return (
    <div>
      <Modal open={isOpen} onCancel={onClose} onOk={handleOk} title="Send Intro">
        <div>
          <label>Select Preset:</label>
          <Select
            style={{ width: '100%', marginBottom: '1rem' }}
            placeholder="Choose a preset"
            value={selectedPreset}
            onChange={handlePresetChange}
          >
            {groups.map(group => (
              <Option key={group._id} value={group._id}>
                {group.name}
              </Option>
            ))}
          </Select>

          {loading && <Spin />}

          {!loading && basicInfo && (
            <div style={{ border: '1px solid #eee', padding: '1rem', borderRadius: '8px' }}>
              <h4>Customer Basic Info</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Avatar size={64} src={basicInfo.imagePath || undefined}>
                  {basicInfo.firstName?.[0] || 'C'}
                </Avatar>
                <div>
                  <p><strong>Name:</strong> {`${basicInfo.firstName || ''} ${basicInfo.middelName || ''} ${basicInfo.lastName || ''}`}</p>
                  <p><strong>Created At:</strong> {basicInfo.createdAt ? new Date(basicInfo.createdAt).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {introData && introData.customerId && (
        <SendMailForIntro
          link={introData.link}
          customerId={introData.customerId}
          isOpen={!!introData && !!introData.customerId}
          onClose={() => setIntroData(null)}
        />
      )}
    </div>
  );
};

export default SendIntro;
