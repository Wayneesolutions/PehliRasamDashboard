import { message, Spin, Tabs, Collapse } from "antd";
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

    const [formData, setFormData] = useState<IGroup[]>([]);
    const [matchdata, setMatchData] = useState<MatchGroup[]>([]);
    const [loading, setLoading] = useState(false);
    const [activePanels, setActivePanels] = useState<string[]>([]);

    useEffect(() => {
        if (customerId) {
            async function getCustomerMatch() {
                const res = await getCustomerMatchPreferencesDetail({ customerId: resolvedCustomerId });

                if (res.success) setMatchData(res.data);
            }
            getCustomerMatch();
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

                    console.log("✅ Formatted formData with proper groupIds:", JSON.stringify(formattedData, null, 2));
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

                            if (!valueToSend) return null;

                            return {
                                fieldID: field.fieldId,
                                fieldValue: valueToSend,
                            };
                        })
                        .filter(Boolean); // Removes nulls

                    if (filledFields.length === 0) return null;

                    return {
                        groupId: group.groupId,
                        groupFields: filledFields,
                    };
                })
                .filter(Boolean),
        };
    };


    const saveFieldValue = async (groupId: string, fieldId: string, value: string) => {
        // Build payload with only the current field if value is non-empty
        if (!value?.trim()) {
            message.warning("Empty values are not saved.");
            return;
        }
    
        const payload = {
            customerId: resolvedCustomerId,
            profileValue: [
                {
                    groupId,
                    groupFields: [
                        {
                            fieldID: fieldId,
                            fieldValue: value,
                        },
                    ],
                },
            ],
        };
    
        try {
            const res = await updateCustomerProfile(payload);
    
            if (res.success) {
                message.success("Field updated successfully");
                // Update local state immediately
                setFormData((prev) =>
                    prev.map((group) =>
                        group.groupId === groupId
                            ? {
                                ...group,
                                fields: group.fields.map((field) =>
                                    field.fieldId === fieldId ? { ...field, value } : field
                                ),
                            }
                            : group
                    )
                );
            } else {
                message.error(res.message || "Update failed");
            }
        } catch (err) {
            message.error("Update failed");
        }
    };
    
    const handleFieldChange = (groupId: string, fieldId: string, value: string) => {
        // Update local state immediately
        setFormData((prev) =>
            prev.map((group) =>
                group.groupId === groupId
                    ? {
                        ...group,
                        fields: group.fields.map((field) =>
                            field.fieldId === fieldId
                                ? { ...field, value }
                                : field
                        ),
                    }
                    : group
            )
        );
    };
    


    const handleFieldSaveOnEnter = async (
        e: React.KeyboardEvent<HTMLInputElement>,
        groupId: string,
        fieldId: string
    ) => {
        if (e.key === "Enter") {
            const value = (e.target as HTMLInputElement).value;

            setFormData((prev) =>
                prev.map((group) =>
                    group.groupId === groupId
                        ? {
                            ...group,
                            fields: group.fields.map((field) =>
                                field.fieldId === fieldId ? { ...field, value } : field
                            ),
                        }
                        : group
                )
            );

            const payload = generateFullPayload();

            try {
                await updateCustomerProfile(payload);
                message.success("Field updated successfully.");
            } catch (error) {
                message.error("Failed to update field.");
            }
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
                                                    switch (field.attributeType) {
                                                        case "select":
                                                            return (
                                                                <select
                                                                    className="w-2/3 border p-2 rounded"
                                                                    value={field.value || ""}
                                                                    name={`${group.groupId}-${field.fieldId}`}
                                                                    onChange={async (e) => {
                                                                        const selectedValue = e.target.value;
                                                                        await saveFieldValue(group.groupId, field.fieldId, selectedValue);
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
                                                                    onChange={(e) => handleFieldChange(group.groupId, field.fieldId, e.target.value)}
                                                                    onKeyDown={(e) => handleFieldSaveOnEnter(e, group.groupId, field.fieldId)}
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
                                                                                    onChange={() =>
                                                                                        handleFieldChange(group.groupId, field.fieldId, newValue)
                                                                                    }
                                                                                    onKeyDown={(e) =>
                                                                                        handleFieldSaveOnEnter(e, group.groupId, field.fieldId)
                                                                                    }
                                                                                />
                                                                                {option}
                                                                            </label>
                                                                        );
                                                                    })}
                                                                </div>
                                                            );

                                                        case "Image":
                                                            return (
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    placeholder="Upload an image"
                                                                    onChange={async (e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (!file) return;

                                                                        const uploadResult = await uploadImage(file);

                                                                        if (uploadResult?.success) {
                                                                            const uploadedUrl = uploadResult.fileUrl;
                                                                            handleFieldChange(group.groupId, field.fieldId, uploadedUrl);
                                                                            await saveFieldValue(group.groupId, field.fieldId, uploadedUrl);
                                                                        } else {
                                                                            console.error("Image upload failed:", uploadResult?.message || "Unknown error");
                                                                            message.error("Image upload failed");
                                                                        }
                                                                    }}
                                                                />
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
                                                const fieldValue = field.value === "NaN" ? "" : field.value || "";
                                                const options = field.choices || [];

                                                return (
                                                    <div key={`${group.groupId}-${field.fieldId}`} className="flex mb-3">

                                                        <label className="w-1/3 text-gray-600">{field.fieldName}</label>

                                                        {Array.isArray(options) && options.length > 0 ? (
                                                            <select
                                                                className="w-2/3 border p-2 rounded"
                                                                value={fieldValue}
                                                                onChange={async (e) => {
                                                                    const selectedValue = e.target.value;

                                                                    const payload = {
                                                                        customerId: resolvedCustomerId,
                                                                        matchPreferences: [
                                                                            {
                                                                                preferencesGroupId: group.groupId,
                                                                                groupFields: [
                                                                                    {
                                                                                        fieldId: field.fieldId,
                                                                                        fieldValue: selectedValue,
                                                                                    },
                                                                                ],
                                                                            },
                                                                        ],
                                                                    };

                                                                    try {
                                                                        await updateCustomerMatchPreferencesDetail(payload);
                                                                        message.success("Preference updated successfully.");
                                                                        // Update local matchdata
                                                                        setMatchData((prev) =>
                                                                            prev.map((g) =>
                                                                                g.groupId === group.groupId
                                                                                    ? {
                                                                                        ...g,
                                                                                        fields: g.fields.map((f) =>
                                                                                            f.fieldId === field.fieldId ? { ...f, value: selectedValue } : f
                                                                                        ),
                                                                                    }
                                                                                    : g
                                                                            )
                                                                        );
                                                                    } catch {
                                                                        message.error("Failed to update preference.");
                                                                    }
                                                                }}
                                                            >
                                                                <option value="" disabled>Select an option</option>
                                                                {options.map((option: any) => (
                                                                    <option key={option} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        ) : (
                                                            <input
                                                                type="text"
                                                                className="w-2/3 border p-2 rounded"
                                                                value={fieldValue === "NaN" || fieldValue == null ? "" : fieldValue}
                                                                placeholder="Text here..."
                                                                onChange={(e) => {
                                                                    const updatedValue = e.target.value;
                                                                    setMatchData((prev) =>
                                                                        prev.map((g) =>
                                                                            g.groupId === group.groupId
                                                                                ? {
                                                                                    ...g,
                                                                                    fields: g.fields.map((f) =>
                                                                                        f.fieldId === field.fieldId ? { ...f, value: updatedValue } : f
                                                                                    ),
                                                                                }
                                                                                : g
                                                                        )
                                                                    );
                                                                }}
                                                                onKeyDown={async (e) => {
                                                                    if (e.key === "Enter") {
                                                                        const payload = {
                                                                            customerId: resolvedCustomerId,
                                                                            matchPreferences: [
                                                                                {
                                                                                    preferencesGroupId: group.groupId,
                                                                                    groupFields: [
                                                                                        {
                                                                                            fieldId: field.fieldId,
                                                                                            fieldValue: fieldValue,
                                                                                        },
                                                                                    ],
                                                                                },
                                                                            ],
                                                                        };

                                                                        try {
                                                                            await updateCustomerMatchPreferencesDetail(payload);
                                                                            message.success("Preference updated successfully.");
                                                                        } catch {
                                                                            message.error("Failed to update preference.");
                                                                        }
                                                                    }
                                                                }}
                                                            />

                                                        )}
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
