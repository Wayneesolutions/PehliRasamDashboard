import { useState, useEffect, ChangeEvent } from 'react';
import { Card, Input, Button, message, Spin, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadChangeParam, UploadFile } from 'antd/es/upload/interface';
import apiClient from '../../config/apiClient';
import { uploadFile } from '../../config/apiClient';

interface FormDataState {
    firstName: string;
    lastName: string;
    number: string;
    email: string;
    profilePicUrl: string | null;
}

const BasicInfoTab = () => {
    const [formData, setFormData] = useState<FormDataState>({
        firstName: '',
        lastName: '',
        number: '',
        email: '',
        profilePicUrl: null,
    });

    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = async (info: UploadChangeParam<UploadFile<any>>) => {
        const file = info.file.originFileObj as File;

        if (!file) {
            message.error("No file selected or invalid file.");
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                setImagePreview(e.target.result as string);
            }
        };
        reader.readAsDataURL(file);

        // Upload file
        const imageForm = new FormData();
        imageForm.append('file', file);

        try {
            const uploadRes = await uploadFile(imageForm);
            if (uploadRes?.url) {
                setFormData((prev) => ({ ...prev, profilePicUrl: uploadRes.url }));
                message.success("Profile image uploaded successfully");
            } else {
                message.error("Image upload failed");
            }
        } catch (error) {
            message.error("Upload failed. Please try again.");
            console.error(error);
        }
    };


    const fetchAdminDetails = async () => {
        setLoading(true);
        try {
            const storedData = JSON.parse(localStorage.getItem('admin') || '{}');
            const userId = storedData.id || storedData._id;

            if (!userId) {
                message.error('User ID is missing. Please log in again.');
                return;
            }

            const { data } = await apiClient.post('/admin/adminDetail', { userId });

            setFormData({
                firstName: data.admin.firstName || '',
                lastName: data.admin.lastName || '',
                number: data.admin.number || '',
                email: data.admin.email || '',
                profilePicUrl: data.admin.profilePic || null,
            });

            setImagePreview(data.admin.profilePic || null);
            localStorage.setItem('admin', JSON.stringify({ ...storedData, ...data.admin }));
        } catch (error: unknown) {
            const errorMessage = (error as any)?.response?.data?.message || 'Failed to load admin details.';
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdminDetails();
    }, []);

    const handleUpdate = async () => {
        setLoading(true);
        try {
            const storedData = JSON.parse(localStorage.getItem('admin') || '{}');
            const userId = storedData.id || storedData._id;

            if (!userId) {
                message.error('User ID is missing. Please log in again.');
                return;
            }

            // Prepare payload, filtering out empty values
            const rawPayload = {
                userId,
                firstName: formData.firstName,
                lastName: formData.lastName,
                number: String(formData.number),
                email: formData.email,
                profilePic: formData.profilePicUrl,
            };

            // Remove keys with null/empty string values (except userId)
            const payload: Record<string, any> = {};
            for (const [key, value] of Object.entries(rawPayload)) {
                if (key === 'userId' || (value !== '' && value !== null)) {
                    payload[key] = value;
                }
            }

            const response = await apiClient.post('/admin/updateAdminBasicDetails', payload);
            message.success(response.data.message || 'Details updated successfully');

            localStorage.setItem('admin', JSON.stringify({ ...storedData, ...formData }));
        } catch (error: unknown) {
            const errorMessage = (error as any)?.response?.data?.error || 'Failed to update details';
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };


    return (
        <Spin spinning={loading}>
            <Card className="mb-4 p-6">
                <div className="flex flex-col items-center gap-4">
                    <Upload
                        accept="image/*"
                        onChange={handleFileChange}
                        showUploadList={false}
                        maxCount={1}
                    >
                        <Button icon={<UploadOutlined />}>Upload Profile Picture</Button>
                    </Upload>


                    {imagePreview && (
                        <img
                            src={imagePreview}
                            alt="Profile"
                            className="h-24 w-24 rounded-full mt-2 border p-1"
                        />
                    )}
                </div>
            </Card>

            <Card className="mb-4 p-6">
                <div className="grid gap-4">
                    <Input placeholder="First Name" name="firstName" value={formData.firstName} onChange={handleChange} />
                    <Input placeholder="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} />
                    <Input placeholder="Phone" name="number" value={formData.number} onChange={handleChange} />
                    <Input placeholder="Email" name="email" value={formData.email} onChange={handleChange} />
                </div>
                <Button type="primary" className="!mt-4 w-full" onClick={handleUpdate} loading={loading}>
                    Update Profile
                </Button>
            </Card>
        </Spin>
    );
};

export default BasicInfoTab;
