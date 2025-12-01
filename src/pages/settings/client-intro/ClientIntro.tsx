import { useEffect, useState, Fragment } from 'react';
import { Card, Divider, DatePicker, message, Input, Select, InputNumber } from 'antd';
import { LinkOutlined, EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import apiClient, { updateCustomerProfile, updateCustomerMatchPreferencesDetail } from '../../../config/apiClient';
import dayjs from 'dayjs';
import { HiBadgeCheck } from 'react-icons/hi';

const ClientIntro = () => {
  const { introId } = useParams();

    const [intro, setIntro] = useState<any>(null);
    const [fields, setFields] = useState<any[]>([]);
    const [editingExpiration, setEditingExpiration] = useState(false);
    const [newExpiration, setNewExpiration] = useState<dayjs.Dayjs | null>(null);
    const [isExpired, setIsExpired] = useState(false);
    const [copied, setCopied] = useState(false);
    const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
    const [editingValue, setEditingValue] = useState<string>('');
    const [saving, setSaving] = useState(false);

    // Helper function to check if a value is an image URL
    const isImageUrl = (value: any): boolean => {
        if (!value || typeof value !== 'string') return false;
        const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i;
        return urlPattern.test(value);
    };

    const handleCopy = () => {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(intro.link)
                .then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                })
                .catch((err) => {
                    console.error("Clipboard API failed, using fallback", err);
                    fallbackCopyTextToClipboard(intro.link);
                });
        } else {
            fallbackCopyTextToClipboard(intro.link);
        }
    };

    const fallbackCopyTextToClipboard = (text: string) => {
        const textArea = document.createElement("textarea");
        textArea.value = text;

        // Avoid scrolling to bottom
        textArea.style.position = "fixed";
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.width = "2em";
        textArea.style.height = "2em";
        textArea.style.padding = "0";
        textArea.style.border = "none";
        textArea.style.outline = "none";
        textArea.style.boxShadow = "none";
        textArea.style.background = "transparent";

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            const successful = document.execCommand("copy");
            if (successful) {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        } catch (err) {
            console.error("Fallback copy failed", err);
        }

        document.body.removeChild(textArea);
    };

    useEffect(() => {
        if (!introId) return;
        apiClient
            .post('/admin/getIntroFieldValues', { introId })
            .then((res) => {
                if (res.data.success) {
                    const introData = res.data.intro;
                    setIntro(introData);
                    setFields(res.data.fields);

                    // Check if the intro is expired
                    const expirationDate = dayjs(introData.expiration);
                    const currentDate = dayjs();
                    setIsExpired(currentDate.isAfter(expirationDate));
                }
            })
            .catch((err) => console.error(err));
    }, [introId]);

    const handleExpirationChange = async (date: dayjs.Dayjs) => {
        try {
            const formattedDate = date.toISOString();
            await apiClient.post('/admin/updateIntroExpiration', {
                introId,
                newExpiration: formattedDate,
            });
            setIntro((prev: any) => ({
                ...prev,
                expiration: formattedDate,
            }));

            // Update expired status after changing expiration
            const currentDate = dayjs();
            setIsExpired(currentDate.isAfter(date));

            message.success('Expiration updated successfully');
        } catch (err) {
            console.error(err);
            message.error('Failed to update expiration');
        } finally {
            setEditingExpiration(false);
        }
    };

    const handleEditField = (field: any) => {
        // Check if field has fieldId (required for editing)
        if (!field.fieldId) {
            message.warning('This field cannot be edited');
            return;
        }
        // Check if editing is explicitly disabled
        if (field.AllowEdit === false) {
            message.warning('This field is not editable');
            return;
        }
        // Check if required metadata exists for saving
        if (field.fieldsFor === 'Profile' && !field.groupId) {
            message.error('Field metadata missing. Cannot edit this field.');
            return;
        }
        if (field.fieldsFor === 'Preferences' && !field.preferencesGroupId) {
            message.error('Field metadata missing. Cannot edit this field.');
            return;
        }
        setEditingFieldId(field.fieldId);
        setEditingValue(field.value || '');
    };

    const handleCancelEdit = () => {
        setEditingFieldId(null);
        setEditingValue('');
    };

    const handleSaveField = async (field: any) => {
        // Validate field has required properties
        if (!field.fieldId) {
            message.error('Invalid field. Cannot save.');
            return;
        }

        // Validate required fields
        if (field.isRequired && !editingValue?.trim()) {
            message.error(`${field.fieldName} is required`);
            return;
        }

        // Validate metadata exists
        if (field.fieldsFor === 'Profile' && !field.groupId) {
            message.error('Field metadata missing. Cannot save.');
            return;
        }
        if (field.fieldsFor === 'Preferences' && !field.preferencesGroupId) {
            message.error('Field metadata missing. Cannot save.');
            return;
        }

        setSaving(true);
        try {
            if (field.fieldsFor === 'Profile') {
                // Update profile field
                const payload = {
                    customerId: intro.customerId,
                    profileValue: [{
                        groupId: field.groupId,
                        groupFields: [{
                            fieldID: field.fieldId,
                            fieldValue: editingValue || ''  // Ensure value is string
                        }]
                    }]
                };
                const res = await updateCustomerProfile(payload);
                if (res.success) {
                    message.success('Field updated successfully');
                    // Refresh fields
                    const response = await apiClient.post('/admin/getIntroFieldValues', { introId });
                    if (response.data.success) {
                        setFields(response.data.fields);
                    }
                    setEditingFieldId(null);
                    setEditingValue('');
                } else {
                    message.error(res.message || 'Failed to update field');
                }
            } else if (field.fieldsFor === 'Preferences') {
                // Update preference field
                const payload = {
                    customerId: intro.customerId,
                    matchPreferences: [{
                        preferencesGroupId: field.preferencesGroupId,
                        groupFields: [{
                            fieldId: field.fieldId,
                            fieldValue: editingValue || ''  // Ensure value is string
                        }]
                    }]
                };
                const res = await updateCustomerMatchPreferencesDetail(payload);
                if (res.success) {
                    message.success('Field updated successfully');
                    // Refresh fields
                    const response = await apiClient.post('/admin/getIntroFieldValues', { introId });
                    if (response.data.success) {
                        setFields(response.data.fields);
                    }
                    setEditingFieldId(null);
                    setEditingValue('');
                } else {
                    message.error(res.message || 'Failed to update field');
                }
            } else {
                message.error('Unknown field type');
            }
        } catch (error: any) {
            console.error('Error updating field:', error);
            message.error(error.response?.data?.message || 'Failed to update field');
        } finally {
            setSaving(false);
        }
    };

    const renderFieldInput = (field: any) => {
        if (editingFieldId !== field.fieldId) {
            return null;
        }

        const fieldType = field.fieldsFor === 'Profile' ? field.attributeType : field.profileField;
        const options = field.fieldsFor === 'Profile' ? (field.attributeOption || []) : (field.choices || []);

        switch (fieldType) {
            case 'select':
            case 'radio':
                return (
                    <Select
                        value={editingValue}
                        onChange={setEditingValue}
                        style={{ width: '100%' }}
                        options={options.length > 0 ? options.map((opt: string) => ({ label: opt, value: opt })) : []}
                        placeholder="Select an option"
                        autoFocus
                    />
                );
            case 'date':
                return (
                    <Input
                        type="date"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        autoFocus
                    />
                );
            case 'number':
                return (
                    <InputNumber
                        value={editingValue ? Number(editingValue) : undefined}
                        onChange={(value) => setEditingValue(value?.toString() || '')}
                        style={{ width: '100%' }}
                        placeholder="Enter a number"
                        autoFocus
                    />
                );
            case 'text':
            default:
                return (
                    <Input
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onPressEnter={() => handleSaveField(field)}
                        placeholder={field.isRequired ? `${field.fieldName} (required)` : `Enter ${field.fieldName}`}
                        autoFocus
                    />
                );
        }
    };

    if (!intro) return <div>Loading...</div>;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="bg-gray-50 p-6">
                <h2 className="text-xl font-semibold text-gray-800">
                    Intro ID {intro.introId}
                </h2>

                <div className="bg-gray-200 rounded-md px-6 py-4 mt-4 flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                    <div className="text-gray-700 text-sm">
                        Recipients: {intro.sentCount} sent / {intro.viewed} viewed / {intro.total} total
                    </div>

                    <div className="text-sm text-gray-700">
                        Expiration:{' '}
                        {editingExpiration ? (
                            <DatePicker
                                value={newExpiration}
                                onChange={(date) => {
                                    if (date) {
                                        setNewExpiration(date);
                                        handleExpirationChange(date);
                                    }
                                }}
                                autoFocus
                            />
                        ) : isExpired ? (
                            <span className="text-red-600 font-semibold">
                                Expired ({dayjs(intro.expiration).format('DD MMM YYYY')})
                            </span>
                        ) : (
                            <span
                                onClick={() => {
                                    setNewExpiration(dayjs(intro.expiration));
                                    setEditingExpiration(true);
                                }}
                                className="underline cursor-pointer text-blue-600 hover:text-blue-500"
                            >
                                {dayjs(intro.expiration).format('DD MMM YYYY')}
                            </span>
                        )}
                    </div>

                    <div className="text-sm text-gray-700">
                        Created: {dayjs(intro.createdAt).format('DD MMM YYYY h:mm A')}
                    </div>

                    <div
                        className="text-sm text-blue-600 cursor-pointer hover:underline flex items-center gap-1"
                        onClick={handleCopy}
                    >
                        <LinkOutlined />
                        {copied ? 'Copied!' : 'Copy intro link'}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden mt-6">
                <div className="flex flex-col md:flex-row">
                    {/* Left side - Image */}
                    <div className="md:w-1/2">
                        <img
                            src={intro.profileImage}
                            alt="Profile"
                            className="w-full max-h-[500px] object-cover mx-auto"
                        />
                    </div>

                    {/* Right side - Profile Info */}
                    <div className="md:w-1/2 p-6 relative">
                        <Card bordered={false} className="shadow-none">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="text-gray-600 font-medium">Verified Profile</div>
                                <HiBadgeCheck className="text-blue-500 text-4xl" />
                            </div>

                            <Divider />

                            <h3 className="text-lg font-semibold mb-4">Profile</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                {fields
                                    .filter((f) => f.fieldsFor === 'Profile' && f.value)
                                    .map((f) => (
                                        <Fragment key={f.fieldId || f.fieldName}>
                                            <div className="font-medium text-gray-600 flex items-center gap-2">
                                                {f.fieldName}
                                                {f.isRequired && <span className="text-red-500">*</span>}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {editingFieldId === f.fieldId ? (
                                                    <div className="flex-1 flex items-center gap-2">
                                                        {renderFieldInput(f)}
                                                        <CheckOutlined
                                                            className="text-green-500 cursor-pointer hover:text-green-700"
                                                            onClick={() => handleSaveField(f)}
                                                            disabled={saving}
                                                        />
                                                        <CloseOutlined
                                                            className="text-red-500 cursor-pointer hover:text-red-700"
                                                            onClick={handleCancelEdit}
                                                        />
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex-1">
                                                            {isImageUrl(f.value) ? (
                                                                <img
                                                                    src={f.value}
                                                                    alt={f.fieldName}
                                                                    className="max-w-full h-auto max-h-32 object-contain rounded"
                                                                    onError={(e) => {
                                                                        e.currentTarget.style.display = 'none';
                                                                    }}
                                                                />
                                                            ) : (
                                                                f.value
                                                            )}
                                                        </div>
                                                        {f.fieldId && f.AllowEdit !== false && (
                                                            <EditOutlined
                                                                className="text-blue-500 cursor-pointer hover:text-blue-700"
                                                                onClick={() => handleEditField(f)}
                                                                title="Edit field"
                                                            />
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </Fragment>
                                    ))}
                            </div>
                            {fields.filter((f) => f.fieldsFor === 'Preferences' && f.value).length > 0 && (
                                <>
                                    <Divider />
                                    <h3 className="text-lg font-semibold mb-4">Preferences</h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        {fields
                                            .filter((f) => f.fieldsFor === 'Preferences' && f.value)
                                            .map((f) => (
                                                <Fragment key={f.fieldId || f.fieldName}>
                                                    <div className="font-medium text-gray-600 flex items-center gap-2">
                                                        {f.fieldName}
                                                        {f.isRequired && <span className="text-red-500">*</span>}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {editingFieldId === f.fieldId ? (
                                                            <div className="flex-1 flex items-center gap-2">
                                                                {renderFieldInput(f)}
                                                                <CheckOutlined
                                                                    className="text-green-500 cursor-pointer hover:text-green-700"
                                                                    onClick={() => handleSaveField(f)}
                                                                    disabled={saving}
                                                                />
                                                                <CloseOutlined
                                                                    className="text-red-500 cursor-pointer hover:text-red-700"
                                                                    onClick={handleCancelEdit}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="flex-1">{f.value}</div>
                                                                {f.fieldId && f.AllowEdit !== false && (
                                                                    <EditOutlined
                                                                        className="text-blue-500 cursor-pointer hover:text-blue-700"
                                                                        onClick={() => handleEditField(f)}
                                                                        title="Edit field"
                                                                    />
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </Fragment>
                                            ))}
                                    </div>
                                </>
                            )}
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientIntro;