import { useEffect, useState } from "react";
import { useForm, Controller, Control, FieldPath } from "react-hook-form";
import { submissionFormById, submitSubmissionForm, uploadImage } from "../../config/apiClient";
import { Form, Input, Select, Button, Row, Col, Card, message, DatePicker } from "antd";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';



import logo from "../../components/images/logo.png";


interface Field {
    _id: string;
    label: string;
    attributeName: string;
    attributeType: string;
    attributeOption?: string[];
    attributePlaceHolder?: string;
}


interface Group {
    group: { _id: string };
    fields: Field[];
}



type FormValues = {
    BasicDetail: {
        firstName: string;
        middleName: string;
        lastName: string;
        email: string;
        Number: string;
        address: {
            street: string;
            city: string;
            stateOrProvince: string;
            postalCode: string;
        };
    };
    profile: Record<string, string>;
    match: Record<string, string>;
};
const basicDetailKeys: Array<keyof FormValues["BasicDetail"]> = [
    "firstName",
    "middleName",
    "lastName",
    "email",
    "Number",
];

const addressKeys: Array<keyof FormValues["BasicDetail"]["address"]> = [
    "street",
    "city",
    "stateOrProvince",
    "postalCode",
];

type CustomField = {
    _id: string;
    label: string;
    attributeName: string;
    attributeType: "text" | "select" | "Image";
    attributePlaceHolder?: string;
};

interface RenderFieldProps {
    field: CustomField;
    name: FieldPath<FormValues>;
    options?: string[];
    control: Control<FormValues>;
    requiredProfileFieldNames: string[];
    handleImageUpload: (fieldId: string, file: File) => Promise<void>;
    uploadedImages: Record<string, string>;
}

const Index = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<any>(null);
    const [uploadedImages, setUploadedImages] = useState<Record<string, string>>({});

    const [loading, setLoading] = useState(true);
    const { control, handleSubmit } = useForm<FormValues>({
        defaultValues: {
            BasicDetail: {
                firstName: "",
                middleName: "",
                lastName: "",
                email: "",
                Number: "",
                address: {
                    street: "",
                    city: "",
                    stateOrProvince: "",
                    postalCode: "",
                },
            },
            profile: {},
            match: {},
        },
    });

    const [, setBackendMessage] = useState<string | null>(null);

    const onSubmit = async (data: any) => {
        try {
            const payload: any = {
                BasicDetail: {
                    firstName: data.BasicDetail.firstName,
                    middleName: data.BasicDetail.middleName,
                    lastName: data.BasicDetail.lastName,
                    email: data.BasicDetail.email,
                    Number: data.BasicDetail.Number,
                    address: {
                        street: data.BasicDetail.address.street,
                        city: data.BasicDetail.address.city,
                        stateOrProvince: data.BasicDetail.address.stateOrProvince,
                        postalCode: data.BasicDetail.address.postalCode,
                    },
                },
            };

            // ✅ ProfileDetails logic...
            if (formData?.ProfileDetails && Array.isArray(formData.ProfileDetails)) {
                const profileGroups = (formData.ProfileDetails as Group[])
                    .map((group: Group) => {
                        const filledFields = group.fields
                            .filter((field: Field) => {
                                const value = data.profile?.[field.attributeName];
                                return value !== undefined && value !== null && value !== "";
                            })
                            .map((field: Field) => {
                                const fieldValue = data.profile[field.attributeName];

                                // ✅ Store gender in localStorage if this field is gender
                                if (field.attributeName.toLowerCase() === "gender") {
                                    localStorage.setItem("gender", fieldValue);
                                }

                                return {
                                    fieldId: field._id,
                                    value: fieldValue,
                                };
                            });

                        if (filledFields.length > 0) {
                            return {
                                group: group.group._id,
                                fields: filledFields,
                            };
                        }
                        return null;
                    })
                    .filter((group): group is { group: string; fields: { fieldId: string; value: any }[] } => group !== null);

                payload.ProfileDetails = profileGroups;
            }



            // ✅ MatchDetails logic...
            if (formData?.matchDetails && data.match) {
                const matchGroups = formData.matchDetails.map((group: any) => {
                    const filledFields = group.fields
                        .filter((field: any) => {
                            const value = data.match?.[field._id];
                            return value !== undefined && value !== null && value !== "";
                        })
                        .map((field: any) => ({
                            fieldId: field._id,
                            value: data.match[field._id],
                        }));

                    return {
                        group: group.group._id,
                        fields: filledFields,
                    };
                });

                payload.matchDetails = matchGroups;
            }

            const response = await submitSubmissionForm(payload);
            console.log("Submission successful:", response);

            if (response.success) {
                localStorage.setItem("isRegistered", "true");
                setBackendMessage(response.message);
                message.success(response.message);
                navigate("/suggestions");
            } else {
                setBackendMessage("Submission failed, please try again later.");
                message.error("Submission failed, please try again later.");
            }
        } catch (error) {
            console.error("Submission error:", error);
            setBackendMessage("Submission failed, please try again later.");
            message.error("Submission failed, please try again later.");
        }
    };




    const handleImageUpload = async (fieldId: string, file: File) => {
        try {
            const response = await uploadImage(file);
            if (response?.url) {
                setUploadedImages((prev) => ({
                    ...prev,
                    [fieldId]: response.url,
                }));
            }
        } catch (error) {
            console.error("Image upload failed", error);
        }
    };



    useEffect(() => {
        const fetchForm = async () => {
            try {
                const response = await submissionFormById("67f785c0d5c289909144adbc");
                setFormData(response);
            } catch (error) {
                console.error("Error fetching form:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchForm();
    }, []);

    if (loading) return <div>Loading...</div>;

    const requiredBasicFields: Array<keyof FormValues["BasicDetail"]> = [
        "firstName",
        "lastName",
        "email",
        "Number",
    ];
    const requiredProfileFieldNames = ["Gender", "Religion"];
    const requiredMatchFieldLabels = ["Preferred Gender", "Preferred Religion"];

    const renderFieldByType = ({
        field,
        name,
        options = [],
        control,
        requiredProfileFieldNames,
        requiredBasicFields,
        requiredMatchFieldLabels,
        handleImageUpload,
        uploadedImages,
    }: RenderFieldProps & {
        requiredProfileFieldNames: string[];
        requiredBasicFields: Array<keyof FormValues["BasicDetail"]>;
        requiredMatchFieldLabels: string[];
    }) => {
        const isProfileRequired = requiredProfileFieldNames.includes(field.attributeName);
        const isBasicRequired = requiredBasicFields.includes(field.attributeName as keyof FormValues["BasicDetail"]);
        const isMatchRequired = requiredMatchFieldLabels.includes(field.label);
        const isRequired = isProfileRequired || isBasicRequired || isMatchRequired;
        const rules = isRequired ? { required: `${field.attributeName || field.label} is required` } : undefined;

        // Date field (Birthday, etc.)
        if (field.attributeName?.toLowerCase().includes("birthday")) {
            return (
                <Controller
                    name={name}
                    control={control}
                    rules={rules}
                    render={({ field: controllerField }) => (
                        <DatePicker
                            {...controllerField}
                            format="YYYY-MM-DD"
                            className="w-full"
                            placeholder={field.attributePlaceHolder}
                            value={
                                typeof controllerField.value === "string" || typeof controllerField.value === "number"
                                    ? dayjs(controllerField.value)
                                    : null
                            }
                            onChange={(date) =>
                                controllerField.onChange(date ? date.format("YYYY-MM-DD") : "")
                            }
                        />
                    )}
                />
            );
        }

        // Height field (Height selector)
        if (field.attributeName?.toLowerCase().includes("height")) {
            const heightOptions: string[] = [];
            for (let feet = 4; feet <= 7; feet++) {
                for (let inch = 0; inch <= 11; inch++) {
                    heightOptions.push(`${feet}'${inch}"`);
                }
            }
            return (
                <Controller
                    name={name}
                    control={control}
                    rules={rules}
                    render={({ field: controllerField }) => (
                        <Select
                            {...controllerField}
                            className="w-full"
                            placeholder={field.attributePlaceHolder || "Select Height"}
                            onChange={controllerField.onChange}
                            value={controllerField.value}
                        >
                            {heightOptions.map((opt) => (
                                <Select.Option key={opt} value={opt}>
                                    {opt}
                                </Select.Option>
                            ))}
                        </Select>
                    )}
                />
            );
        }

        if (field.attributeType === "text") {
            return (
                <Controller
                    name={name}
                    control={control}
                    rules={rules}
                    render={({ field: controllerField }) => (
                        <Input
                            {...controllerField}
                            placeholder={field.attributePlaceHolder || "Enter text"}
                            value={String(controllerField.value || "")} // Ensuring value is always a string
                            onChange={(e) => controllerField.onChange(e.target.value)} // Manually handling input changes
                        />
                    )}
                />
            );
        }



        // Select field (dropdown)
        if (field.attributeType === "select") {
            return (
                <Controller
                    name={name}
                    control={control}
                    rules={rules}
                    render={({ field: controllerField }) => (
                        <Select
                            {...controllerField}
                            placeholder={field.attributePlaceHolder || "Select"}
                            onChange={controllerField.onChange}
                            value={controllerField.value}
                        >
                            {options.map((opt) => (
                                <Select.Option key={opt} value={opt}>
                                    {opt}
                                </Select.Option>
                            ))}
                        </Select>
                    )}
                />
            );
        }

        // Image upload field
        if (field.attributeType === "Image") {
            return (
                <div>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                await handleImageUpload(field._id, file);
                            }
                        }}
                    />
                    {uploadedImages[field._id] && (
                        <img
                            src={uploadedImages[field._id]}
                            alt="Uploaded"
                            className="mt-2 rounded border w-32 h-auto"
                        />
                    )}
                </div>
            );
        }

        // Fallback for unsupported field types
        return <Input disabled placeholder="Unsupported field type" />;
    };






    return (
        <div className="max-w-5xl mx-auto p-8">
            <div className="text-center mb-6">
                <img src={logo} alt="Logo" className="w-32 mx-auto mb-3" />
                <h2 className="text-3xl font-bold text-[rgb(174,8,71)]">Client Submission Form</h2>
            </div>

            <Card className="shadow-lg rounded-xl border border-gray-200 p-6 bg-white">
                <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
                    <h3 className="text-xl font-semibold text-[rgb(174,8,71)] mb-4">Basic Details</h3>
                    <Row gutter={16}>
                        {basicDetailKeys.map((key) => (
                            <Col span={12} key={key} className="mb-4">
                                <Form.Item
                                    label={`${key.charAt(0).toUpperCase() + key.slice(1)}`}
                                    required={requiredBasicFields.includes(key)}
                                >
                                    <Controller
                                        name={`BasicDetail.${key}` as const}
                                        control={control}
                                        rules={
                                            requiredBasicFields.includes(key)
                                                ? { required: `${key} is required` }
                                                : undefined
                                        }
                                        defaultValue={
                                            typeof formData?.BasicDetail?.[key] === 'string'
                                                ? formData.BasicDetail[key]
                                                : ''
                                        }
                                        render={({ field }) => {
                                            if (key === 'Number') {
                                                return (
                                                    <PhoneInput
                                                        {...field}
                                                        country="us"
                                                        value={typeof field.value === 'string' ? field.value : ''}
                                                        onChange={(value) => field.onChange(value)}
                                                        placeholder="Enter phone number"
                                                        inputStyle={{ width: '100%' }}
                                                    />
                                                );
                                            }

                                            return (
                                                <Input
                                                    {...field}
                                                    value={typeof field.value === 'string' ? field.value : ''}
                                                    placeholder={`Enter ${key}`}
                                                />
                                            );
                                        }}
                                    />

                                </Form.Item>
                            </Col>
                        ))}

                        {addressKeys.map((key) => (
                            <Col span={12} key={key} className="mb-4">
                                <Form.Item label={key.charAt(0).toUpperCase() + key.slice(1)}>
                                    <Controller
                                        name={`BasicDetail.address.${key}` as const}
                                        control={control}
                                        defaultValue={formData?.BasicDetail?.address?.[key] ?? ""}
                                        render={({ field }) => (
                                            <Input {...field} placeholder={`Enter ${key}`} />
                                        )}
                                    />
                                </Form.Item>
                            </Col>
                        ))}
                    </Row>


                    {formData?.ProfileDetails?.map((group: any) => (
                        <div key={group._id}>
                            <h4 className="text-lg font-medium text-[rgb(174,8,71)] mt-5 mb-3">
                                {group.group?.name}
                            </h4>
                            <Row gutter={16}>
                                {group.fields.map((field: any) => {
                                    // Ensure correct name formatting
                                    const name = `profile.${field.attributeName}` as FieldPath<FormValues>;

                                    return (
                                        <Col span={12} key={field._id} className="mb-4">
                                            <Form.Item
                                                label={
                                                    <>
                                                        {field.attributeName}
                                                        {requiredProfileFieldNames.includes(field.attributeName) && (
                                                            <span className="text-red-500 ml-1">*</span>
                                                        )}
                                                    </>
                                                }
                                            >
                                                {renderFieldByType({
                                                    field,
                                                    name: name as FieldPath<FormValues>,
                                                    options: field.attributeOption,
                                                    control,
                                                    requiredProfileFieldNames,
                                                    requiredBasicFields,
                                                    requiredMatchFieldLabels,
                                                    handleImageUpload,
                                                    uploadedImages,
                                                })}
                                            </Form.Item>
                                        </Col>
                                    );
                                })}
                            </Row>
                        </div>
                    ))}





                    {formData?.matchDetails?.map((group: any) => (
                        <div key={group._id}>
                            <h4 className="text-lg font-medium text-[rgb(174,8,71)] mt-5 mb-3">{group.group?.name}</h4>
                            <Row gutter={16}>
                                {group.fields.map((field: any) => (
                                    <Col span={12} key={field._id} className="mb-4">
                                        <Form.Item
                                            label={
                                                <>
                                                    {field.label}
                                                    {requiredMatchFieldLabels.includes(field.label) && (
                                                        <span className="text-red-500 ml-1">*</span>
                                                    )}
                                                </>
                                            }
                                        >
                                            <Controller
                                                name={`match.${field._id}`}
                                                control={control}
                                                render={({ field: controllerField }) => (
                                                    <Input {...controllerField} placeholder={field.label} />
                                                )}
                                            />
                                        </Form.Item>
                                    </Col>
                                ))}
                            </Row>
                        </div>
                    ))}

                    <Form.Item className="flex justify-center mt-6">
                        <Button type="primary" htmlType="submit" className="!bg-[rgb(174,8,71)] !border-none">
                            Submit Application
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default Index;
