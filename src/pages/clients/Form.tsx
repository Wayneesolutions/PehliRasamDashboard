import { Input, Button, message, Spin, Tabs, Collapse } from "antd";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { getCustomerMatchPreferencesDetail, getFromGroupList, updateCustomerProfile, updateCustomerMatchPreferencesDetail } from "../../config/apiClient";
import { Field, Group, MatchGroup } from "../clientsForm/types/clientTypes";

const { Panel } = Collapse;
const { TabPane } = Tabs;

interface IField {
    fieldId: string;
    fieldName: string;
    value?: string;
    fieldValueOptions: any;
}

interface IGroup {
    groupId: string;
    groupName: string;
    fields: IField[];
}

const Form = ({ customerId }: { customerId: string }) => {
    const { handleSubmit } = useForm();
    const [formData, setFormData] = useState<IGroup[]>([]);
    const [matchdata, setMatchData] = useState<MatchGroup[]>([]);
    const [loading, setLoading] = useState(false);
    const [activePanels, setActivePanels] = useState<string[]>([]); // for expanded panels

    useEffect(() => {
        if (customerId) {
            async function getCustomerMatch() {
                const res = await getCustomerMatchPreferencesDetail({ customerId });

                if (res.success) setMatchData(res.data);
            }
            getCustomerMatch();
        }
    }, [customerId]);

    useEffect(() => {
        setLoading(true);
        getFromGroupList()
            .then((data) => {
                if (Array.isArray(data.data)) {
                    const formattedData = data.data.map((group: Group) => ({
                        groupId: group._id,
                        groupName: group.groupName,
                        fields: Array.isArray(group.fields)
                            ? group.fields.map((field: Field) => ({
                                fieldId: field.attributeId,
                                fieldName: field.attributeName || "Unknown Field",
                                fieldValueOptions: field.attributeOption || '',
                                value: "",
                            }))
                            : [],
                    }));
                    setFormData(formattedData);
                    setActivePanels(data.data.map((group: Group) => group._id)); // open all by default
                } else {
                    message.error("Invalid data format received from server.");
                }
            })
            .catch(() => {
                message.error("Failed to fetch form groups. Please try again.");
            })
            .finally(() => setLoading(false));
    }, []);

    const handleFieldChange = (groupId: string, fieldId: string, value: string) => {
        setFormData((prevData) =>
            prevData.map((group) =>
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
    };

    const handleFieldSaveOnEnter = async (
        e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>,
        groupId: string,
        fieldId: string,
        value: string
    ) => {
        if (e.key === 'Enter') {
            const payload = {
                customerId,
                dynamicValue: [
                    {
                        groupId,
                        groupFields: [
                            {
                                fieldID: fieldId,
                                fieldValue: value
                            }
                        ]
                    }
                ]
            };
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
                    <TabPane tab="Form Groups" key="1">
                        <div className="w-full">
                            <Collapse
                                className="w-full border border-gray-200 rounded-md"
                                expandIconPosition="start"
                                activeKey={activePanels}
                                onChange={(keys) => setActivePanels(Array.isArray(keys) ? keys : [keys])}
                            >
                                {formData.map((group) => (
                                    <Panel header={group.groupName} key={group.groupId} className="w-full">
                                        {group.fields.length > 0 ? (
                                            group.fields.map((field) => (
                                                <div key={field.fieldId} className="flex mb-3">
                                                    <label className="w-1/3 text-gray-600">{field.fieldName}</label>
                                                    {Array.isArray(field.fieldValueOptions) && field.fieldValueOptions.length > 0 ? (
                                                        <select
                                                            className="w-2/3 border p-2 rounded"
                                                            value={field.value || ""}
                                                            onChange={async (e) => {
                                                                const selectedValue = e.target.value;
                                                                handleFieldChange(group.groupId, field.fieldId, selectedValue);
                                                                const payload = {
                                                                    customerId,
                                                                    dynamicValue: [
                                                                        {
                                                                            groupId: group.groupId,
                                                                            groupFields: [
                                                                                {
                                                                                    fieldID: field.fieldId,
                                                                                    fieldValue: selectedValue,
                                                                                },
                                                                            ],
                                                                        },
                                                                    ],
                                                                };
                                                                try {
                                                                    await updateCustomerProfile(payload);
                                                                    message.success("Field updated successfully.");
                                                                } catch {
                                                                    message.error("Failed to update field.");
                                                                }
                                                            }}
                                                        >
                                                            <option value="" disabled>Select an option</option>
                                                            {field.fieldValueOptions.map((option: any) => (
                                                                <option key={option} value={option}>
                                                                    {option}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            className="w-2/3 border p-2 rounded"
                                                            value={field.value || ""}
                                                            placeholder="Text here..."
                                                            onChange={(e) => handleFieldChange(group.groupId, field.fieldId, e.target.value)}
                                                            onKeyDown={(e) =>
                                                                handleFieldSaveOnEnter(e, group.groupId, field.fieldId, field.value || "")
                                                            }
                                                        />
                                                    )}

                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-gray-500">No fields available</div>
                                        )}
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
                                                    <div key={field.fieldId} className="flex mb-3">
                                                        <label className="w-1/3 text-gray-600">{field.fieldName}</label>

                                                        {Array.isArray(options) && options.length > 0 ? (
                                                            <select
                                                                className="w-2/3 border p-2 rounded"
                                                                value={fieldValue}
                                                                onChange={async (e) => {
                                                                    const selectedValue = e.target.value;

                                                                    const payload = {
                                                                        customerId,
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
                                                                value={fieldValue}
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
                                                                            customerId,
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
