import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, Modal } from "antd";
import logo from "../../../components/images/logo.png";
import apiClient from "../../../config/apiClient";
import { HiBadgeCheck } from "react-icons/hi";
import dayjs from "dayjs";

const ClientIntroduction = () => {
    const { introId } = useParams();
    const [intro, setIntro] = useState<any>(null);
    const [groupedFields, setGroupedFields] = useState<Array<{ key: string; name: string; order: number; items: any[] }>>([]);
    const [isExpired, setIsExpired] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Helper function to check if a value is valid (not null, empty, undefined, or "NaN")
    const isValidValue = (value: any) => {
        if (value === null || value === undefined || value === "") return false;
        if (typeof value === "string" && (value.trim() === "" || value === "NaN")) return false;
        return true;
    };

    // Helper function to check if a value is an image URL
    const isImageUrl = (value: any): boolean => {
        if (!value || typeof value !== 'string') return false;
        const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i;
        return urlPattern.test(value);
    };

    // Helper function to remove duplicates based on fieldName and value
    const removeDuplicates = (fields: any[]) => {
        const seen = new Map();
        return fields.filter((field) => {
            const key = `${field.fieldName}-${field.value}`;
            if (seen.has(key)) {
                return false;
            }
            seen.set(key, true);
            return true;
        });
    };

    // Keep fields in the same order as the add-client form by sorting with backend-provided groupOrder and creation order
    const groupFieldsByOrder = useMemo(
        () => (fields: any[]) => {
            const groupsMap = new Map<
                string,
                { key: string; name: string; order: number; items: any[] }
            >();

            fields.forEach((field) => {
                const groupKey =
                    field.groupId ||
                    field.preferencesGroupId ||
                    field.groupName ||
                    field.preferencesGroupName ||
                    field.fieldsFor ||
                    "Other";

                const groupName =
                    field.groupName ||
                    field.preferencesGroupName ||
                    (field.fieldsFor === "Profile" ? "Profile" : "Preferences");

                const groupOrder =
                    typeof field.groupOrder === "number" ? field.groupOrder : 999;

                if (!groupsMap.has(groupKey)) {
                    groupsMap.set(groupKey, {
                        key: groupKey,
                        name: groupName,
                        order: groupOrder,
                        items: [],
                    });
                }

                groupsMap.get(groupKey)!.items.push(field);
            });

            return Array.from(groupsMap.values()).sort((a, b) => a.order - b.order);
        },
        []
    );

    useEffect(() => {
        if (!introId) {
            setLoading(false);
            return;
        }

        apiClient
            .post("/admin/getIntroFieldValues", { introId })
            .then((res) => {
                if (res.data.success) {
                    const introData = res.data.intro;

                    // Check expiration first - compare current date with expiration date
                    const expirationDate = dayjs(introData.expiration);
                    const currentDate = dayjs();

                    if (currentDate.isAfter(expirationDate)) {
                        setIsExpired(true);
                        setLoading(false);
                        return;
                    }

                    setIntro(introData);

                    // Filter fields with valid values only
                    const validFields = (res.data.fields || []).filter((field: any) => 
                        isValidValue(field.value)
                    );

                    // Remove duplicates
                    const uniqueFields = removeDuplicates(validFields);

                    const orderedGroups = groupFieldsByOrder(uniqueFields);
                    setGroupedFields(orderedGroups);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setIsExpired(true);
                setLoading(false);
            });
    }, [introId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
                <div className="bg-white shadow-md rounded-lg p-8 max-w-md text-center">
                    <p className="text-gray-700">Loading...</p>
                </div>
            </div>
        );
    }

    if (isExpired) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
                <div className="bg-white shadow-md rounded-lg p-8 max-w-md text-center">
                    <h2 className="text-2xl font-semibold text-red-600 mb-4">Page Not Found</h2>
                    <p className="text-gray-700 mb-2">The page you are looking for is not found.</p>
                    <p className="text-gray-500 text-sm">This introduction link may have expired or is no longer accessible.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-[#f8fafc] flex justify-center items-center p-8 overflow-hidden">
            {/* Background Diagonal Shape */}
            <div className="absolute top-70 left-0 w-full h-[300px] bg-[rgb(216,226,239)] transform -skew-y-10 origin-top-left z-0"></div>

            {/* Content Container */}
            <div className="relative z-10 flex flex-col md:flex-row gap-2 w-[90%] mx-auto items-start">
                {/* Left - Image */}
                <div className="flex justify-center items-start w-full md:w-1/2">
                    <div className="w-full md:w-[300px] !h-[450px] md:h-[200px] overflow-hidden flex justify-center items-center p-2">
                        <img
                            src={
                                intro?.profileImage && intro.profileImage !== ""
                                    ? intro.profileImage
                                    : "https://cdn-icons-png.flaticon.com/512/847/847969.png"
                            }
                            alt="Profile"
                            onError={(e) => {
                                e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/847/847969.png";
                            }}
                            onClick={() => {
                                if (intro?.profileImage && intro.profileImage !== "") {
                                    setSelectedImage(intro.profileImage);
                                }
                            }}
                            className={`w-full h-full object-contain rounded-lg border-[5px] border-white ${
                                intro?.profileImage && intro.profileImage !== ""
                                    ? "cursor-pointer hover:opacity-90 transition-opacity duration-200"
                                    : ""
                            }`}
                        />
                    </div>
                </div>

                {/* Right - Profile Card */}
                <div className="flex justify-center items-stretch w-full md:w-1/2">
                    <Card
                        title={
                            <div className="flex justify-between items-center">
                                <div className="text-lg font-semibold">Profile</div>
                                <img src={logo} alt="Logo" className="w-20 mb-3 mt-3 ml-auto" />
                            </div>
                        }
                        className="rounded-lg shadow-md w-full flex flex-col justify-between"
                    >
                        {/* Verified Section */}
                        <div className="flex justify-between items-center mb-4">
                            <div className="text-gray-600 font-medium">Verified Profile</div>
                            <HiBadgeCheck className="text-blue-500 text-4xl" />
                        </div>

                        {/* Profile Details Grouped */}
                        <div className="text-sm flex-grow">
                            {groupedFields.map((group) => (
                                <div key={group.key}>
                                    {group.items.map((item, idx) => (
                                        <div
                                            key={`${group.key}-${idx}`}
                                            className={`flex justify-between py-2 px-2 ${
                                                idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                                            } md:flex-row flex-col`}
                                        >
                                            <div className="text-gray-500 capitalize">
                                                {item.fieldName.replace(/([A-Z])/g, " $1")}
                                            </div>
                                            <div className="font-medium">
                                                {isImageUrl(item.value) ? (
                                                    <img
                                                        src={item.value}
                                                        alt={item.fieldName}
                                                        className="max-w-full h-auto max-h-32 object-contain rounded cursor-pointer hover:opacity-90 transition-opacity duration-200 shadow-sm hover:shadow-md"
                                                        onClick={() => setSelectedImage(item.value)}
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = "none";
                                                        }}
                                                    />
                                                ) : (
                                                    item.value
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Image Modal */}
            <Modal
                open={!!selectedImage}
                onCancel={() => setSelectedImage(null)}
                footer={null}
                centered
                width="90%"
                style={{ maxWidth: '1200px' }}
                className="image-modal"
                closeIcon={
                    <div className="text-white bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-2 transition-all duration-200">
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </div>
                }
                styles={{
                    content: {
                        padding: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    },
                    body: {
                        padding: 0,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '80vh',
                    },
                }}
            >
                {selectedImage && (
                    <div className="relative w-full h-full flex items-center justify-center p-4">
                        <img
                            src={selectedImage}
                            alt="Full size"
                            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                            onError={(e) => {
                                e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/847/847969.png";
                            }}
                        />
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ClientIntroduction;