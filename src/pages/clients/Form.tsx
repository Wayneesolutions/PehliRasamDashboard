import { Select, Row, Col, InputNumber, Collapse, Input, Button, message, Spin, Tabs } from "antd";
import { useForm, Controller } from "react-hook-form";
import { useEffect, useState } from "react";
// import { getFormGroupList } from "./Actions";
import { getCustomerMatchPreferencesDetail, getFromGroupList, updateCustomerProfile } from "../../config/apiClient";

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
    fieldValueOptions:any
}

interface IGroup {
    groupId: string;
    groupName: string;
    fields: IField[];
}

const Form = ({customerId}:{customerId:string}) => {
    const { control } = useForm();
    const { handleSubmit } = useForm();
    const [formData, setFormData] = useState<IGroup[]>([]);
    const [matchdata,setMatchData] = useState<any>([])
    const [loading, setLoading] = useState(false);
   
    useEffect(()=>{
        if(customerId){
            async function getCutsomerMatch(){
            const res = await getCustomerMatchPreferencesDetail(customerId)
            if(res.success){
                setMatchData(res.data) 
            }
        }
        getCutsomerMatch()
        }
     
    },[])
console.log('matchdata===',matchdata);
    useEffect(() => {
        setLoading(true);
        getFromGroupList()
            .then((data) => {
                console.log('=======================',data)
                if (Array.isArray(data.data)) {
                    console.log('data.data======',data.data);
                    
                    const formattedData = data.data.map((group: any) => ({
                        groupId: group._id,
                        groupName: group.groupName,
                        fields: Array.isArray(group.fields)
                            ? group.fields.map((field: any) => ({
                                fieldId: field.attributeId,
                                fieldName: field.attributeName || "Unknown Field",
                                fieldValueOptions: field.attributeOption || [],
                                value: "",
                            }))
                            : [],
                    }));
                    console.log('formated grougps==========',formattedData);
                    
                    setFormData(formattedData);
                } else {
                    console.error("Unexpected API response format:", data);
                    message.error("Invalid data format received from server.");
                }
            })
            .catch((error) => {
                console.error("API Error:", error);
                message.error("Failed to fetch form groups. Please try again.");
            })
            .finally(() => setLoading(false));
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

    const transformFormData = (formData: any, customerId: any): any => {
        const result: any = {
          customerId,
          dynamicValue: []
        };
      
        formData.forEach((group: any) => {
          const groupId: any = group.groupId;
          const groupFields: any[] = [];
      
          if (group.fields && group.fields.length > 0) {
            group.fields.forEach((field: any) => {
              if (field.value !== undefined && field.value !== "") {
                groupFields.push({
                  fieldID: field.fieldId,
                  fieldValue: field.value
                });
              }
            });
      
            if (groupFields.length > 0) {
              result.dynamicValue.push({
                groupId,
                groupFields
              });
            }
          }
        });
      
        return result;
      };
      

    const onSubmit = async () => {
        setLoading(true);
        const apiData: any = transformFormData(formData, customerId);
                
        try {
             await updateCustomerProfile(apiData)
        } catch (error: any) {
          console.error('Error:', error);
        }
        
        setLoading(false);
    };

    if (loading) return <Spin size="large" className="flex justify-center mt-10" />;
    if (!formData.length) return <div>No data found</div>;

    return (
        <div className="p-6 bg-white shadow-md rounded-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Form Groups</h2>
                <Button type="primary" onClick={handleSubmit(onSubmit)} loading={loading}>
                    Save
                </Button>
            </div>

            <div className="flex w-full">
                {/* Tabs */}
                <Tabs defaultActiveKey="1" className="w-full">
                    {/* Dynamic Form Tab */}
                    <TabPane tab="Form Groups" key="1">
                        <div className="w-full">
                            <Collapse className="w-full border border-gray-200 rounded-md" expandIconPosition="start">
                                {formData.map((group, index) => (
                                    <Panel header={group.groupName} key={group.groupId || index} className="w-full">
                                        {group.fields.length > 0 ? (
                                            group.fields.map((field) => (
                                                <div key={field.fieldId} className="flex mb-3">
                                                    <label className="w-1/3 text-gray-600">{field.fieldName}</label>
                                                    <select
                                                        className="w-2/3 border p-2 rounded"
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
                                    </Panel>
                                ))}
                            </Collapse>
                        </div>
                    </TabPane>

                    {/* Static Preferences Tab */}
                    <TabPane tab="Matching Preferences" key="2">
                    <div className="w-full">
                            <Collapse className="w-full border border-gray-200 rounded-md" expandIconPosition="start">
                                {matchdata.map((group:any, index:any) => (
                                    <Panel header={group.groupName} key={group.groupId || index} className="w-full">
                                        {group.fields.length > 0 ? (
                                            group.fields.map((field:any) => (
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
                                                className="text-blue-500 w-full"
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
                    </TabPane>
                </Tabs>
            </div>

        </div>
    );
};

export default Form;
