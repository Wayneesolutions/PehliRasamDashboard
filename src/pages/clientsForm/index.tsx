import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { submissionFormById, submitSubmissionForm, uploadImage } from "../../config/apiClient";
import { Form, Input, Select, Button, Row, Col, Card, message, DatePicker } from "antd";
import type { Dayjs } from "dayjs";
import logo from "../../components/images/logo.png";

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
const Index = () => {
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

    const [backendMessage, setBackendMessage] = useState<string | null>(null);

    const onSubmit = async (data: any) => {
        try {
            const payload: any = {
                BasicDetail: {
                    firstName: data.BasicDetail.firstName,
                    middleName: data.BasicDetail.middleName,
                    lastName: data.BasicDetail.lastName,
                    email: data.BasicDetail.email,
                    Number: data.BasicDetail.Number, // Include the new field
                    address: {
                        street: data.BasicDetail.address.street,
                        city: data.BasicDetail.address.city,
                        stateOrProvince: data.BasicDetail.address.stateOrProvince,
                        postalCode: data.BasicDetail.address.postalCode,
                    },
                },
            };

            // Only include ProfileDetails if they are filled
            if (formData?.ProfileDetails) {
                payload.ProfileDetails = formData.ProfileDetails.map((group: any) => {
                    const filledFields = group.fields
                        .filter((field: any) => data.profile?.[field._id] && data.profile?.[field._id] !== "") // Only include non-empty fields
                        .map((field: any) => ({
                            fieldId: field._id,
                            value: data.profile?.[field._id] || "", // Default to empty if not filled
                        }));

                    if (filledFields.length > 0) {
                        return {
                            group: group.group._id,
                            fields: filledFields,
                        };
                    }
                    return null; // Skip groups with all empty fields
                }).filter((group: any) => group !== null); // Remove null groups
            }

            // Only include matchDetails if they are filled
            if (formData?.matchDetails) {
                payload.matchDetails = formData.matchDetails.map((group: any) => {
                    const filledFields = group.fields
                        .filter((field: any) => data.match?.[field._id] && data.match?.[field._id] !== "") // Only include non-empty fields
                        .map((field: any) => ({
                            fieldId: field._id,
                            value: data.match?.[field._id] || "", // Default to empty if not filled
                        }));

                    if (filledFields.length > 0) {
                        return {
                            group: group.group._id,
                            fields: filledFields,
                        };
                    }
                    return null; // Skip groups with all empty fields
                }).filter((group: any) => group !== null); // Remove null groups
            }

            const response = await submitSubmissionForm(payload);
            console.log("Submission successful:", response);

            if (response.success) {
                setBackendMessage(response.message); // Display success message
                message.success(response.message); // Show success notification
            } else {
                setBackendMessage("Submission failed, please try again later.");
                message.error("Submission failed, please try again later."); // Show error notification
            }
        } catch (error) {
            console.error("Submission error:", error);
            setBackendMessage("Submission failed, please try again later.");
            message.error("Submission failed, please try again later."); // Show error notification
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

    const requiredBasicFields = ["firstName", "lastName", "email", "Number"];
    const requiredProfileFieldNames = ["Gender"];

    const renderFieldByType = (field: any, name: string, options: string[] = []) => {
        const rules = requiredProfileFieldNames.includes(field.attributeName)
            ? { required: `${field.attributeName} is required` }
            : undefined;

        if (field.attributeName.toLowerCase().includes("birthday")) {
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
                            onChange={(date, dateString) =>
                                controllerField.onChange(
                                    typeof dateString === "string" ? dateString : dateString[0]
                                )
                            }
                        />
                    )}
                />
            );
        }

        if (field.attributeName.toLowerCase().includes("height")) {
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

        // 📝 Default text
        if (field.attributeType === "text") {
            return (
                <Controller
                    name={name}
                    control={control}
                    rules={rules}
                    render={({ field: controllerField }) => (
                        <Input {...controllerField} placeholder={field.attributePlaceHolder} />
                    )}
                />
            );
        }

        // 📋 Dropdowns
        if (field.attributeType === "select") {
            return (
                <Controller
                    name={name}
                    control={control}
                    rules={rules}
                    render={({ field: controllerField }) => (
                        <Select
                            {...controllerField}
                            placeholder={field.attributePlaceHolder}
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

        // 🖼️ Image upload
        if (field.attributeType === "Image") {
            return (
                <>
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
                            className="mt-2 rounded border w-32"
                        />
                    )}
                </>
            );
        }

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
                                <Form.Item label={key.charAt(0).toUpperCase() + key.slice(1)}>
                                    <Controller
                                        name={`BasicDetail.${key}` as const}
                                        control={control}
                                        rules={requiredBasicFields.includes(key) ? { required: `${key} is required` } : undefined}

                                        defaultValue={formData?.BasicDetail?.[key] ?? ""}
                                        render={({ field }) => (
                                            <Input
                                                {...field}
                                                value={typeof field.value === "string" ? field.value : ""}
                                                placeholder={`Enter ${key}`}
                                            />
                                        )}

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
                            <h4 className="text-lg font-medium text-[rgb(174,8,71)] mt-5 mb-3">{group.group?.name}</h4>
                            <Row gutter={16}>
                                {group.fields.map((field: any) => {
                                    const name = `profile.${field.attributeName}`; // Use attributeName consistently
                                    return (
                                        <Col span={12} key={field._id} className="mb-4">
                                            <Form.Item
                                                label={
                                                    <>
                                                        {field.attributeName}
                                                        {(requiredProfileFieldNames.includes(field.attributeName) || field.attributeStatus) && (
                                                            <span className="text-red-500 ml-1">*</span>
                                                        )}
                                                    </>
                                                }
                                            >
                                                {renderFieldByType(field, name, field.attributeOption)}
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
                                                    {field.dealBreak && <span className="text-red-500 ml-1">*</span>}
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
            {backendMessage && <div className="mt-4 text-center text-lg font-semibold">{backendMessage}</div>}
        </div>
    );
};

export default Index;
