import { message, Spin, Tabs, Collapse, Select } from "antd";
import { useEffect, useState } from "react";
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
    useEffect(() => {
        const newAgeRangeInputs: Record<string, { from: string; to: string }> = {};
        matchdata.forEach((group) => {
            group.fields.forEach((field) => {
                if (field.profileField?.trim()?.toLowerCase() === "date" && field.value && field.value !== "NaN") {
                    const ageRange = field.value.split(" - ") || ["", ""];
                    newAgeRangeInputs[field.fieldId] = {
                        from: ageRange[0] || "",
                        to: ageRange[1] || "",
                    };
                }
            });
        });
        setAgeRangeInputs((prev) => ({ ...prev, ...newAgeRangeInputs }));
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
                                {formData.map((group) => (
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
                                                    // Use functional update to get latest state and build payload
                                                    setMatchData((prevMatchData) => {
                                                        const currentGroup = prevMatchData.find((g) => g.groupId === group.groupId);

                                                        if (!currentGroup) return prevMatchData;

                                                        // Build updated fields array for API payload
                                                        // Only include fields with non-empty values
                                                        const updatedFields = currentGroup.fields
                                                            .map((f) => {
                                                                // Get the value for this field
                                                                let fieldValue: string;
                                                                if (f.fieldId === updatedFieldId) {
                                                                    // Use the new updated value
                                                                    fieldValue = updatedValue?.toString().trim() || "";
                                                                } else {
                                                                    // Use existing value, but convert "NaN" to empty string
                                                                    const existingValue = f.value === "NaN" ? "" : (f.value || "");
                                                                    fieldValue = existingValue.trim();
                                                                }
                                                                
                                                                return {
                                                                    fieldId: f.fieldId,
                                                                    fieldValue: fieldValue,
                                                                };
                                                            })
                                                            .filter((f) => {
                                                                // Filter out empty values - backend requires non-empty fieldValue
                                                                const value = f.fieldValue?.trim();
                                                                return value && value !== "" && value !== "NaN";
                                                            });

                                                        // Only send payload if there are fields with values
                                                        if (updatedFields.length > 0) {
                                                            // Prepare payload
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
                                                                    message.success("Preference updated successfully.");
                                                                    fetchCustomerMatchPreferences(); // Refresh to get server state
                                                                })
                                                                .catch(() => {
                                                                    message.error("Failed to update preference.");
                                                                    // Revert on error by refetching
                                                                    fetchCustomerMatchPreferences();
                                                                });
                                                        }

                                                        // Return updated state optimistically
                                                        // Normalize the value - use empty string if empty, otherwise use trimmed value
                                                        const normalizedValue = updatedValue?.toString().trim() || "";
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
                                                                const ageRange = fieldValue?.split(" - ") || ["", ""];
                                                                const currentFrom = ageRangeInputs[field.fieldId]?.from ?? ageRange[0] ?? "";
                                                                const currentTo = ageRangeInputs[field.fieldId]?.to ?? ageRange[1] ?? "";

                                                                const handleAgeChange = (type: "from" | "to", value: string) => {
                                                                    setAgeRangeInputs((prev) => ({
                                                                        ...prev,
                                                                        [field.fieldId]: {
                                                                            from: type === "from" ? value : (prev[field.fieldId]?.from ?? ageRange[0] ?? ""),
                                                                            to: type === "to" ? value : (prev[field.fieldId]?.to ?? ageRange[1] ?? ""),
                                                                        },
                                                                    }));
                                                                };

                                                                const createAgeBlurHandler = (type: "from" | "to") => {
                                                                    return (e: React.FocusEvent<HTMLInputElement>) => {
                                                                        const currentInputValue = e.target.value.trim();
                                                                        // Update state with current input value
                                                                        setAgeRangeInputs((prev) => {
                                                                            const updatedState = {
                                                                                ...prev,
                                                                                [field.fieldId]: {
                                                                                    from: type === "from" ? currentInputValue : (prev[field.fieldId]?.from ?? ageRange[0] ?? ""),
                                                                                    to: type === "to" ? currentInputValue : (prev[field.fieldId]?.to ?? ageRange[1] ?? ""),
                                                                                },
                                                                            };
                                                                            
                                                                            const fromValue = updatedState[field.fieldId].from.trim();
                                                                            const toValue = updatedState[field.fieldId].to.trim();
                                                                            
                                                                            // Save if at least one value is present
                                                                            if (fromValue || toValue) {
                                                                                // Format: "from - to" or just the value if one is empty
                                                                                const formattedValue = fromValue && toValue 
                                                                                    ? `${fromValue} - ${toValue}`
                                                                                    : fromValue 
                                                                                        ? `${fromValue} - ${toValue || ""}`
                                                                                        : ` - ${toValue}`;
                                                                                handleUpdate(field.fieldId, formattedValue);
                                                                            }
                                                                            
                                                                            return updatedState;
                                                                        });
                                                                    };
                                                                };

                                                                const handleFromBlur = createAgeBlurHandler("from");
                                                                const handleToBlur = createAgeBlurHandler("to");

                                                                return (
                                                                    <div className="flex gap-2">
                                                                        <input
                                                                            type="number"
                                                                            className="w-1/2 border p-2 rounded"
                                                                            placeholder="From"
                                                                            value={currentFrom}
                                                                            onChange={(e) => handleAgeChange("from", e.target.value)}
                                                                            onBlur={handleFromBlur}
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === "Enter") {
                                                                                    handleFromBlur(e as any);
                                                                                }
                                                                            }}
                                                                        />
                                                                        <input
                                                                            type="number"
                                                                            className="w-1/2 border p-2 rounded"
                                                                            placeholder="To"
                                                                            value={currentTo}
                                                                            onChange={(e) => handleAgeChange("to", e.target.value)}
                                                                            onBlur={handleToBlur}
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === "Enter") {
                                                                                    handleToBlur(e as any);
                                                                                }
                                                                            }}
                                                                        />
                                                                    </div>
                                                                );
                                                            })()}

                                                            {profileField === "height" && (
                                                                <div className="flex gap-2">
                                                                    <select
                                                                        className="w-1/2 border p-2 rounded"
                                                                        value={fieldValue?.split(" - ")[0] || ""}
                                                                        onChange={(e) => {
                                                                            const max = fieldValue?.split(" - ")[1] || "";
                                                                            handleUpdate(field.fieldId, `${e.target.value} - ${max}`);
                                                                        }}
                                                                    >
                                                                        <option value="">Min Height</option>
                                                                        {heightOptions.map((height) => (
                                                                            <option key={height} value={height}>
                                                                                {height}
                                                                            </option>
                                                                        ))}
                                                                    </select>

                                                                    <select
                                                                        className="w-1/2 border p-2 rounded"
                                                                        value={fieldValue?.split(" - ")[1] || ""}
                                                                        onChange={(e) => {
                                                                            const min = fieldValue?.split(" - ")[0] || "";
                                                                            handleUpdate(field.fieldId, `${min} - ${e.target.value}`);
                                                                        }}
                                                                    >
                                                                        <option value="">Max Height</option>
                                                                        {heightOptions.map((height) => (
                                                                            <option key={height} value={height}>
                                                                                {height}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            )}

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