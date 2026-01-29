import { message, Spin, Tabs, Collapse, Select } from "antd";
import { useEffect, useState, useRef } from "react";
import { getCustomerMatchPreferencesDetail, getCustomerProfileDetail, uploadImage, updateCustomerProfile, updateCustomerMatchPreferencesDetail } from "../../config/apiClient";
import { Group, MatchGroup } from "../clientsForm/types/clientTypes";
import { useOutletContext } from "react-router-dom";

const { Panel } = Collapse;
const { TabPane } = Tabs;

interface IField {
    fieldId: string;
    fieldName: string;
    value?: string;
    fieldValueOptions: any;
    attributeType: string;
}

interface IGroup {
    groupId: string;
    groupName: string;
    fields: IField[];
}

interface ContextType {
    customerId: string;
}

interface FormProps {
    customerId?: string;
}

const Form: React.FC<FormProps> = ({ customerId }) => {
    const context = useOutletContext<ContextType>();
    const resolvedCustomerId = customerId || context?.customerId;
    const [recentlyUpdatedFieldId, setRecentlyUpdatedFieldId] = useState<string | null>(null);

    const [formData, setFormData] = useState<IGroup[]>([]);
    const [matchdata, setMatchData] = useState<MatchGroup[]>([]);
    const [loading, setLoading] = useState(false);
    const [ageRangeInputs, setAgeRangeInputs] = useState<Record<string, { from: string; to: string }>>({});
    const updatingGroupsRef = useRef<Set<string>>(new Set());
    const ageRangeSaveTimersRef = useRef<Record<string, NodeJS.Timeout>>({});
    const pendingNotificationsRef = useRef<Set<string>>(new Set());
    const [activePanels, setActivePanels] = useState<string[]>([
        ...formData.map((group) => group.groupId),
        ...matchdata.map((group) => group.groupId),
    ]);

    useEffect(() => {
        const allGroupIds = [
            ...formData.map((group) => group.groupId),
            ...matchdata.map((group) => group.groupId),
        ];
        setActivePanels(allGroupIds);
    }, [formData, matchdata]);

    useEffect(() => {
        if (customerId) {
            async function getCustomerMatch() {
                const res = await getCustomerMatchPreferencesDetail({ customerId: resolvedCustomerId });

                if (res.success) setMatchData(res.data);
            }
            getCustomerMatch();
        }
    }, [customerId]);

    const fetchCustomerMatchPreferences = async () => {
        try {
            const res = await getCustomerMatchPreferencesDetail({ customerId: resolvedCustomerId });
            if (res.success) {
                setMatchData(res.data);
            } else {
                message.error("Failed to fetch matching preferences.");
            }
        } catch {
            message.error("Something went wrong while fetching preferences.");
        }
    };

    useEffect(() => {
        if (customerId) {
            fetchCustomerMatchPreferences();
        }
    }, [customerId]);

    // Sync age range inputs when matchdata changes
    // IMPORTANT: Preserve user-entered values when server response is empty/NaN
    useEffect(() => {
        setAgeRangeInputs((prev) => {
            const newAgeRangeInputs: Record<string, { from: string; to: string }> = { ...prev };
            matchdata.forEach((group) => {
                group.fields.forEach((field) => {
                    if (field.profileField?.trim()?.toLowerCase() === "date") {
                        const serverValue = field.value;
                        const hasValidServerValue = serverValue && serverValue !== "NaN" && serverValue.trim() !== "";
                        
                        if (hasValidServerValue) {
                            // Server has a valid value - sync from server
                            // Handle formats like "12 -" (from only), " - 30" (to only), or "12 - 30" (both)
                            const trimmedValue = serverValue.trim();
                            let fromValue = "";
                            let toValue = "";
                            
                            // Split by " - " pattern (with spaces)
                            if (trimmedValue.includes(" - ")) {
                                const parts = trimmedValue.split(" - ");
                                fromValue = (parts[0] || "").trim();
                                toValue = (parts[1] || "").trim();
                            }
                                                            // Handle "12 -" or "12 - " format (from only) - dash at the end without "to" value
                            else if (trimmedValue.match(/^\d+\s*-/)) {
                                // Extract number before dash - match pattern like "12 -" or "12 - "
                                const match = trimmedValue.match(/^(\d+)\s*-/);
                                fromValue = match ? match[1] : trimmedValue.replace(/\s*-+\s*.*$/, "").trim();
                                toValue = "";
                            }
                            // Handle " - 30" or " -30" format (to only)
                            else if (trimmedValue.match(/^\s*-/)) {
                                fromValue = "";
                                // Extract number after dash
                                toValue = trimmedValue.replace(/^\s*-+\s*/, "").trim();
                            }
                            // Fallback: try to split by any dash pattern
                            else {
                                const parts = trimmedValue.split(/\s*-\s*/);
                                fromValue = (parts[0] || "").trim();
                                toValue = (parts[1] || "").trim();
                            }
                            
                            // Always update with server values when available
                            newAgeRangeInputs[field.fieldId] = {
                                from: fromValue,
                                to: toValue,
                            };
                        } else {
                            // Server value is empty/NaN - preserve existing user-entered values
                            // Only initialize empty if this is a new field we haven't seen before
                            if (!prev[field.fieldId] || (!prev[field.fieldId].from && !prev[field.fieldId].to)) {
                                // No existing value - set to empty (but don't overwrite if there was a value)
                                if (!prev[field.fieldId]) {
                                    newAgeRangeInputs[field.fieldId] = {
                                        from: "",
                                        to: "",
                                    };
                                }
                                // If prev[field.fieldId] exists with values, keep it (already in newAgeRangeInputs from spread)
                            }
                            // If prev has values (from or to), they are preserved via the spread operator above
                        }
                    }
                });
            });
            return newAgeRangeInputs;
        });
    }, [matchdata]);

    useEffect(() => {
        if (!resolvedCustomerId) return;

        setLoading(true);
        const fetchData = async () => {
            try {
                const [profileRes, matchRes] = await Promise.all([
                    getCustomerProfileDetail(resolvedCustomerId),
                    getCustomerMatchPreferencesDetail({ customerId: resolvedCustomerId })
                ]);

                // Handle profile
                if (Array.isArray(profileRes.data)) {
                    const formattedData = profileRes.data.map((group: Group) => ({
                        groupId: group.groupId || "MISSING_GROUP_ID",
                        groupName: group.groupName,
                        fields: Array.isArray(group.fields)
                            ? group.fields.map((field: any) => ({
                                fieldId: field.fieldId || "MISSING_FIELD_ID",
                                fieldName: field.fieldName || "Unknown Field",
                                fieldValueOptions: field.attributeOption || [],
                                value: field.value === "NaN" ? "" : field.value || "",
                                attributeType: field.attributeType || "text",
                            }))
                            : [],
                    }));
                    setFormData(formattedData);
                }

                // Handle match preferences
                if (matchRes.success) setMatchData(matchRes.data);

            } catch (err) {
                message.error("Failed to load data.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [resolvedCustomerId]);

    // Fixed: Generate payload with current form data state
    const generateFullPayload = (currentFormData: IGroup[]) => {
        return {
            customerId: resolvedCustomerId,
            profileValue: currentFormData
                .map((group) => {
                    const filledFields = group.fields
                        .map((field) => {
                            let valueToSend = "";

                            if (["select", "radio", "checkbox", "Image"].includes(field.attributeType)) {
                                valueToSend = field.value || "";
                            } else if (["text", "number", "date"].includes(field.attributeType)) {
                                valueToSend = field.value?.trim?.() || "";
                            }

                            // Don't include fields with empty values
                            if (!valueToSend || valueToSend.trim() === "") {
                                return null;
                            }

                            return {
                                fieldID: field.fieldId,
                                fieldValue: valueToSend,
                            };
                        })
                        .filter(Boolean);

                    if (filledFields.length === 0) return null;

                    return {
                        groupId: group.groupId,
                        groupFields: filledFields,
                    };
                })
                .filter(Boolean),
        };
    };

    // Fixed: Save function that accepts current state
    const saveFieldValue = async (currentFormData?: IGroup[]) => {
        const dataToUse = currentFormData || formData;
        const payload = generateFullPayload(dataToUse);

        if (payload.profileValue.length === 0) {
            message.warning("Nothing to update.");
            return;
        }

        try {
            const res = await updateCustomerProfile(payload);
            if (res.success) {
                message.success("Profile updated successfully");
                return true;
            } else {
                message.error(res.message || "Update failed");
                return false;
            }
        } catch (err) {
            message.error("Update failed");
            return false;
        }
    };

    // Fixed: Handle field change with immediate save for select fields
    const handleFieldChange = async (
        groupId: string,
        fieldId: string,
        value: string,
        shouldSaveImmediately = false
    ) => {
        const updatedFormData = formData.map((group) =>
            group.groupId === groupId
                ? {
                    ...group,
                    fields: group.fields.map((field) =>
                        field.fieldId === fieldId ? { ...field, value } : field
                    ),
                }
                : group
        );

        setFormData(updatedFormData);

        // For select, radio, checkbox, and date fields, save immediately
        if (shouldSaveImmediately) {
            await saveFieldValue(updatedFormData);
        } else {
            setRecentlyUpdatedFieldId(fieldId);
        }
    };

    useEffect(() => {
        if (!recentlyUpdatedFieldId) return;

        const group = formData.find((g) =>
            g.fields.some((f) => f.fieldId === recentlyUpdatedFieldId)
        );
        const field = group?.fields.find((f) => f.fieldId === recentlyUpdatedFieldId);

        if (field?.value?.startsWith('https://')) {
            saveFieldValue();
            setRecentlyUpdatedFieldId(null);
        }
    }, [recentlyUpdatedFieldId, formData]);

    const handleFieldSaveOnEnter = async (
        e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
        groupId: string,
        fieldId: string
    ) => {
        if (e.key === "Enter") {
            const value = (e.target as HTMLInputElement).value;
            await handleFieldChange(groupId, fieldId, value, true);
        }
    };

    if (loading) return <Spin size="large" className="flex justify-center mt-10" />;
    if (!formData.length) return <div>No data found</div>;

    return (
        <div className="p-6 bg-white shadow-md rounded-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Form Groups</h2>
            </div>

            <div className="flex w-full">
                <Tabs defaultActiveKey="1" className="w-full">
                    <TabPane tab="Profile" key="1">
                        <div className="w-full">
                            <Collapse
                                className="w-full border border-gray-200 rounded-md"
                                expandIconPosition="start"
                                activeKey={activePanels}
                                onChange={(keys) => setActivePanels(Array.isArray(keys) ? keys : [keys])}
                            >
                                {(() => {
                                    // Reorder groups: Membership Information first, About Me last, others in middle
                                    const membershipInfo = formData.find(g => g.groupName?.toLowerCase().includes("membership information"));
                                    const aboutMe = formData.find(g => g.groupName?.toLowerCase().includes("about me"));
                                    const middleGroups = formData.filter(g => {
                                        const name = g.groupName?.toLowerCase() || "";
                                        return !name.includes("membership information") && !name.includes("about me");
                                    });
                                    
                                    const sortedGroups = [
                                        ...(membershipInfo ? [membershipInfo] : []),
                                        ...middleGroups,
                                        ...(aboutMe ? [aboutMe] : [])
                                    ];
                                    
                                    return sortedGroups;
                                })().map((group) => (
                                    <Panel header={group.groupName} key={group.groupId} className="w-full">
                                        {group.fields.map((field) => (
                                            <div key={field.fieldId} className="flex mb-3">
                                                <label className="w-1/3 text-gray-600">{field.fieldName}</label>

                                                {/* Handle field types */}
                                                {(() => {
                                                    // Special case for "Profile Note" field
                                                    if (field.fieldName?.trim().toLowerCase() === "profile note") {
                                                        return (
                                                            <textarea
                                                                className="w-2/3 border p-2 rounded"
                                                                rows={4}
                                                                value={field.value || ""}
                                                                placeholder="Enter profile note"
                                                                onChange={(e) => handleFieldChange(group.groupId, field.fieldId, e.target.value)}
                                                                onKeyDown={(e) => handleFieldSaveOnEnter(e, group.groupId, field.fieldId)}
                                                            />
                                                        );
                                                    }
                                                    if (field.fieldName?.trim().toLowerCase() === "other family details") {
                                                        return (
                                                            <textarea
                                                                className="w-2/3 border p-2 rounded"
                                                                rows={4}
                                                                value={field.value || ""}
                                                                placeholder="Enter other family details"
                                                                onChange={(e) =>
                                                                    handleFieldChange(group.groupId, field.fieldId, e.target.value)
                                                                }
                                                                onKeyDown={(e) =>
                                                                    handleFieldSaveOnEnter(e, group.groupId, field.fieldId)
                                                                }
                                                            />
                                                        );
                                                    }
                                                    // Special case for "Education" field - render as textarea
                                                    if (field.fieldName?.trim().toLowerCase() === "education") {
                                                        return (
                                                            <textarea
                                                                className="w-2/3 border p-2 rounded"
                                                                rows={4}
                                                                value={field.value || ""}
                                                                placeholder="Enter education details"
                                                                onChange={(e) =>
                                                                    handleFieldChange(group.groupId, field.fieldId, e.target.value)
                                                                }
                                                                onKeyDown={(e) =>
                                                                    handleFieldSaveOnEnter(e, group.groupId, field.fieldId)
                                                                }
                                                            />
                                                        );
                                                    }
                                                    switch (field.attributeType) {
                                                        case "select":
                                                            // Special case: City field should be text input instead of select
                                                            if (field.fieldName?.trim().toLowerCase() === "city") {
                                                                return (
                                                                    <input
                                                                        type="text"
                                                                        className="w-2/3 border p-2 rounded"
                                                                        value={field.value || ""}
                                                                        name={`${group.groupId}-${field.fieldId}`}
                                                                        placeholder="Enter City"
                                                                        onChange={(e) => handleFieldChange(group.groupId, field.fieldId, e.target.value)}
                                                                        onKeyDown={(e) => handleFieldSaveOnEnter(e, group.groupId, field.fieldId)}
                                                                    />
                                                                );
                                                            }
                                                            return (
                                                                <select
                                                                    className="w-2/3 border p-2 rounded"
                                                                    value={field.value || ""}
                                                                    name={`${group.groupId}-${field.fieldId}`}
                                                                    onChange={async (e) => {
                                                                        const selectedValue = e.target.value;
                                                                        await handleFieldChange(group.groupId, field.fieldId, selectedValue, true);
                                                                    }}
                                                                >
                                                                    <option value="">Select an option</option>
                                                                    {field.fieldValueOptions.map((option: string) => (
                                                                        <option key={option} value={option}>
                                                                            {option}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            );

                                                        case "date":
                                                            // Special case: Birthday (Age) field - calculate and display age
                                                            if (field.fieldName?.trim().toLowerCase() === "birthday (age)" || field.fieldName?.trim().toLowerCase().includes("birthday")) {
                                                                const calculateAge = (birthDate: string): number | null => {
                                                                    if (!birthDate || birthDate === "NaN") return null;
                                                                    try {
                                                                        const birth = new Date(birthDate);
                                                                        const today = new Date();
                                                                        let age = today.getFullYear() - birth.getFullYear();
                                                                        const monthDiff = today.getMonth() - birth.getMonth();
                                                                        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                                                                            age--;
                                                                        }
                                                                        return age >= 0 ? age : null;
                                                                    } catch (error) {
                                                                        return null;
                                                                    }
                                                                };

                                                                const age = calculateAge(field.value || "");

                                                                return (
                                                                    <div className="w-2/3">
                                                                        <input
                                                                            type="date"
                                                                            className="w-full border p-2 rounded"
                                                                            name={`${group.groupId}-${field.fieldId}`}
                                                                            value={field.value && field.value !== "NaN" ? field.value : ""}
                                                                            placeholder="Select a date"
                                                                            onChange={async (e) => {
                                                                                const selectedDate = e.target.value;
                                                                                await handleFieldChange(group.groupId, field.fieldId, selectedDate, true);
                                                                            }}
                                                                        />
                                                                        {age !== null && (
                                                                            <div className="mt-1 text-sm text-blue-600 font-medium">
                                                                                Age: {age} {age === 1 ? 'year' : 'years'}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            }
                                                            return (
                                                                <input
                                                                    type="date"
                                                                    className="w-2/3 border p-2 rounded"
                                                                    name={`${group.groupId}-${field.fieldId}`}
                                                                    value={field.value || ""}
                                                                    placeholder="Select a date"
                                                                    onChange={async (e) => {
                                                                        const selectedDate = e.target.value;
                                                                        await handleFieldChange(group.groupId, field.fieldId, selectedDate, true);
                                                                    }}
                                                                />
                                                            );

                                                        case "number":
                                                            return (
                                                                <input
                                                                    type="number"
                                                                    className="w-2/3 border p-2 rounded"
                                                                    value={field.value || ""}
                                                                    placeholder="Enter a number"
                                                                    onChange={(e) => handleFieldChange(group.groupId, field.fieldId, e.target.value)}
                                                                    onKeyDown={(e) => handleFieldSaveOnEnter(e, group.groupId, field.fieldId)}
                                                                />
                                                            );

                                                        case "text":
                                                            return (
                                                                <input
                                                                    type="text"
                                                                    className="w-2/3 border p-2 rounded"
                                                                    value={field.value || ""}
                                                                    placeholder="Enter text"
                                                                    onChange={(e) => handleFieldChange(group.groupId, field.fieldId, e.target.value)}
                                                                    onKeyDown={(e) => handleFieldSaveOnEnter(e, group.groupId, field.fieldId)}
                                                                />
                                                            );

                                                        case "radio":
                                                            return (
                                                                <div className="w-2/3">
                                                                    {field.fieldValueOptions.map((option: string) => (
                                                                        <label key={option} className="mr-4">
                                                                            <input
                                                                                type="radio"
                                                                                name={field.fieldId}
                                                                                value={option}
                                                                                checked={field.value === option}
                                                                                onChange={async () => {
                                                                                    await handleFieldChange(group.groupId, field.fieldId, option, true);
                                                                                }}
                                                                            />
                                                                            {option}
                                                                        </label>
                                                                    ))}
                                                                </div>
                                                            );

                                                        case "checkbox":
                                                            return (
                                                                <div className="w-2/3">
                                                                    {field.fieldValueOptions.map((option: string) => {
                                                                        const currentValues = field.value?.split(",") || [];
                                                                        const checked = currentValues.includes(option);
                                                                        const newValue = checked
                                                                            ? currentValues.filter((v) => v !== option).join(",")
                                                                            : [...currentValues, option].join(",");

                                                                        return (
                                                                            <label key={option} className="mr-4">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    value={option}
                                                                                    checked={checked}
                                                                                    onChange={async () => {
                                                                                        await handleFieldChange(group.groupId, field.fieldId, newValue, true);
                                                                                    }}
                                                                                />
                                                                                {option}
                                                                            </label>
                                                                        );
                                                                    })}
                                                                </div>
                                                            );

                                                        case "Image":
                                                            return (
                                                                <div>
                                                                    {/* Show selected image if available */}
                                                                    {field.value && (
                                                                        <div style={{ marginBottom: 8 }}>
                                                                            <img
                                                                                src={field.value}
                                                                                alt="Uploaded"
                                                                                style={{ maxWidth: "150px", borderRadius: "8px" }}
                                                                            />
                                                                        </div>
                                                                    )}

                                                                    <input
                                                                        type="file"
                                                                        accept="image/*"
                                                                        placeholder="Upload an image"
                                                                        onChange={async (e) => {
                                                                            const file = e.target.files?.[0];
                                                                            if (!file) return;

                                                                            const tempUrl = URL.createObjectURL(file);
                                                                            handleFieldChange(group.groupId, field.fieldId, tempUrl);

                                                                            const uploadResult = await uploadImage(file);

                                                                            if (uploadResult?.success && uploadResult.fileUrls?.[0]) {
                                                                                await handleFieldChange(group.groupId, field.fieldId, uploadResult.fileUrls[0], true);
                                                                            } else {
                                                                                console.error("Image upload failed:", uploadResult?.message || "Unknown error");
                                                                                message.error("Image upload failed");
                                                                            }
                                                                        }}
                                                                    />
                                                                </div>
                                                            );

                                                        default:
                                                            return <span className="text-red-500">Unsupported field type</span>;
                                                    }
                                                })()}
                                            </div>
                                        ))}
                                    </Panel>
                                ))}
                            </Collapse>
                        </div>
                    </TabPane>

                    <TabPane tab="Matching Preferences" key="2">
                        <div className="w-full">
                            <Collapse
                                className="w-full border border-gray-200 rounded-md"
                                expandIconPosition="start"
                                activeKey={activePanels}
                                onChange={(keys) => setActivePanels(Array.isArray(keys) ? keys : [keys])}
                            >
                                {matchdata.map((group) => (
                                    <Panel header={group.groupName} key={group.groupId} className="w-full">
                                        {group.fields.length > 0 ? (
                                            group.fields.map((field) => {
                                                const profileField = field.profileField?.trim()?.toLowerCase();
                                                const fieldValue = field.value === "NaN" ? "" : field.value || "";
                                                const options = field.choices || [];

                                                const handleUpdate = async (updatedFieldId: string, updatedValue: any) => {
                                                    // Prevent duplicate API calls for the same group
                                                    if (updatingGroupsRef.current.has(group.groupId)) {
                                                        // Update state optimistically but skip API call
                                                        const normalizedValue = updatedValue?.toString().trim() || "";
                                                        setMatchData((prevMatchData) =>
                                                            prevMatchData.map((g) =>
                                                                g.groupId === group.groupId
                                                                    ? {
                                                                          ...g,
                                                                          fields: g.fields.map((f) =>
                                                                              f.fieldId === updatedFieldId
                                                                                  ? { ...f, value: normalizedValue }
                                                                                  : f
                                                                          ),
                                                                      }
                                                                    : g
                                                            )
                                                        );
                                                        return;
                                                    }

                                                    // Mark this group as updating and prevent duplicate notifications
                                                    updatingGroupsRef.current.add(group.groupId);
                                                    pendingNotificationsRef.current.add(group.groupId);

                                                    // Normalize the value
                                                    const normalizedValue = updatedValue?.toString().trim() || "";

                                                    // Use functional update to get current state and build payload
                                                    setMatchData((prevMatchData) => {
                                                        const currentGroup = prevMatchData.find((g) => g.groupId === group.groupId);

                                                        if (!currentGroup) {
                                                            updatingGroupsRef.current.delete(group.groupId);
                                                            pendingNotificationsRef.current.delete(group.groupId);
                                                            return prevMatchData;
                                                        }

                                                        // Build updated fields array for API payload
                                                        const updatedFields = currentGroup.fields
                                                            .map((f) => {
                                                                let fieldValue: string;
                                                                if (f.fieldId === updatedFieldId) {
                                                                    fieldValue = normalizedValue;
                                                                } else {
                                                                    const existingValue = f.value === "NaN" ? "" : (f.value || "");
                                                                    fieldValue = existingValue.trim();
                                                                }
                                                                
                                                                return {
                                                                    fieldId: f.fieldId,
                                                                    fieldValue: fieldValue,
                                                                };
                                                            })
                                                            .filter((f) => {
                                                                const value = f.fieldValue?.trim();
                                                                return value && value !== "" && value !== "NaN";
                                                            });

                                                        // Prepare payload if we have fields to update
                                                        if (updatedFields.length > 0) {
                                                            const payload = {
                                                                customerId: resolvedCustomerId,
                                                                matchPreferences: [
                                                                    {
                                                                        preferencesGroupId: group.groupId,
                                                                        groupFields: updatedFields,
                                                                    },
                                                                ],
                                                            };

                                                            // Call API asynchronously (fire and forget)
                                                            updateCustomerMatchPreferencesDetail(payload)
                                                                .then(() => {
                                                                    // Only show notification once
                                                                    if (pendingNotificationsRef.current.has(group.groupId)) {
                                                                        message.success("Preference updated successfully.");
                                                                        pendingNotificationsRef.current.delete(group.groupId);
                                                                        fetchCustomerMatchPreferences();
                                                                    }
                                                                })
                                                                .catch(() => {
                                                                    if (pendingNotificationsRef.current.has(group.groupId)) {
                                                                        message.error("Failed to update preference.");
                                                                        pendingNotificationsRef.current.delete(group.groupId);
                                                                        fetchCustomerMatchPreferences();
                                                                    }
                                                                })
                                                                .finally(() => {
                                                                    // Remove from updating set after a short delay
                                                                    setTimeout(() => {
                                                                        updatingGroupsRef.current.delete(group.groupId);
                                                                    }, 500);
                                                                });
                                                        } else {
                                                            // No fields to update, remove from updating set immediately
                                                            updatingGroupsRef.current.delete(group.groupId);
                                                            pendingNotificationsRef.current.delete(group.groupId);
                                                        }

                                                        // Return updated state optimistically
                                                        return prevMatchData.map((g) =>
                                                            g.groupId === group.groupId
                                                                ? {
                                                                      ...g,
                                                                      fields: g.fields.map((f) =>
                                                                          f.fieldId === updatedFieldId
                                                                              ? { ...f, value: normalizedValue }
                                                                              : f
                                                                      ),
                                                                  }
                                                                : g
                                                        );
                                                    });
                                                };

                                                const generateHeights = () => {
                                                    const heights = [];
                                                    for (let feet = 4; feet <= 7; feet++) {
                                                        for (let inch = 0; inch <= 11; inch++) {
                                                            heights.push(`${feet}'${inch}"`);
                                                        }
                                                    }
                                                    return heights;
                                                };

                                                const heightOptions = generateHeights();

                                                return (
                                                    <div key={`${group.groupId}-${field.fieldId}`} className="flex items-center mb-3">
                                                        <label className="w-1/3 text-gray-600">{field.fieldName}</label>

                                                        <div className="w-2/3">
                                                            {field.fieldName === "Preferred Gender" && (
                                                                <Select
                                                                    allowClear
                                                                    showSearch={false} // disable typing
                                                                    className="w-full"
                                                                    placeholder="Select gender"
                                                                    value={fieldValue}
                                                                    onChange={(value) => {
                                                                        setMatchData((prev) =>
                                                                            prev.map((g) =>
                                                                                g.groupId === group.groupId
                                                                                    ? {
                                                                                        ...g,
                                                                                        fields: g.fields.map((f) =>
                                                                                            f.fieldId === field.fieldId
                                                                                                ? { ...f, value }
                                                                                                : f
                                                                                        ),
                                                                                    }
                                                                                    : g
                                                                            )
                                                                        );
                                                                        handleUpdate(field.fieldId, value);
                                                                    }}
                                                                    options={[
                                                                        { label: "Male", value: "Male" },
                                                                        { label: "Female", value: "Female" },
                                                                    ]}
                                                                />
                                                            )}

                                                            {profileField === "date" && (() => {
                                                                // Parse fieldValue to extract from/to values
                                                                // Handle formats like "12 -" (from only), " - 30" (to only), or "12 - 30" (both)
                                                                let parsedFrom = "";
                                                                let parsedTo = "";
                                                                
                                                                if (fieldValue && fieldValue !== "NaN" && fieldValue.trim() !== "") {
                                                                    const trimmedValue = fieldValue.trim();
                                                                    
                                                                    // Split by " - " pattern (with spaces) - handles "12 - 30"
                                                                    if (trimmedValue.includes(" - ")) {
                                                                        const parts = trimmedValue.split(" - ");
                                                                        parsedFrom = (parts[0] || "").trim();
                                                                        parsedTo = (parts[1] || "").trim();
                                                                    }
                                                                    // Handle "12 -" or "12 - " format (from only) - dash at the end without "to" value
                                                                    else if (trimmedValue.match(/^\d+\s*-/)) {
                                                                        // Extract number before dash - match pattern like "12 -" or "12 - "
                                                                        const match = trimmedValue.match(/^(\d+)\s*-/);
                                                                        parsedFrom = match ? match[1] : trimmedValue.replace(/\s*-+\s*.*$/, "").trim();
                                                                        parsedTo = "";
                                                                    }
                                                                    // Handle " - 30" or " -30" format (to only)
                                                                    else if (trimmedValue.match(/^\s*-/)) {
                                                                        parsedFrom = "";
                                                                        // Extract number after dash
                                                                        parsedTo = trimmedValue.replace(/^\s*-+\s*/, "").trim();
                                                                    }
                                                                    // Fallback: try to split by any dash pattern
                                                                    else {
                                                                        const parts = trimmedValue.split(/\s*-\s*/);
                                                                        parsedFrom = (parts[0] || "").trim();
                                                                        parsedTo = (parts[1] || "").trim();
                                                                    }
                                                                }
                                                                
                                                                // Use ageRangeInputs if available, otherwise fallback to parsed values
                                                                const currentFrom = ageRangeInputs[field.fieldId]?.from ?? parsedFrom ?? "";
                                                                const currentTo = ageRangeInputs[field.fieldId]?.to ?? parsedTo ?? "";

                                                                const handleAgeChange = (type: "from" | "to", value: string) => {
                                                                    setAgeRangeInputs((prev) => {
                                                                        const currentFrom = prev[field.fieldId]?.from ?? parsedFrom ?? "";
                                                                        const currentTo = prev[field.fieldId]?.to ?? parsedTo ?? "";
                                                                        
                                                                        // If one field is being filled and the other is empty, set the other to empty (any)
                                                                        if (type === "from" && value && !currentTo) {
                                                                            // From is being filled, ensure To is empty
                                                                            return {
                                                                        ...prev,
                                                                        [field.fieldId]: {
                                                                                    from: value,
                                                                                    to: "",
                                                                                },
                                                                            };
                                                                        } else if (type === "to" && value && !currentFrom) {
                                                                            // To is being filled, ensure From is empty
                                                                            return {
                                                                                ...prev,
                                                                                [field.fieldId]: {
                                                                                    from: "",
                                                                                    to: value,
                                                                                },
                                                                            };
                                                                        }
                                                                        
                                                                        // Normal update
                                                                        return {
                                                                            ...prev,
                                                                            [field.fieldId]: {
                                                                                from: type === "from" ? value : currentFrom,
                                                                                to: type === "to" ? value : currentTo,
                                                                        },
                                                                        };
                                                                    });
                                                                };

                                                                const handleAgeSave = (e: React.FocusEvent<HTMLInputElement> | React.KeyboardEvent<HTMLInputElement>) => {
                                                                    // Clear any existing timer for this field
                                                                    if (ageRangeSaveTimersRef.current[field.fieldId]) {
                                                                        clearTimeout(ageRangeSaveTimersRef.current[field.fieldId]);
                                                                    }
                                                                    
                                                                    // Capture the container reference before the timeout
                                                                    const container = e.currentTarget.parentElement;
                                                                    if (!container) return;
                                                                    
                                                                    // Debounce the save to prevent multiple calls when both inputs trigger events
                                                                    ageRangeSaveTimersRef.current[field.fieldId] = setTimeout(() => {
                                                                        const inputs = container.querySelectorAll('input[type="number"]');
                                                                        const fromInput = inputs[0] as HTMLInputElement;
                                                                        const toInput = inputs[1] as HTMLInputElement;
                                                                        
                                                                        // Read values directly from input elements to get the most current values
                                                                        const fromValue = fromInput?.value.trim() || "";
                                                                        const toValue = toInput?.value.trim() || "";
                                                                        
                                                                        // Update state with current values FIRST to persist them
                                                                        setAgeRangeInputs((prev) => ({
                                                                            ...prev,
                                                                            [field.fieldId]: {
                                                                                from: fromValue,
                                                                                to: toValue,
                                                                            },
                                                                        }));
                                                                        
                                                                        // Save if at least one value is present
                                                                        if (fromValue || toValue) {
                                                                            // Format: "from - to" or "from - " or " - to"
                                                                            // This format matches what the server expects and how it's parsed
                                                                            const formattedValue = fromValue && toValue 
                                                                                ? `${fromValue} - ${toValue}`
                                                                                : fromValue 
                                                                                    ? `${fromValue} - `  // Keep format consistent for parsing
                                                                                    : ` - ${toValue}`;
                                                                            
                                                                            handleUpdate(field.fieldId, formattedValue);
                                                                        }
                                                                        
                                                                        // Clean up timer reference
                                                                        delete ageRangeSaveTimersRef.current[field.fieldId];
                                                                    }, 300); // 300ms debounce
                                                                };

                                                                return (
                                                                    <div className="flex gap-2">
                                                                        <input
                                                                            type="number"
                                                                            className="w-1/2 border p-2 rounded"
                                                                            placeholder={currentTo ? "From (Any)" : "From"}
                                                                            value={currentFrom}
                                                                            onChange={(e) => {
                                                                                const newValue = e.target.value;
                                                                                handleAgeChange("from", newValue);
                                                                                // If from is being filled and to is empty, ensure to stays empty
                                                                                if (newValue && !currentTo) {
                                                                                    // Clear to field when from is entered
                                                                                    setAgeRangeInputs((prev) => ({
                                                                                        ...prev,
                                                                                        [field.fieldId]: {
                                                                                            from: newValue,
                                                                                            to: "",
                                                                                        },
                                                                                    }));
                                                                                }
                                                                            }}
                                                                            onBlur={handleAgeSave}
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === "Enter") {
                                                                                    handleAgeSave(e);
                                                                                    e.currentTarget.blur();
                                                                                }
                                                                            }}
                                                                        />
                                                                        <input
                                                                            type="number"
                                                                            className="w-1/2 border p-2 rounded"
                                                                            placeholder={currentFrom ? "To (Any)" : "To"}
                                                                            value={currentTo}
                                                                            onChange={(e) => {
                                                                                const newValue = e.target.value;
                                                                                handleAgeChange("to", newValue);
                                                                                // If to is being filled and from is empty, ensure from stays empty
                                                                                if (newValue && !currentFrom) {
                                                                                    // Clear from field when to is entered
                                                                                    setAgeRangeInputs((prev) => ({
                                                                                        ...prev,
                                                                                        [field.fieldId]: {
                                                                                            from: "",
                                                                                            to: newValue,
                                                                                        },
                                                                                    }));
                                                                                }
                                                                            }}
                                                                            onBlur={handleAgeSave}
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === "Enter") {
                                                                                    handleAgeSave(e);
                                                                                    e.currentTarget.blur();
                                                                                }
                                                                            }}
                                                                        />
                                                                    </div>
                                                                );
                                                            })()}

                                                            {profileField === "height" && (() => {
                                                                const heightParts = fieldValue?.split(" - ") || [];
                                                                const minHeight = heightParts[0] || "";
                                                                const maxHeight = heightParts[1] || "";
                                                                
                                                                return (
                                                                <div className="flex gap-2">
                                                                    <select
                                                                        className="w-1/2 border p-2 rounded"
                                                                            value={minHeight}
                                                                        onChange={(e) => {
                                                                                const newMin = e.target.value;
                                                                                // If min is selected and max is empty, set max to empty (any)
                                                                                const newMax = newMin && !maxHeight ? "" : maxHeight;
                                                                                handleUpdate(field.fieldId, newMin && newMax ? `${newMin} - ${newMax}` : newMin ? `${newMin} - ` : newMax ? ` - ${newMax}` : "");
                                                                        }}
                                                                    >
                                                                            <option value="">Min Height (Any)</option>
                                                                        {heightOptions.map((height) => (
                                                                            <option key={height} value={height}>
                                                                                {height}
                                                                            </option>
                                                                        ))}
                                                                    </select>

                                                                    <select
                                                                        className="w-1/2 border p-2 rounded"
                                                                            value={maxHeight}
                                                                        onChange={(e) => {
                                                                                const newMax = e.target.value;
                                                                                // If max is selected and min is empty, set min to empty (any)
                                                                                const newMin = newMax && !minHeight ? "" : minHeight;
                                                                                handleUpdate(field.fieldId, newMin && newMax ? `${newMin} - ${newMax}` : newMin ? `${newMin} - ` : newMax ? ` - ${newMax}` : "");
                                                                        }}
                                                                    >
                                                                            <option value="">Max Height (Any)</option>
                                                                        {heightOptions.map((height) => (
                                                                            <option key={height} value={height}>
                                                                                {height}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                                );
                                                            })()}

                                                            {profileField === "select" && (() => {
                                                                // Exclude fields that should be single select
                                                                const isSingleSelectField = 
                                                                    field.fieldName === "Preferred Gender" ||
                                                                    field.fieldName === "Preferred Age Range" ||
                                                                    field.fieldName === "Preferred Height (ft & in)";
                                                                
                                                                // Use multi-select for all select fields except the excluded ones
                                                                if (!isSingleSelectField) {
                                                                    // Smart parsing function to handle values that contain commas
                                                                    // Works for all select fields:
                                                                    // - Options without commas: "Sikh,Hindu,Muslim" -> ["Sikh", "Hindu", "Muslim"]
                                                                    // - Options with commas: "Yes,occasionally,No" -> ["Yes,occasionally", "No"]
                                                                    // - Single values: "Sikh" -> ["Sikh"]
                                                                    // - Handles edge cases and removes duplicates/invalid values
                                                                    const parseMultiSelectValue = (value: string, availableOptions: string[]): string[] => {
                                                                        if (!value || value === "NaN") return [];
                                                                        
                                                                        // First, check if the entire value matches a single option
                                                                        if (availableOptions.includes(value)) {
                                                                            return [value];
                                                                        }
                                                                        
                                                                        // Sort options by length (longest first) to match longer values first
                                                                        // This ensures "Yes,occasionally" matches before "Yes" if both exist
                                                                        const sortedOptions = [...availableOptions].sort((a, b) => b.length - a.length);
                                                                        
                                                                        // Try to parse comma-separated values intelligently
                                                                        const result: string[] = [];
                                                                        let remaining = value;
                                                                        
                                                                        while (remaining.length > 0) {
                                                                            let matched = false;
                                                                            
                                                                            // Try to match against each option (longest first)
                                                                            for (const option of sortedOptions) {
                                                                                // Check if remaining starts with this option
                                                                                if (remaining.startsWith(option)) {
                                                                                    // Check if it's followed by comma or end of string
                                                                                    const nextChar = remaining[option.length];
                                                                                    if (!nextChar || nextChar === ',') {
                                                                                        result.push(option);
                                                                                        // Remove matched option and comma if present
                                                                                        remaining = remaining.substring(option.length);
                                                                                        if (remaining.startsWith(',')) {
                                                                                            remaining = remaining.substring(1).trim();
                                                                                        }
                                                                                        matched = true;
                                                                                        break;
                                                                                    }
                                                                                }
                                                                            }
                                                                            
                                                                            // If no match found, try simple comma split as fallback
                                                                            if (!matched) {
                                                                                // Fallback: split by comma and filter to valid options
                                                                                const fallbackValues = remaining.split(',').map(v => v.trim()).filter(Boolean);
                                                                                const validValues = fallbackValues.filter(v => availableOptions.includes(v));
                                                                                result.push(...validValues);
                                                                                break;
                                                                            }
                                                                        }
                                                                        
                                                                        // Remove duplicates and return only valid options
                                                                        return [...new Set(result.filter(v => availableOptions.includes(v)))];
                                                                    };
                                                                    
                                                                    // Parse current values intelligently
                                                                    const currentValues = parseMultiSelectValue(fieldValue, options);
                                                                    
                                                                    return (
                                                                        <Select
                                                                            mode="multiple"
                                                                            allowClear
                                                                            showSearch={false}
                                                                            className="w-full"
                                                                            placeholder="Select options"
                                                                            value={currentValues}
                                                                            onChange={(selectedValues) => {
                                                                                // Ensure selectedValues is an array and filter to only valid options
                                                                                const validValues = Array.isArray(selectedValues) 
                                                                                    ? selectedValues.filter(v => options.includes(v))
                                                                                    : [];
                                                                                
                                                                                // Remove duplicates
                                                                                const uniqueValues = [...new Set(validValues)];
                                                                                
                                                                                const stringValue = uniqueValues.join(",");
                                                                                
                                                                                setMatchData((prev) =>
                                                                                    prev.map((g) =>
                                                                                        g.groupId === group.groupId
                                                                                            ? {
                                                                                                  ...g,
                                                                                                  fields: g.fields.map((f) =>
                                                                                                      f.fieldId === field.fieldId
                                                                                                          ? { ...f, value: stringValue }
                                                                                                          : f
                                                                                                  ),
                                                                                              }
                                                                                            : g
                                                                                    )
                                                                                );
                                                                                handleUpdate(field.fieldId, stringValue);
                                                                            }}
                                                                            options={options.map((opt) => ({ label: opt, value: opt }))}
                                                                        />
                                                                    );
                                                                } else {
                                                                    // Single select mode for excluded fields
                                                                    return (
                                                                        <Select
                                                                            allowClear
                                                                            showSearch={false}
                                                                            className="w-full"
                                                                            placeholder="Select an option"
                                                                            value={fieldValue && fieldValue !== "NaN" ? fieldValue : undefined}
                                                                            onChange={(value) => {
                                                                                const stringValue = value || "";
                                                                                setMatchData((prev) =>
                                                                                    prev.map((g) =>
                                                                                        g.groupId === group.groupId
                                                                                            ? {
                                                                                                  ...g,
                                                                                                  fields: g.fields.map((f) =>
                                                                                                      f.fieldId === field.fieldId
                                                                                                          ? { ...f, value: stringValue }
                                                                                                          : f
                                                                                                  ),
                                                                                              }
                                                                                            : g
                                                                                    )
                                                                                );
                                                                                handleUpdate(field.fieldId, stringValue);
                                                                            }}
                                                                            options={options.map((opt) => ({ label: opt, value: opt }))}
                                                                        />
                                                                    );
                                                                }
                                                            })()}

                                                            {(profileField === "number" ||
                                                                profileField === "long text" ||
                                                                !["select", "multiselect", "date", "height"].includes(profileField)) && (
                                                                    <input
                                                                        type={profileField === "number" ? "number" : "text"}
                                                                        className="w-full border p-2 rounded"
                                                                        value={fieldValue}
                                                                        placeholder="Type here..."
                                                                        onChange={(e) => {
                                                                            setMatchData((prev) =>
                                                                                prev.map((g) =>
                                                                                    g.groupId === group.groupId
                                                                                        ? {
                                                                                            ...g,
                                                                                            fields: g.fields.map((f) =>
                                                                                                f.fieldId === field.fieldId ? { ...f, value: e.target.value } : f
                                                                                            ),
                                                                                        }
                                                                                        : g
                                                                                )
                                                                            );
                                                                        }}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === "Enter") {
                                                                                const target = e.target as HTMLInputElement;
                                                                                handleUpdate(field.fieldId, target.value);
                                                                            }
                                                                        }}
                                                                    />
                                                                )}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="text-gray-500">No fields available</div>
                                        )}
                                    </Panel>
                                ))}
                            </Collapse>
                        </div>
                    </TabPane>
                </Tabs>
            </div>
        </div>
    );
};

export default Form;