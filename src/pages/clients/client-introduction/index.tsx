import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card } from "antd";
import logo from "../../../components/images/logo.png";
import apiClient from "../../../config/apiClient";
import { HiBadgeCheck } from 'react-icons/hi';
import dayjs from "dayjs";

const ClientIntroduction = () => {
    const { introId } = useParams();
    const [intro, setIntro] = useState<any>(null);
    const [groupedFields, setGroupedFields] = useState<Record<string, any[]>>({});
    const [isExpired, setIsExpired] = useState(false);
    const [loading, setLoading] = useState(true);

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
        return fields.filter(field => {
            const key = `${field.fieldName}-${field.value}`;
            if (seen.has(key)) {
                return false;
            }
            seen.set(key, true);
            return true;
        });
    };

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

                    // Group fields by fieldsFor
                    const groups: Record<string, any[]> = {};
                    uniqueFields.forEach((field: any) => {
                        const key = field.fieldsFor || "Other";
                        if (!groups[key]) groups[key] = [];
                        groups[key].push(field);
                    });
                    
                    setGroupedFields(groups);
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
                            className="w-full h-full object-contain rounded-lg border-[5px] border-white"
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
                            {Object.entries(groupedFields).map(([group, items]) => (
                                <div key={group}>
                                    <div className="text-md font-semibold text-blue-700 border-b border-gray-200 py-2 px-2 bg-gray-100">
                                        {group}
                                    </div>
                                    {items.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex justify-between py-2 px-2 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                                                } md:flex-row flex-col`}
                                        >
                                            <div className="text-gray-500 capitalize">
                                                {item.fieldName.replace(/([A-Z])/g, ' $1')}
                                            </div>
                                            <div className="font-medium">
                                                {isImageUrl(item.value) ? (
                                                    <img
                                                        src={item.value}
                                                        alt={item.fieldName}
                                                        className="max-w-full h-auto max-h-32 object-contain rounded"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
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
        </div>
    );
};

export default ClientIntroduction;