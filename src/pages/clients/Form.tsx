<<<<<<< HEAD
import { Collapse, Input, Button, message, Spin, Tabs } from "antd";
import { useForm } from "react-hook-form";
=======
import { message, Spin, Tabs, Collapse } from "antd";
>>>>>>> origin/dev_krishna
import { useEffect, useState } from "react";
import { getCustomerMatchPreferencesDetail, getCustomerProfileDetail, uploadImage, updateCustomerProfile, updateCustomerMatchPreferencesDetail } from "../../config/apiClient";
import { Group, MatchGroup } from "../clientsForm/types/clientTypes";
import { useOutletContext } from "react-router-dom";

const { Panel } = Collapse;
const { TabPane } = Tabs;

<<<<<<< HEAD
// const generateHeightOptions = () => {
//     const options = [];
//     for (let inches = 48; inches <= 96; inches++) {
//         const feet = Math.floor(inches / 12);
//         const remainingInches = inches % 12;
//         options.push({
//             value: inches,
//             label: `${feet}'${remainingInches}"`,
//         });
//     }
//     return options;
// };

// const heightOptions = generateHeightOptions();

=======
>>>>>>> origin/dev_krishna
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

<<<<<<< HEAD
const Form = ({customerId}:{customerId?:string | undefined}) => {
    // const { control } = useForm();
    const { handleSubmit } = useForm();
=======
interface ContextType {
    customerId: string;
}

interface FormProps {
    customerId?: string;
}



const Form: React.FC<FormProps> = ({ customerId }) => {
    const context = useOutletContext<ContextType>();
    const resolvedCustomerId = customerId || context?.customerId;

>>>>>>> origin/dev_krishna
    const [formData, setFormData] = useState<IGroup[]>([]);
    const [matchdata, setMatchData] = useState<MatchGroup[]>([]);
    const [loading, setLoading] = useState(false);
<<<<<<< HEAD
   
    useEffect(()=>{
        if(customerId){
            async function getCutsomerMatch(){
            const res = await getCustomerMatchPreferencesDetail(customerId as string)
            if(res.success){
                console.log('===',res.data);
                
                setMatchData(res.data) 
            }
        }
        getCutsomerMatch()
        }
     
    },[])
console.log('matchdata===',matchdata);
=======
    const [activePanels, setActivePanels] = useState<string[]>([
        ...formData.map((group) => group.groupId),
        ...matchdata.map((group) => group.groupId),
    ]);

>>>>>>> origin/dev_krishna
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
                // 🔥 Don't fetch again — updated values stay in formData
            } else {
                message.error(res.message || "Update failed");
            }
        } catch (err) {
            message.error("Update failed");
        }
    };



    const handleFieldChange = (groupId: string, fieldId: string, value: string) => {
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
    };


    const handleFieldSaveOnEnter = async (
        e: React.KeyboardEvent<HTMLInputElement>,
        groupId: string,
        fieldId: string
    ) => {
        if (e.key === "Enter") {
            const value = (e.target as HTMLInputElement).value;

            handleFieldChange(groupId, fieldId, value); // Update local first
            await saveFieldValue(); // Save full payload
        }
    };

    if (loading) return <Spin size="large" className="flex justify-center mt-10" />;
    if (!formData.length) return <div>No data found</div>;

    return (
        <div className="p-6 bg-white rounded-md shadow-md">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Form Groups</h2>
            </div>

            <div className="flex w-full">
                <Tabs defaultActiveKey="1" className="w-full">
                    <TabPane tab="Profile" key="1">
                        <div className="w-full">
<<<<<<< HEAD
                            <Collapse className="w-full border border-gray-200 rounded-md" expandIconPosition="start">
                                {formData.map((group, index) => (
                                    <Panel header={group.groupName} key={group.groupId || index} className="w-full">
                                        {group.fields.length > 0 ? (
                                            group.fields.map((field) => (
                                                <div key={field.fieldId} className="flex mb-3">
                                                    <label className="w-1/3 text-gray-600">{field.fieldName}</label>
                                                    <select
                                                        className="w-2/3 p-2 border rounded"
                                                        value={field.value || ""}
                                                        onChange={(e) =>
                                                            handleDynamicFieldChange(group.groupId, field.fieldId, e.target.value)
                                                        }
                                                    >
                                                        <option value="" disabled>Select an option</option>
                                                        {field?.fieldValueOptions?.map((option:any) => (
                                                            <option key={option} value={option}>
                                                                {option}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-gray-500">No fields available</div>
                                        )}
=======
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
                                                                        handleFieldChange(group.groupId, field.fieldId, selectedValue);
                                                                        await saveFieldValue(); // Save full form state

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
                                                                            await saveFieldValue();
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
>>>>>>> origin/dev_krishna
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
                                                            {profileField === "select" && (
                                                                <select
                                                                    className="w-full border p-2 rounded"
                                                                    value={fieldValue}
                                                                    onChange={(e) => handleUpdate(field.fieldId, e.target.value)}

                                                                >
                                                                    <option value="" disabled>Select an option</option>
                                                                    {options.map((option) => (
                                                                        <option key={option} value={option}>
                                                                            {option}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            )}

                                                            {profileField === "date" && (
                                                                <input
                                                                    type="date"
                                                                    className="w-full border p-2 rounded"
                                                                    value={fieldValue}
                                                                    onChange={(e) => handleUpdate(field.fieldId, e.target.value)}

                                                                />
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
<<<<<<< HEAD
                        {/* <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: "More About Partner Preference", value: ["something"] },
                                { label: "Member Status", value: ["type"] },
                                { label: "Preferred Gender", options: ["Male", "Female"] },
                                { label: "Preferred Reigion", options: ['Sikh', 'Hindu', 'Jain', 'Muslim', 'Christain', 'Buddhist', 'Spiritual', 'Other'] },
                                {
                                    label: "Preferred Caste", options: ['Ad Dharmi', 'Ahluwalia', 'Arora', 'Baazigar',
                                        'Bhatia', 'Bhatra', 'Brahmin', 'Baniya', 'Chimba', 'Ghumar', 'Gujjar', 'Sunyar (Gold Smith)',
                                        'Hindu Punjabi', 'Intercaste', 'Jatt (Sikh)', 'Julahe', 'Jain', 'Jaat (Hindu)', 'Kabir Panthi',
                                        'Kamboj', 'Kashyap Rajput', 'Khatri', 'Kshatriya', 'Lubana', 'Mahajan', 'Maid Rajput',
                                        'Mair Rajput', 'Majabi', 'Nai', 'Parjapat', 'Rai', 'Rajput', 'Ramdasia', 'Ramgharia',
                                        'Ravidasia', 'Saini', 'Tonk Khatriya', 'Other']
                                },

                                { label: "Residency Preferrence", value: "India" },
                                { label: "Country Preferrnce ", value: "India" },
                                {
                                    label: "City Preferrence"
                                    , options: ['Amritsar', 'Barnala', 'Bathinda', 'Dera Bassi', 'Delhi', 'Chandigarh',
                                        'Faridkot', 'Fatehgarh Sahib', 'Firozpur', 'Gurdaspur', 'Gujarat', 'Hoshiarpur',
                                        'Himachal Pradesh', 'Haryana', 'Jalandhar', 'Jammu and Kashmir', 'Kapurthala',
                                        'Khanna', 'Ludhiana', 'Mansa', 'Moga', 'Muktsar(Sri Muktsar Sahib)',
                                        'Nakodar', 'Patiala', 'Phagwara', 'Rupnagar', 'Rajasthan',
                                        '(Mohali)Sahibzada Ajit Singh Nagar', 'Sangrur', '(Nawanshahr)Shahid Bhagat Singh Nagar',
                                        'Tarn Taran', 'Uttarakhand', 'Uttar Pradesh', 'Zirakpur']
                                },
                                { label: "Preferred Appearance", options: ["Hair-cut", "Turbaned(with trimmed beard)", "Gursikh", "Clean Shaven", "Amrit-Dhari", "Female Profile"] },
                                { label: "Preferred Marital Status", options: ["Never Married", "Divorced", "Windowed", "Separated", "Annulled", "Divorced(1 child , Living Together)", "Divorced(2 children , Living Together)", "Divorced(3 children , Living Together)", "Awaiting Divorce", "Widowed(1 child , Living Together)", "Divorced(Without child)"] },
                                {
                                    label: "Education Preference", options: ['High School', 'Senior Secondary School',
                                        'Graduation - Bachelor’s degree, BA, BSc, BCom etc.',
                                        'Post-Graduation - Master’s degree, MA, MSc, MCom etc.',
                                        'Doctorate - PhD']
                                },
                                {
                                    label: "Employment Preferrence", options: ['Private Sector', 'Government Job',
                                        'Businessman', 'Self-Employed', 'Freelancer', 'Student', 'Retired',
                                        'Homemaker', 'Consultant', 'Part-Time Worker']
                                },

                                { label: "Vegetarian Preferrence", options: ["Yes", "No"] },
                                { label: "Drink Alcohol Preferrence", options: ['Yes,occasionally', 'yes,regularly', 'No'] },
                            ].map((item, index) => (
                                <div key={index} className="flex">
                                    <div className="w-1/2 px-4 py-2 text-gray-500">{item.label}</div>
                                    <div className="w-1/2 px-4 py-2">
                                        {item.options ? (
                                            <Select
                                                className="w-full text-blue-500"
                                                defaultValue="Click to add"
                                                options={item.options.map((option) => ({ label: option, value: option }))}

                                            />
                                        ) : (
                                            <Input className="w-full" defaultValue={item.value} />
                                        )}
                                    </div>
                                </div>
                            ))} */}

                            {/* Preferred Age Range */}
                            {/* <div className="flex w-full">
                                <div className="w-1/2 px-4 py-2 text-gray-500">Preferred Age Range</div>
                                <div className="w-1/2 px-4 py-2">
                                    <Row gutter={8}>
                                        <Col span={11}>
                                            <Controller
                                                name="preferredAge.min"
                                                control={control}
                                                render={({ field: { value } }) => (
                                                    <InputNumber
                                                        min={18}
                                                        placeholder="Min Age"
                                                        className="w-full"
                                                        value={value !== undefined ? Number(value) : undefined}

                                                    />
                                                )}
                                            />
                                        </Col>
                                        <Col span={2} className="text-center">to</Col>
                                        <Col span={11}>
                                            <Controller
                                                name="preferredAge.max"
                                                control={control}
                                                render={({ field: { value } }) => (
                                                    <InputNumber
                                                        min={18}
                                                        placeholder="Max Age"
                                                        className="w-full"
                                                        value={value !== undefined ? Number(value) : undefined}

                                                    />
                                                )}
                                            />
                                        </Col>
                                    </Row>
                                </div>
                            </div> */}

                            {/* Preferred Height */}
                            {/* <div className="flex w-full">
                                <div className="w-1/2 px-4 py-2 text-gray-500">Preferred Height</div>
                                <div className="w-1/2 px-4 py-2">
                                    <Row gutter={8}>
                                        <Col span={11}>
                                            <Controller
                                                name="preferredHeight.min"
                                                control={control}
                                                render={({ field: { onChange, value } }) => (
                                                    <Select
                                                        options={heightOptions}
                                                        placeholder="Min Height"
                                                        className="w-full"
                                                        onChange={onChange}
                                                        value={value || null}
                                                    />
                                                )}
                                            />
                                        </Col>
                                        <Col span={2} className="text-center">to</Col>
                                        <Col span={11}>
                                            <Controller
                                                name="preferredHeight.max"
                                                control={control}
                                                render={({ field: { onChange, value } }) => (
                                                    <Select
                                                        options={heightOptions}
                                                        placeholder="Max Height"
                                                        className="w-full"
                                                        onChange={onChange}
                                                        value={value || null}
                                                    />
                                                )}
                                            />
                                        </Col>
                                    </Row>
                                </div>
                            </div>
                        </div> */}
=======
>>>>>>> origin/dev_krishna
                    </TabPane>



                </Tabs>
            </div>

        </div>
    );
};

export default Form;
