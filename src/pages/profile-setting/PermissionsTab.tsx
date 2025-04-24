import React, { useState, useEffect } from 'react';
import { Card, Table, Checkbox, Button, message, Spin } from 'antd';
import apiClient from '../../config/apiClient';

interface Permissions {
    [section: string]: {
        [field: string]: boolean;
    };
}

const PermissionsTab: React.FC = () => {
    const [permissions, setPermissions] = useState<Permissions>({});
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        const storedData = JSON.parse(localStorage.getItem('admin') || '{}');
        if (storedData.permissions) {
            setPermissions(storedData.permissions);
        }
    }, []);

    const handlePermissionChange = (section: string, field: string) => {
        setPermissions((prev) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: !prev[section]?.[field],
            },
        }));
    };

    const handleUpdatePermissions = async () => {
        setLoading(true);
        try {
            const storedData = JSON.parse(localStorage.getItem('admin') || '{}');
            const userId: string | undefined = storedData.id;

            if (!userId) {
                message.error('User ID is missing. Please log in again.');
                return;
            }

            const payload = { userId, permissions };
            const response = await apiClient.post('/admin/updateAdminPermission', payload);
            message.success(response.data.message || 'Permissions updated successfully');
        } catch (error: unknown) {
            if (error instanceof Error) {
                message.error(error.message || 'Failed to update permissions');
            } else {
                message.error('An unknown error occurred');
            }
        } finally {
            setLoading(false);
        }
    };

    const data = Object.keys(permissions).map((section) => ({
        key: section,
        section,
        permissions: Object.entries(permissions[section] || {}).map(([field, value]) => (
            <Checkbox
                key={field}
                checked={Boolean(value)}
                onChange={() => handlePermissionChange(section, field)}
            >
                {field}
            </Checkbox>
        )),
    }));

    const columns = [
        {
            title: 'Section',
            dataIndex: 'section',
            key: 'section',
            render: (text: string) => <span className="font-semibold">{text}</span>,
        },
        {
            title: 'Permissions',
            dataIndex: 'permissions',
            key: 'permissions',
            render: (perms: React.ReactNode) => <div className="flex flex-wrap gap-2">{perms}</div>,
        },
    ];

    return (
        <Spin spinning={loading}>
            <Card title="Permissions Management" className="mb-4">
                <Table columns={columns} dataSource={data} pagination={false} bordered />
            </Card>

            <div className="flex justify-end mt-4">
                <Button type="primary" onClick={handleUpdatePermissions}>
                    Save Changes
                </Button>
            </div>
        </Spin>
    );
};

export default PermissionsTab;