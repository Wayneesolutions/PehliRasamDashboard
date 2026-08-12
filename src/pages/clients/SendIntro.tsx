import React, { useEffect, useState } from 'react';
import { Modal, Select, message, Spin, Avatar } from 'antd';
import apiClient from '../../config/apiClient';
import SendMailForIntro from './SendMailForIntro';

const { Option } = Select;

interface Props {
  customerId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onFullyDone?: () => void;
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

const SendIntro: React.FC<Props> = ({ customerId, isOpen, onClose, onFullyDone }) => {
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
    // Capture customerId immediately — onClose() will wipe the prop before React re-renders
    const currentCustomerId = customerId;
    if (!currentCustomerId) return message.error("Customer ID is missing.");
    if (presetFields.length === 0) return message.error("Selected preset has no fields.");

    const fields = presetFields
      .filter(field => {
        if (typeof field.id === 'string' && field.id.startsWith('basic-')) {
          return false;
        }
        return true;
      })
      .map(field => ({
        fieldId: field.id,
        fieldsFor: field.Kind?.toLowerCase() === 'preference' ? 'Preferences' : 'Profile',
        AllowEdit: field.AllowEdit ?? true,
        isRequired: field.Required ?? false,
      }));

    // Re-fetch basicInfo fresh at submit time to avoid stale profile image from a previous customer
    let freshBasicInfo = basicInfo;
    try {
      const res = await apiClient.post('/admin/getCustomerBasicDetail', { customerId: currentCustomerId });
      freshBasicInfo = res.data.data || basicInfo;
    } catch {
      // fall back to whatever basicInfo we already have
    }

    const payload = {
      expiration: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
      profileImage: freshBasicInfo?.imagePath || "https://default-image-url.com",
      customerId: currentCustomerId,
      fields,
      presetId: selectedPreset,
    };

    try {
      const response = await apiClient.post("/admin/createIntro", payload);
      if (response.data.success) {
        setIntroData({
          introId: response.data.data.intro.introId,
          link: response.data.data.intro.link,
          customerId: currentCustomerId,
        });
        onClose();
      } else {
        message.error(response.data.message || "Failed to create intro.");
      }
    } catch (error) {
      message.error("Failed to create intro.");
    }
  };

  useEffect(() => {
    if (isOpen && customerId) {
      // Reset stale state from previous customer before fetching fresh data
      setSelectedPreset(undefined);
      setPresetFields([]);
      setBasicInfo(null);
      fetchGroups();
      fetchCustomerBasicDetail(customerId);
    }
    if (!isOpen) {
      setSelectedPreset(undefined);
      setPresetFields([]);
      setBasicInfo(null);
    }
  }, [isOpen, customerId]);

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
          onClose={() => {
            setIntroData(null);
            onFullyDone?.();
          }}
        />
      )}
    </div>
  );
};

export default SendIntro;
