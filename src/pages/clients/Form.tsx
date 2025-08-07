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

    const generateFullPayload = () => {
        return {
            customerId: resolvedCustomerId,
            profileValue: formData
                .map((group) => {
                    const filledFields = group.fields
                        .map((field) => {
                            let valueToSend = "";

                            if (["select", "radio", "checkbox", "Image"].includes(field.attributeType)) {
                                valueToSend = field.value || "";
                            } else if (["text", "number", "date"].includes(field.attributeType)) {
                                valueToSend = field.value?.trim?.() || "";
                            }

                            // Ensure Image field is included if it has a URL
                            if (!valueToSend) return null;

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


    const saveFieldValue = async () => {
        const payload = generateFullPayload();

        if (payload.profileValue.length === 0) {
            message.warning("Nothing to update.");
            return;
        }

        try {
            const res = await updateCustomerProfile(payload);
            if (res.success) {
                message.success("Profile updated successfully");
            } else {
                message.error(res.message || "Update failed");
            }
        } catch (err) {
            message.error("Update failed");
        }
    };




    // Fixed handleFieldChange function
    const handleFieldChange = (
        groupId: string,
        fieldId: string,
        value: string
    ) => {
        setFormData((prev) => {
            const updated = prev.map((group) =>
                group.groupId === groupId
                    ? {
                        ...group,
                        fields: group.fields.map((field) =>
                            field.fieldId === fieldId ? { ...field, value } : field
                        ),
                    }
                    : group
            );
            return updated;
        });

        setRecentlyUpdatedFieldId(fieldId); // trigger effect
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

            handleFieldChange(groupId, fieldId, value);
            await saveFieldValue();
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
                                                    switch (field.attributeType) {
                                                        case "select":
                                                            return (
                                                                <select
                                                                    className="w-2/3 border p-2 rounded"
                                                                    value={field.value || ""}
                                                                    name={`${group.groupId}-${field.fieldId}`}
                                                                    onChange={async (e) => {
                                                                        const selectedValue = e.target.value;
                                                                        handleFieldChange(group.groupId, field.fieldId, selectedValue);
                                                                        await saveFieldValue();
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
                                                            return (
                                                                <input
                                                                    type="date"
                                                                    className="w-2/3 border p-2 rounded"
                                                                    name={`${group.groupId}-${field.fieldId}`}
                                                                    value={field.value || ""}
                                                                    placeholder="Select a date"
                                                                    onChange={async (e) => {
                                                                        const selectedDate = e.target.value;
                                                                        handleFieldChange(group.groupId, field.fieldId, selectedDate);
                                                                        await saveFieldValue();
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
                                                                                onChange={() => handleFieldChange(group.groupId, field.fieldId, option)}
                                                                                onKeyDown={(e) => handleFieldSaveOnEnter(e, group.groupId, field.fieldId)}
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
                                                                                        handleFieldChange(group.groupId, field.fieldId, newValue);
                                                                                        await saveFieldValue();
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
                                                                                handleFieldChange(group.groupId, field.fieldId, uploadResult.fileUrls[0]);

                                                                                saveFieldValue();
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
                                                    const currentGroup = matchdata.find((g) => g.groupId === group.groupId);

                                                    if (!currentGroup) return;

                                                    const updatedFields = currentGroup.fields.map((f) => ({
                                                        fieldId: f.fieldId,
                                                        fieldValue: f.fieldId === updatedFieldId ? updatedValue : (f.value || ""),
                                                    }));

                                                    const payload = {
                                                        customerId: resolvedCustomerId,
                                                        matchPreferences: [
                                                            {
                                                                preferencesGroupId: group.groupId,
                                                                groupFields: updatedFields,
                                                            },
                                                        ],
                                                    };

                                                    try {
                                                        await updateCustomerMatchPreferencesDetail(payload);
                                                        message.success("Preference updated successfully.");
                                                        await fetchCustomerMatchPreferences(); // Refresh updated values
                                                    } catch {
                                                        message.error("Failed to update preference.");
                                                    }
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


                                                            {profileField === "date" && (
                                                                <div className="flex gap-2">
                                                                    <input
                                                                        type="number"
                                                                        className="w-1/2 border p-2 rounded"
                                                                        placeholder="From"
                                                                        defaultValue={fieldValue?.split(" - ")[0] || ""}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === "Enter") {
                                                                                const to = fieldValue?.split(" - ")[1] || "";
                                                                                const from = (e.target as HTMLInputElement).value;
                                                                                handleUpdate(field.fieldId, `${from} - ${to}`);
                                                                            }
                                                                        }}
                                                                    />
                                                                    <input
                                                                        type="number"
                                                                        className="w-1/2 border p-2 rounded"
                                                                        placeholder="To"
                                                                        defaultValue={fieldValue?.split(" - ")[1] || ""}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === "Enter") {
                                                                                const from = fieldValue?.split(" - ")[0] || "";
                                                                                const to = (e.target as HTMLInputElement).value;
                                                                                handleUpdate(field.fieldId, `${from} - ${to}`);
                                                                            }
                                                                        }}
                                                                    />
                                                                </div>
                                                            )}

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


                                                            {profileField === "select" && (
                                                                <Select
                                                                    mode="multiple"
                                                                    allowClear
                                                                    showSearch={false} // disables typing
                                                                    className="w-full"
                                                                    placeholder="Select options"
                                                                    value={
                                                                        typeof fieldValue === "string"
                                                                            ? fieldValue.split(",").filter(Boolean)
                                                                            : Array.isArray(fieldValue)
                                                                                ? fieldValue
                                                                                : []
                                                                    }
                                                                    onChange={(selectedValues) => {
                                                                        const stringValue = selectedValues.join(",");
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
                                                            )}


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
