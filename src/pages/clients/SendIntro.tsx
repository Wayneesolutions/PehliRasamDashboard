import React, { useEffect, useState } from 'react';
import { Modal, Select, message, Spin, Avatar } from 'antd';
import apiClient from '../../config/apiClient';
import SendMailForIntro from './SendMailForIntro'; // Import SendMailForIntro component

const { Option } = Select;

interface Props {
  customerId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

interface Group {
  _id: string;
  name: string;
  formFields: any[];
}

const SendIntro: React.FC<Props> = ({ customerId, isOpen, onClose }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string | undefined>();
  const [basicInfo, setBasicInfo] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [introData, setIntroData] = useState<{ introId: string; link: string } | null>(null); // To store introId and link

  // Fetch presets
  const fetchGroupsWithFields = async () => {
    try {
      const response = await apiClient.get("/admin/getAllPresetsWithFields");
      const formatted = response.data.data.map((group: any) => ({
        _id: group._id,
        name: group.name,
        formFields: group.fields || [],
      }));
      setGroups(formatted);
    } catch (error) {
      message.error("Failed to load group fields.");
    }
  };

  // Fetch basic info for customer
  const fetchCustomerBasicDetail = async (id: string) => {
    try {
      setLoading(true);
      const response = await apiClient.post('/admin/getCustomerBasicDetail', {
        customerId: id,
      });
      setBasicInfo(response.data.data || {});
    } catch (error) {
      message.error('Failed to load customer details.');
    } finally {
      setLoading(false);
    }
  };

  const handlePresetChange = async (value: string) => {
    setSelectedPreset(value);

    if (customerId) {
      await fetchCustomerBasicDetail(customerId);
    }
  };

  const handleOk = async () => {
    if (!selectedPreset) {
      message.error("Please select a preset.");
      return;
    }

    if (!customerId) {
      message.error("Customer ID is missing");
      return;
    }

    const selectedGroup = groups.find(group => group._id === selectedPreset);

    if (!selectedGroup) {
      message.error("Selected preset group not found.");
      return;
    }

    const presetFields = selectedGroup.formFields || [];

    if (presetFields.length === 0) {
      message.error("Selected preset has no fields.");
      return;
    }

    // Use group.name to determine fieldsFor
    let fieldsFor = "";
    const groupName = selectedGroup.name?.toLowerCase() || "";

    if (groupName.includes("profile")) fieldsFor = "Profile";
    else if (groupName.includes("preference")) fieldsFor = "Preferences";

    const fields = presetFields.map(field => ({
      fieldId: field._id,
      fieldsFor,
    }));

    const payload = {
      expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      profileImage: basicInfo?.imagePath || "https://default-image-url.com",
      customerId,
      fields,
    };

    try {
      const response = await apiClient.post("/admin/createIntro", payload);
      if (response.data.success) {

        setIntroData({
          introId: response.data.data.intro.introId,
          link: response.data.data.intro.link,
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
    fetchGroupsWithFields();
    if (customerId) fetchCustomerBasicDetail(customerId);
  }, [isOpen]);

  return (
    <div>
      <Modal
        open={isOpen}
        onCancel={onClose}
        onOk={handleOk}
        title="Send Intro"
      >
        <div>
          <label>Select Preset:</label>
          <Select
            style={{ width: '100%', marginBottom: '1rem' }}
            placeholder="Choose a preset"
            value={selectedPreset}
            onChange={handlePresetChange}
          >
            {groups.map((group) => (
              <Option key={group._id} value={group._id}>
                {group.name}
              </Option>
            ))}
          </Select>

          {/* Show loading spinner */}
          {loading && <Spin />}

          {/* Show basic info if available */}
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

      {introData && (
        <SendMailForIntro
          link={introData.link}
          customerId={customerId!}
          isOpen={!!introData}
          onClose={() => setIntroData(null)}
        />
      )}
    </div>
  );
};

export default SendIntro;

