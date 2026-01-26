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

    // Helper function to calculate age from date string
    const calculateAge = (dateString: string): number | null => {
        if (!dateString || typeof dateString !== 'string' || dateString === "NaN") return null;
        
        try {
            const birth = new Date(dateString);
            if (isNaN(birth.getTime())) return null;
            
            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            const monthDiff = today.getMonth() - birth.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            return age >= 0 ? age : null;
        } catch (error) {
            console.error('Error calculating age:', error);
            return null;
        }
    };

    // Helper function to format birthday with age
    const formatBirthdayWithAge = (fieldName: string, value: any): any => {
        // Check if this is the Birthday (Age) field - handle variations in field name
        const normalizedFieldName = (fieldName || '').trim().toLowerCase();
        const isBirthdayField = normalizedFieldName.includes('birthday') && normalizedFieldName.includes('age');
        
        if (isBirthdayField && value && typeof value === 'string') {
            const age = calculateAge(value);
            if (age !== null) {
                return `${value} (${age})`;
            }
        }
        return value;
    };

    // Helper function to format age and height ranges to show "any" when opposite field is empty
    const formatRangeValue = (fieldName: string, value: any): string => {
        if (!value || typeof value !== 'string') return value || '';
        
        const normalizedFieldName = (fieldName || '').trim().toLowerCase();
        const isAgeRange = normalizedFieldName.includes('age') && normalizedFieldName.includes('range');
        const isHeightRange = normalizedFieldName.includes('height');
        
        if (isAgeRange || isHeightRange) {
            // Handle formats like "12 -" (from only), " - 30" (to only), or "12 - 30" (both)
            const trimmedValue = value.trim();
            
            // Split by " - " pattern (with spaces)
            if (trimmedValue.includes(" - ")) {
                const parts = trimmedValue.split(" - ");
                const from = (parts[0] || "").trim();
                const to = (parts[1] || "").trim();
                
                if (from && !to) {
                    return `${from} - any`;
                } else if (!from && to) {
                    return `any - ${to}`;
                } else if (from && to) {
                    return `${from} - ${to}`;
                }
            }
            // Handle "12 -" or "12 - " format (from only)
            else if (trimmedValue.match(/^\d+[\s'-]/) || trimmedValue.match(/^[4-7]'[\d"]+\s*-/)) {
                const match = trimmedValue.match(/^([^-\s]+)\s*-/);
                const from = match ? match[1].trim() : trimmedValue.replace(/\s*-+\s*.*$/, "").trim();
                return `${from} - any`;
            }
            // Handle " - 30" or " -30" format (to only)
            else if (trimmedValue.match(/^\s*-/)) {
                const to = trimmedValue.replace(/^\s*-+\s*/, "").trim();
                return `any - ${to}`;
            }
        }
        
        return value;
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

    // Field order mapping based on structured API response from getCustomerProfileDetail
    const fieldOrderMap: Record<string, Record<string, number>> = {
        "Membership Information": {
            "Profile Note": 1,
            "Membership Type": 2,
            "Profile Made By": 3,
            "Registered On Date": 4,
            "Special Notes About Profile": 5,
            "Customer Service (Matchmaker)": 6,
            "Registered By": 7,
            "Amount & Currency": 8,
            "Appearance": 9,
            "Verified Profile": 10,
        },
        "Basic Information": {
            "Gender": 1,
            "Religion": 2,
            "Caste": 3,
            "Sub Caste": 4,
            "Birthday (Age)": 5,
            "Time Of Birth": 6,
            "Height (ft & in)": 7,
            "Marital Status": 8,
            "More about Martial status": 9,
            "Vegetarian": 10,
            "Do you Drink Alcohol?": 11,
            "Do you smoke?": 12,
            "Phone Number": 13,
            "FirstName": 14,
            "First Name": 14,
        },
        "Education & Profession": {
            "Education": 1,
            "Job or Professions ": 2,
            "Income": 3,
            "Profession": 4,
        },
        "Family Details": {
            "Family Affluence Level": 1,
            "Father's Employment": 2,
            "Mother's Employment": 3,
            "Other Family Details": 4,
            "Father Name": 5,
            "Mother Name": 6,
        },
        "Location Details": {
            "Residency Status": 1,
            "Living in Since (year)": 2,
            "Country Living": 3,
            "CountryGrewUpIn": 4,
        },
        "About Me": {
            "Property Details": 1,
            "Image": 2,
        },
        "Match Preferences ( Partner Requirement  )": {
            "Preferred Gender": 1,
            "Preferred Age Range": 2,
            "Preferred Height (ft & in)": 3,
            "Preferred Religion": 4,
            "Preferred Caste": 5,
            "Employment Preferences": 6,
            "City Preferred": 7,
            "Preferred Appearance": 8,
            "Marital Status Preference": 9,
            "Education Preferrence": 10,
            "Vegetarian Preferrence": 11,
            "Drink Alcohol Preferrence": 12,
            "Residency Preference": 13,
        },
    };

    // Keep fields in the same order as the add-client form by sorting with backend-provided groupOrder
    const groupFieldsByOrder = useMemo(
        () => (fields: any[]) => {
            const groupsMap = new Map<
                string,
                { key: string; name: string; order: number; items: any[] }
            >();

            // Preserve original field order by tracking index
            fields.forEach((field, originalIndex) => {
                // Use groupName as the primary key for grouping (consistent with Form page)
                const groupName =
                    field.groupName ||
                    field.preferencesGroupName ||
                    (field.fieldsFor === "Profile" ? "Profile" : "Preferences") ||
                    "Other";

                // Use groupName as the key for consistent grouping
                const groupKey = groupName;

                // Get groupOrder from field, default to 999 if not provided
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

                // Add field with original index to preserve order
                groupsMap.get(groupKey)!.items.push({ ...field, _originalIndex: originalIndex });
            });

            // Sort groups by order, then sort fields within each group by field order map
            const sortedGroups = Array.from(groupsMap.values())
                .sort((a, b) => a.order - b.order)
                .map(group => {
                    // Find matching group in fieldOrderMap (handle variations)
                    const normalizeGroupNameForLookup = (name: string): string => {
                        return name.toLowerCase().trim().replace(/\s+/g, " ");
                    };
                    
                    const groupNameNormalized = normalizeGroupNameForLookup(group.name || "");
                    let groupFieldOrder: Record<string, number> = {};
                    
                    // Try exact match first
                    if (fieldOrderMap[group.name || ""]) {
                        groupFieldOrder = fieldOrderMap[group.name || ""];
                    } else {
                        // Try normalized match
                        const matchingKey = Object.keys(fieldOrderMap).find(key => 
                            normalizeGroupNameForLookup(key) === groupNameNormalized
                        );
                        if (matchingKey) {
                            groupFieldOrder = fieldOrderMap[matchingKey];
                        }
                    }
                    
                    // Helper to normalize field names (handles typos like "Preferrence" vs "Preference")
                    const normalizeForMatching = (name: string): string => {
                        if (!name) return "";
                        return name.trim()
                            .replace(/\s*\(\s*/g, " (")
                            .replace(/\s*\)\s*/g, ") ")
                            .replace(/\s+/g, " ")
                            .replace(/preferrence/gi, "preference") // Fix typo
                            .trim()
                            .toLowerCase();
                    };
                    
                    // Create a comprehensive lookup map
                    const orderLookup = new Map<string, number>();
                    Object.entries(groupFieldOrder).forEach(([key, value]) => {
                        // Add exact key (case-sensitive)
                        orderLookup.set(key, value);
                        
                        // Add lowercase version
                        const keyLower = key.toLowerCase().trim();
                        orderLookup.set(keyLower, value);
                        
                        // Add normalized (spaces normalized, lowercase)
                        const normalized = key.trim().replace(/\s+/g, " ").toLowerCase();
                        orderLookup.set(normalized, value);
                        
                        // Add version with parentheses normalized
                        const parenNormalized = key.trim()
                            .replace(/\s*\(\s*/g, " (")
                            .replace(/\s*\)\s*/g, ") ")
                            .replace(/\s+/g, " ")
                            .trim()
                            .toLowerCase();
                        orderLookup.set(parenNormalized, value);
                        
                        // Add normalized with typo fix
                        const typoFixed = normalizeForMatching(key);
                        orderLookup.set(typoFixed, value);
                        
                        // Add version without parentheses content (for "Preferred Height" matching)
                        const withoutParens = key.replace(/\s*\([^)]*\)\s*/g, "").trim().toLowerCase();
                        if (withoutParens && withoutParens !== normalized) {
                            orderLookup.set(withoutParens, value);
                        }
                    });
                    
                    // Skip sorting for preferences groups - we'll sort them in the rendering section
                    const isPreferencesGroup = group.items.some((item: any) => item.fieldsFor === "Preferences");
                    
                    if (isPreferencesGroup) {
                        // For preferences, maintain original order - will be sorted in rendering
                        return {
                            ...group,
                            items: group.items // Don't sort here
                        };
                    }
                    
                    return {
                        ...group,
                        items: group.items.sort((a: any, b: any) => {
                            const aFieldName = normalizeForMatching(a.fieldName || "");
                            const bFieldName = normalizeForMatching(b.fieldName || "");
                            
                            // Try multiple matching strategies in order of specificity
                            const aExact = (a.fieldName || "").trim();
                            const bExact = (b.fieldName || "").trim();
                            
                            // Try exact match first (most specific)
                            let aOrder = orderLookup.get(aExact);
                            let bOrder = orderLookup.get(bExact);
                            
                            // Try lowercase exact match
                            if (aOrder === undefined) {
                                aOrder = orderLookup.get(aExact.toLowerCase());
                            }
                            if (bOrder === undefined) {
                                bOrder = orderLookup.get(bExact.toLowerCase());
                            }
                            
                            // Try normalized match
                            if (aOrder === undefined) {
                                aOrder = orderLookup.get(aFieldName);
                            }
                            if (bOrder === undefined) {
                                bOrder = orderLookup.get(bFieldName);
                            }
                            
                            // Try without parentheses content
                            if (aOrder === undefined) {
                                const aWithoutParens = aExact.replace(/\s*\([^)]*\)\s*/g, "").trim().toLowerCase();
                                aOrder = orderLookup.get(aWithoutParens);
                            }
                            if (bOrder === undefined) {
                                const bWithoutParens = bExact.replace(/\s*\([^)]*\)\s*/g, "").trim().toLowerCase();
                                bOrder = orderLookup.get(bWithoutParens);
                            }
                            
                            // Default to 999 if not found
                            aOrder = aOrder ?? 999;
                            bOrder = bOrder ?? 999;
                            
                            // If both have valid orders, sort by order
                            if (aOrder !== 999 && bOrder !== 999) {
                                return aOrder - bOrder;
                            }
                            // If only one has valid order, prioritize it
                            if (aOrder !== 999) return -1;
                            if (bOrder !== 999) return 1;
                            // Fallback to original index
                            return (a._originalIndex || 0) - (b._originalIndex || 0);
                        })
                    };
                });

            return sortedGroups;
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

                    // Only use fields returned by the API (these are the preset fields from IntroFields)
                    // The API already filters to only return fields that are part of the preset group
                    // Basic info fields are only included if they're in the selected preset
                    const apiFields = res.data.fields || [];
                    
                    // Filter fields with valid values only
                    const validFields = apiFields.filter((field: any) => 
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
                            {(() => {
                                // Separate Profile and Preferences fields
                                const profileGroups = groupedFields.filter((group) => 
                                    group.items.some((item: any) => item.fieldsFor === "Profile")
                                );
                                const preferencesGroups = groupedFields.filter((group) => 
                                    group.items.some((item: any) => item.fieldsFor === "Preferences")
                                );

                                // Reorder Profile groups: Membership Information first, About Me last, others in middle
                                // Define explicit group order based on Form.tsx sequence
                                const groupOrderMap: Record<string, number> = {
                                    "membership information": 1,
                                    "basic information": 2,
                                    "education & profession": 3,
                                    "family details": 4,
                                    "location details": 5,
                                    "about me": 999, // Last
                                };
                                
                                // Sort all profile groups by explicit order, then by groupOrder for unknown groups
                                const sortedByOrder = [...profileGroups].sort((a, b) => {
                                    const aName = a.name?.toLowerCase().trim() || "";
                                    const bName = b.name?.toLowerCase().trim() || "";
                                    const aOrder = groupOrderMap[aName] ?? a.order;
                                    const bOrder = groupOrderMap[bName] ?? b.order;
                                    return aOrder - bOrder;
                                });
                                
                                const membershipInfo = sortedByOrder.find(g => {
                                    const name = g.name?.toLowerCase().trim() || "";
                                    return name === "membership information";
                                });
                                const aboutMe = sortedByOrder.find(g => {
                                    const name = g.name?.toLowerCase().trim() || "";
                                    return name === "about me";
                                });
                                const middleProfileGroups = sortedByOrder.filter(g => {
                                    const name = g.name?.toLowerCase().trim() || "";
                                    return name !== "membership information" && name !== "about me";
                                });
                                
                                const sortedProfileGroups = [
                                    ...(membershipInfo ? [membershipInfo] : []),
                                    ...middleProfileGroups,
                                    ...(aboutMe ? [aboutMe] : [])
                                ];

                                // Extract FirstName and LastName to show at top
                                const firstNameField = sortedProfileGroups
                                    .flatMap(g => g.items.filter((item: any) => item.fieldsFor === "Profile"))
                                    .find((item: any) => {
                                        const name = (item.fieldName || "").toLowerCase().trim();
                                        return name === "firstname" || name === "first name";
                                    });
                                
                                const lastNameField = sortedProfileGroups
                                    .flatMap(g => g.items.filter((item: any) => item.fieldsFor === "Profile"))
                                    .find((item: any) => {
                                        const name = (item.fieldName || "").toLowerCase().trim();
                                        return name === "lastname" || name === "last name";
                                    });

                                // Remove FirstName and LastName from their groups
                                const profileGroupsWithoutNameFields = sortedProfileGroups.map(group => ({
                                    ...group,
                                    items: group.items.filter((item: any) => {
                                        if (item.fieldsFor !== "Profile") return true;
                                        const name = (item.fieldName || "").toLowerCase().trim();
                                        return name !== "firstname" && name !== "first name" && 
                                               name !== "lastname" && name !== "last name";
                                    })
                                }));

                                let itemIndex = 0;

                                return (
                                    <>
                                        {/* Render FirstName and LastName at top if they exist */}
                                        {firstNameField && (
                                            <div className={`flex justify-between py-2 px-2 ${
                                                itemIndex++ % 2 === 0 ? "bg-white" : "bg-gray-50"
                                            } md:flex-row flex-col`}>
                                                <div className="text-gray-500 capitalize">
                                                    {firstNameField.fieldName.replace(/([A-Z])/g, " $1")}
                                                </div>
                                                <div className="font-medium">{firstNameField.value}</div>
                                            </div>
                                        )}
                                        {lastNameField && (
                                            <div className={`flex justify-between py-2 px-2 ${
                                                itemIndex++ % 2 === 0 ? "bg-white" : "bg-gray-50"
                                            } md:flex-row flex-col`}>
                                                <div className="text-gray-500 capitalize">
                                                    {lastNameField.fieldName.replace(/([A-Z])/g, " $1")}
                                                </div>
                                                <div className="font-medium">{lastNameField.value}</div>
                                            </div>
                                        )}

                                        {/* Render Profile fields */}
                                        {profileGroupsWithoutNameFields.map((group) => {
                                            // Filter profile items - they're already sorted by fieldOrderMap in groupFieldsByOrder
                                            const profileItems = group.items.filter((item: any) => item.fieldsFor === "Profile");
                                            if (profileItems.length === 0) return null;

                                            return (
                                                <div key={group.key}>
                                                    {profileItems.map((item, idx) => {
                                                        const currentIndex = itemIndex++;
                                                        return (
                                                            <div
                                                                key={`${group.key}-${idx}`}
                                                                className={`flex justify-between py-2 px-2 ${
                                                                    currentIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
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
                                                                        formatBirthdayWithAge(item.fieldName, item.value)
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })}

                                        {/* Render Preferences heading and fields */}
                                        {preferencesGroups.length > 0 && (() => {
                                            // Collect ALL preference items from ALL groups first
                                            const allPreferenceItems: any[] = [];
                                            preferencesGroups.forEach((group) => {
                                                const preferenceItems = group.items
                                                    .filter((item: any) => item.fieldsFor === "Preferences")
                                                    .map((item: any) => ({ ...item }));
                                                allPreferenceItems.push(...preferenceItems);
                                            });
                                            
                                            // Get the preferences field order map
                                            const normalizeGroupName = (name: string): string => {
                                                return name.toLowerCase().trim().replace(/\s+/g, " ");
                                            };
                                            
                                            // Find matching group in fieldOrderMap
                                            let groupFieldOrder: Record<string, number> = {};
                                            for (const group of preferencesGroups) {
                                                if (fieldOrderMap[group.name || ""]) {
                                                    groupFieldOrder = fieldOrderMap[group.name || ""];
                                                    break;
                                                } else {
                                                    const groupNameNormalized = normalizeGroupName(group.name || "");
                                                    const matchingKey = Object.keys(fieldOrderMap).find(key => 
                                                        normalizeGroupName(key) === groupNameNormalized
                                                    );
                                                    if (matchingKey) {
                                                        groupFieldOrder = fieldOrderMap[matchingKey];
                                                        break;
                                                    }
                                                }
                                            }
                                            
                                            // If still not found, try "Match Preferences ( Partner Requirement  )"
                                            if (Object.keys(groupFieldOrder).length === 0) {
                                                groupFieldOrder = fieldOrderMap["Match Preferences ( Partner Requirement  )"] || {};
                                            }
                                            
                                            // Create order lookup map with multiple variations
                                            const orderLookup = new Map<string, number>();
                                            
                                            // Helper to normalize field names (handles typos like "Preferrence" vs "Preference")
                                            const normalizeForMatching = (name: string): string => {
                                                if (!name) return "";
                                                return name.trim()
                                                    .replace(/\s*\(\s*/g, " (")
                                                    .replace(/\s*\)\s*/g, ") ")
                                                    .replace(/\s+/g, " ")
                                                    .replace(/preferrence/gi, "preference") // Fix typo
                                                    .replace(/ft\s*&\s*in/gi, "ft & in") // Normalize "Ft & In" to "ft & in"
                                                    .trim()
                                                    .toLowerCase();
                                            };
                                            
                                            Object.entries(groupFieldOrder).forEach(([key, value]) => {
                                                // Add exact key (case-sensitive)
                                                orderLookup.set(key, value);
                                                
                                                // Add lowercase version
                                                const keyLower = key.toLowerCase().trim();
                                                orderLookup.set(keyLower, value);
                                                
                                                // Add normalized (spaces normalized, lowercase)
                                                const normalized = key.trim().replace(/\s+/g, " ").toLowerCase();
                                                orderLookup.set(normalized, value);
                                                
                                                // Add version with parentheses normalized
                                                const parenNormalized = key.trim()
                                                    .replace(/\s*\(\s*/g, " (")
                                                    .replace(/\s*\)\s*/g, ") ")
                                                    .replace(/\s+/g, " ")
                                                    .replace(/ft\s*&\s*in/gi, "ft & in") // Normalize "Ft & In" to "ft & in"
                                                    .trim()
                                                    .toLowerCase();
                                                orderLookup.set(parenNormalized, value);
                                                
                                                // Add normalized with typo fix
                                                const typoFixed = normalizeForMatching(key);
                                                orderLookup.set(typoFixed, value);
                                                
                                                // Add version without parentheses content (for "Preferred Height" matching)
                                                const withoutParens = key.replace(/\s*\([^)]*\)\s*/g, "").trim().toLowerCase();
                                                if (withoutParens && withoutParens !== normalized) {
                                                    orderLookup.set(withoutParens, value);
                                                }
                                                
                                                // Add version with case variations in parentheses (Ft & In, FT & IN, etc.)
                                                const parenContent = key.match(/\(([^)]+)\)/);
                                                if (parenContent) {
                                                    const parenText = parenContent[1];
                                                    const parenVariations = [
                                                        parenText.toLowerCase(),
                                                        parenText.toUpperCase(),
                                                        parenText.replace(/\b\w/g, (l) => l.toUpperCase()), // Title Case
                                                    ];
                                                    parenVariations.forEach(variation => {
                                                        const keyWithVariation = key.replace(/\([^)]+\)/, `(${variation})`).trim().toLowerCase();
                                                        orderLookup.set(keyWithVariation, value);
                                                    });
                                                }
                                            });
                                            
                                            // Sort ALL preference items together by fieldOrderMap
                                            const sortedPreferenceItems = [...allPreferenceItems].sort((a: any, b: any) => {
                                                const aFieldName = normalizeForMatching(a.fieldName || "");
                                                const bFieldName = normalizeForMatching(b.fieldName || "");
                                                
                                                // Try multiple matching strategies in order of specificity
                                                const aExact = (a.fieldName || "").trim();
                                                const bExact = (b.fieldName || "").trim();
                                                
                                                // Try exact match first (most specific)
                                                let aOrder = orderLookup.get(aExact);
                                                let bOrder = orderLookup.get(bExact);
                                                
                                                // Try lowercase exact match
                                                if (aOrder === undefined) {
                                                    aOrder = orderLookup.get(aExact.toLowerCase());
                                                }
                                                if (bOrder === undefined) {
                                                    bOrder = orderLookup.get(bExact.toLowerCase());
                                                }
                                                
                                                // Try normalized match
                                                if (aOrder === undefined) {
                                                    aOrder = orderLookup.get(aFieldName);
                                                }
                                                if (bOrder === undefined) {
                                                    bOrder = orderLookup.get(bFieldName);
                                                }
                                                
                                                // Try without parentheses content
                                                if (aOrder === undefined) {
                                                    const aWithoutParens = aExact.replace(/\s*\([^)]*\)\s*/g, "").trim().toLowerCase();
                                                    aOrder = orderLookup.get(aWithoutParens);
                                                }
                                                if (bOrder === undefined) {
                                                    const bWithoutParens = bExact.replace(/\s*\([^)]*\)\s*/g, "").trim().toLowerCase();
                                                    bOrder = orderLookup.get(bWithoutParens);
                                                }
                                                
                                                // Try with normalized parentheses content (handle "Ft & In" vs "ft & in")
                                                if (aOrder === undefined) {
                                                    const aWithNormalizedParens = aExact
                                                        .replace(/\(([^)]+)\)/, (_match: string, content: string) => {
                                                            return `(${content.toLowerCase().replace(/ft\s*&\s*in/gi, "ft & in")})`;
                                                        })
                                                        .trim()
                                                        .toLowerCase();
                                                    aOrder = orderLookup.get(aWithNormalizedParens);
                                                }
                                                if (bOrder === undefined) {
                                                    const bWithNormalizedParens = bExact
                                                        .replace(/\(([^)]+)\)/, (_match: string, content: string) => {
                                                            return `(${content.toLowerCase().replace(/ft\s*&\s*in/gi, "ft & in")})`;
                                                        })
                                                        .trim()
                                                        .toLowerCase();
                                                    bOrder = orderLookup.get(bWithNormalizedParens);
                                                }
                                                
                                                // Default to 999 if not found
                                                aOrder = aOrder ?? 999;
                                                bOrder = bOrder ?? 999;
                                                
                                                // If both have valid orders, sort by order
                                                if (aOrder !== 999 && bOrder !== 999) {
                                                    return aOrder - bOrder;
                                                }
                                                // If only one has valid order, prioritize it
                                                if (aOrder !== 999) return -1;
                                                if (bOrder !== 999) return 1;
                                                // Fallback to original index
                                                return (a._originalIndex || 0) - (b._originalIndex || 0);
                                            });
                                            
                                            if (sortedPreferenceItems.length === 0) return null;
                                            
                                            return (
                                                <>
                                                    <div className="text-lg font-semibold mt-4 mb-2 text-gray-700">
                                                        Preferences
                                                    </div>
                                                    {sortedPreferenceItems.map((item, idx) => {
                                                        const currentIndex = itemIndex++;
                                                        return (
                                                            <div
                                                                key={`pref-${idx}`}
                                                                className={`flex justify-between py-2 px-2 ${
                                                                    currentIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
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
                                                                        formatRangeValue(item.fieldName, item.value)
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </>
                                            );
                                        })()}
                                    </>
                                );
                            })()}
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