import { useState, useEffect, ChangeEvent } from 'react';
import { Card, Input, Button, message, Spin, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import apiClient from '../../config/apiClient';
import type { UploadChangeParam, UploadFile } from 'antd/es/upload/interface';

interface FormDataState {
    firstName: string;
    lastName: string;
    number: string;
    email: string;
    password: string;
    profilePic: File | null;
}

const BasicInfoTab = () => {
    const [formData, setFormData] = useState<FormDataState>({
        firstName: '',
        lastName: '',
        number: '',
        email: '',
        password: '',
        profilePic: null,
    });

    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (info: UploadChangeParam<UploadFile<any>>) => {
        const file = info.file.originFileObj as File;

        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                setImagePreview(e.target.result as string);
            }
        };
        reader.readAsDataURL(file);
        setFormData((prev) => ({ ...prev, profilePic: file }));
    };



    const fetchAdminDetails = async () => {
        setLoading(true);
        try {
            const storedData = JSON.parse(localStorage.getItem('admin') || '{}');
            const userId = storedData.id;

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
                password: '',
                profilePic: null,
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
            const userId = storedData.id;

            if (!userId) {
                message.error('User ID is missing. Please log in again.');
                return;
            }

            const payload = new FormData();
            payload.append('userId', userId);

            Object.entries(formData).forEach(([key, value]) => {
                if (key !== 'email' && key !== 'password' && value !== null) {
                    payload.append(key, value as string | Blob);
                }
            });

            if (formData.password) {
                payload.append('password', formData.password);
            }

            const response = await apiClient.post('/admin/updateAdminBasicDetails', payload, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

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
            <Card className="p-6 mb-4">
                <div className="flex flex-col items-center gap-4">
                    <Upload beforeUpload={() => false} onChange={handleFileChange} showUploadList={false}>
                        <Button icon={<UploadOutlined />}>Upload Profile Picture</Button>
                    </Upload>

                    {imagePreview && (
                        <img src={imagePreview} alt="Profile" className="w-24 h-24 p-1 mt-2 border rounded-full" />
                    )}
                </div>
            </Card>
            <Card className="p-6 mb-4">
                <div className="grid gap-4">
                    <Input placeholder="First Name" name="firstName" value={formData.firstName} onChange={handleChange} />
                    <Input placeholder="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} />
                    <Input placeholder="Phone" name="number" value={formData.number} onChange={handleChange} />

                    <Input placeholder="Email" name="email" value={formData.email} disabled />
                    <Input.Password placeholder="New Password (leave empty to keep current)" name="password" value={formData.password} onChange={handleChange} />
                </div>
                <Button type="primary" className="w-full mt-4" onClick={handleUpdate} loading={loading}>
                    Update Profile
                </Button>
            </Card>
        </Spin>
    );
};

export default BasicInfoTab;
