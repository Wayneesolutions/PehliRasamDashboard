import { Select, Row, Col, InputNumber, Collapse, Input, Button, message, Spin, Tabs } from "antd";
import { useForm, Controller } from "react-hook-form";
import { useEffect, useState } from "react";
import { getCustomerProfileDetail, getCustomerMatchPreferencesDetail } from "./Actions";

const { Panel } = Collapse;
const { TabPane } = Tabs;

const generateHeightOptions = () => {
    const options = [];
    for (let inches = 48; inches <= 96; inches++) {
        const feet = Math.floor(inches / 12);
        const remainingInches = inches % 12;
        options.push({
            value: inches,
            label: `${feet}'${remainingInches}"`,
        });
    }
    return options;
};

const heightOptions = generateHeightOptions();

interface IField {
    fieldId: string;
    fieldName: string;
    value?: string;
    choices?: string[];
}

interface IGroup {
    groupId: string;
    groupName: string;
    fields: IField[];
}

const Form = () => {
    const { control } = useForm();
    const { handleSubmit } = useForm();
    const [formData, setFormData] = useState<IGroup[]>([]);
    const [matchPreferencesData, setMatchPreferencesData] = useState<IGroup[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchCustomerProfile = async () => {
            setLoading(true);
            try {
                const customerId = "67d135ccfc2f22c38dcd0a8c"; // Replace with actual customerId
                const profileResponse = await getCustomerProfileDetail(customerId);
                const matchPreferencesResponse = await getCustomerMatchPreferencesDetail(customerId);

                if (profileResponse.success && Array.isArray(profileResponse.data)) {
                    const formattedProfileData = profileResponse.data.map((group) => ({
                        groupId: group.groupId,
                        groupName: group.groupName,
                        fields: group.fields.map((field) => ({
                            fieldId: field.fieldId,
                            fieldName: field.fieldName,
                            value: field.value || "",
                        })),
                    }));
                    setFormData(formattedProfileData);
                } else {
                    console.error("Unexpected API response format:", profileResponse);
                    message.error("Invalid profile data format received from server.");
                }

                if (matchPreferencesResponse.success && Array.isArray(matchPreferencesResponse.data)) {
                    const formattedMatchPreferencesData = matchPreferencesResponse.data.map((group) => ({
                        groupId: group.groupId,
                        groupName: group.groupName,
                        fields: group.fields.map((field) => ({
                            fieldId: field.fieldId,
                            fieldName: field.fieldName,
                            value: field.value || "",
                            choices: field.choices || [],
                        })),
                    }));
                    setMatchPreferencesData(formattedMatchPreferencesData);
                } else {
                    console.error("Unexpected API response format:", matchPreferencesResponse);
                    message.error("Invalid match preferences data format received from server.");
                }
            } catch (error) {
                console.error("API Error:", error);
                message.error("Failed to fetch data. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchCustomerProfile();
    }, []);

    const handleDynamicFieldChange = (groupId: string, fieldId: string, value: string) => {
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

    const handleMatchPreferencesFieldChange = (groupId: string, fieldId: string, value: string) => {
        setMatchPreferencesData((prevData) =>
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

    const onSubmit = async () => {
        setLoading(true);
        console.log("Form submitted", { formData, matchPreferencesData });
        setLoading(false);
    };

    if (loading) return <Spin size="large" className="flex justify-center mt-10" />;
    if (!formData.length && !matchPreferencesData.length) return <div>No data found</div>;

    return (
        <div className="p-6 bg-white rounded-md shadow-md">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Form Groups</h2>
                <Button type="primary" onClick={handleSubmit(onSubmit)} loading={loading}>
                    Save
                </Button>
            </div>

            <div className="flex w-full">
                <Tabs defaultActiveKey="1" className="w-full">
                    <TabPane tab="Form Groups" key="1">
                        <div className="w-full">
                            <Collapse className="w-full border border-gray-200 rounded-md" expandIconPosition="start">
                                {formData.map((group, index) => (
                                    <Panel header={group.groupName} key={group.groupId || index} className="w-full">
                                        {group.fields.length > 0 ? (
                                            group.fields.map((field) => (
                                                <div key={field.fieldId} className="flex mb-3">
                                                    <label className="w-1/3 text-gray-600">{field.fieldName}</label>
                                                    <Input
                                                        className="w-2/3"
                                                        value={field.value || ""}
                                                        onChange={(e) =>
                                                            handleDynamicFieldChange(group.groupId, field.fieldId, e.target.value)
                                                        }
                                                    />
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
                            <Collapse className="w-full border border-gray-200 rounded-md" expandIconPosition="start">
                                {matchPreferencesData.map((group, index) => (
                                    <Panel header={group.groupName} key={group.groupId || index} className="w-full">
                                        {group.fields.length > 0 ? (
                                            group.fields.map((field) => (
                                                <div key={field.fieldId} className="flex mb-3">
                                                    <label className="w-1/3 text-gray-600">{field.fieldName}</label>
                                                    {field.choices && field.choices.length > 0 ? (
                                                        <Select
                                                            className="w-2/3"
                                                            value={field.value || ""}
                                                            onChange={(value) =>
                                                                handleMatchPreferencesFieldChange(group.groupId, field.fieldId, value)
                                                            }
                                                            options={field.choices.map((choice) => ({
                                                                label: choice,
                                                                value: choice,
                                                            }))}
                                                        />
                                                    ) : (
                                                        <Input
                                                            className="w-2/3"
                                                            value={field.value || ""}
                                                            onChange={(e) =>
                                                                handleMatchPreferencesFieldChange(group.groupId, field.fieldId, e.target.value)
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
                </Tabs>
            </div>
        </div>
    );
};

export default Form;