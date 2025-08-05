import { useEffect, useState, Fragment } from 'react';
import { Card, Divider, DatePicker, message } from 'antd';
import { LinkOutlined } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import apiClient from '../../../config/apiClient';
import dayjs from 'dayjs';
import { HiBadgeCheck } from 'react-icons/hi';

const ClientIntro = () => {
    const location = useLocation();
    const { introId } = location.state || {};

    const [intro, setIntro] = useState<any>(null);
    const [fields, setFields] = useState<any[]>([]);
    const [editingExpiration, setEditingExpiration] = useState(false);
    const [newExpiration, setNewExpiration] = useState<dayjs.Dayjs | null>(null);
    const [isExpired, setIsExpired] = useState(false);

    const [copied, setCopied] = useState(false);

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
                                onChange={(date) => setNewExpiration(date)}
                                onOpenChange={(open) => {
                                    if (!open && newExpiration) {
                                        handleExpirationChange(newExpiration);
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
                                        <Fragment key={f.fieldName}>
                                            <div className="font-medium text-gray-600">{f.fieldName}</div>
                                            <div>{f.value}</div>
                                        </Fragment>
                                    ))}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientIntro;