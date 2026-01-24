import { useEffect, useState } from 'react';
import { Table, Space, Typography, Spin } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import apiClient from '../../../config/apiClient';
import { useNavigate } from 'react-router-dom';


const { Title } = Typography;

const Index = () => {
    const navigate = useNavigate();

    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await apiClient.get('/admin/getAllIntroSummaries');
                if (response.data && Array.isArray(response.data.data)) {
                    // Sort by createdAt descending (newest first) as backup
                    const sortedData = [...response.data.data].sort((a, b) => {
                        const dateA = new Date(a.createdAt).getTime();
                        const dateB = new Date(b.createdAt).getTime();
                        return dateB - dateA; // Descending order (newest first)
                    });
                    setData(sortedData);
                } else {
                    console.error('Unexpected response format', response.data);
                    setData([]);
                }
            } catch (error) {
                console.error('Failed to fetch intro summaries:', error);
                setData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const columns = [
        {
            title: 'Intro ID',
            dataIndex: 'introId',
            key: 'introId',
            render: (text: string) => <a>{text}</a>,
        },
        {
            title: 'Introducing Clients',
            dataIndex: 'customerName',
            key: 'customerName',
            render: (text: string, record: any) => {
                const customerId = record.customerId;
                if (customerId) {
                    const profileUrl = `/dashboard/add-client?customerId=${customerId}`;
                    return (
                        <Space>
                            <a
                                href={profileUrl}
                                className="font-medium hover:underline cursor-pointer"
                                style={{ color: '#2C7BE5' }}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    window.open(profileUrl, '_blank', 'noopener,noreferrer');
                                }}
                            >
                                {text}
                            </a>
                        </Space>
                    );
                }
                return <Space>{text}</Space>;
            },
        },
        {
            title: 'Stats',
            dataIndex: 'stats',
            key: 'stats',
            render: (text: string) => <Space>{text}</Space>,
        },
        {
            title: 'Created',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (text: string) => (
                <Space>{new Date(text).toLocaleString()}</Space>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: any) => (
                <Space>
                    <a
                        onClick={() =>
                           navigate(`/dashboard/client-intro/${record.introId}`)
                        }
                        title="View Profile"
                    >
                        <EyeOutlined />
                    </a>
                </Space>
            ),
        }

    ];

    return (
        <div>
            <Title level={3}>One-Way Intros</Title>
            {loading ? (
                <Spin size="large" />
            ) : (
                <Table
                    columns={columns}
                    dataSource={data}
                    pagination={false}
                    rowKey="introId"
                />
            )}
        </div>
    );
};

export default Index;
