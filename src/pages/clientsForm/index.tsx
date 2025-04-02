import { Form, Input, Button, Select, DatePicker, Row, Col, Card, message, Upload, InputNumber } from "antd";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import apiClient from "../../config/apiClient";
import logo from "../../components/images/logo.png";
import schema from "../../schema/customernew";
import { UploadOutlined } from "@ant-design/icons";
import TextArea from "antd/es/input/TextArea";
import { UploadFile } from "antd/es/upload/interface";
import { useNavigate } from "react-router-dom";

const { Option } = Select;

interface CountryOption {
    value: string;
    latlng: [number, number];
    label: string;
}


const fetchCountries = async (): Promise<CountryOption[]> => {


    try {
        const response = await fetch("https://restcountries.com/v3.1/all");
        const data: any[] = await response.json();
        return data
            .map((country: { name: { common: string }; cca2: string; latlng?: [number, number] }) => ({
                value: country.cca2,
                label: country.name.common,
                latlng: country.latlng || [0, 0],
            }))
            .sort((a, b) => a.label.localeCompare(b.label));
    } catch (error) {
        message.error("Failed to fetch countries.");
        return [];
    }
};




const ClientSubmissionForm = () => {

    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [countries, setCountries] = useState<CountryOption[]>([]);

    const [fileList, setFileList] = useState<UploadFile[]>([]);

    const handleChange = ({ fileList }: { fileList: UploadFile[] }) => setFileList(fileList);


    const { control, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            personalDetails: {
                fullName: "",
                email: "",
                contactNumber: "",
                country: "",
                location: "",
            },
            basicInformation: {
                gender: undefined,
                birthdate: "",
                height: "",
            },
            educationProfession: {
                employment: "",
                education: "",
            },
            familyDetails: {
                fatherName: "",
                motherName: "",
            },
            matchPreferences: {
                preferredGender: undefined,
                preferredAgeRange: { min: 18, max: 100 },
                vegetarianPreference: false,
                drinkAlcohol: false,
            },
        },
    });


    useEffect(() => {
        const loadCountries = async () => {
            const countryData = await fetchCountries();
            setCountries(countryData);
        };
        loadCountries();
    }, []);





    const onSubmit = async (values: any) => {
        console.log(values, 'values')
        if (fileList.length === 0) {
            message.error("Please upload at least one image.");
            return;
        }

        setLoading(true);
        try {


            const formData = new FormData();
            fileList.forEach((file) => formData.append("images", file.originFileObj as Blob));

            const response = await apiClient.post("/user/register", { ...values, images: formData });


            message.success(response.data.message);

            localStorage.setItem("isRegistered", "true");
            localStorage.setItem("registeredGender", values.preferredGender);


            setFileList([]);

            setTimeout(() => {
                navigate(`/suggestions`);
            }, 2000);
        } catch (error: unknown) {
            console.error("Error saving client:", error);
        
            let errorMessage = "Error saving client.";
        
            if (error instanceof Error) {
                // Type assertion for potential Axios error structure
                const axiosError = error as { response?: { data?: { message?: string } } };
                errorMessage = axiosError.response?.data?.message || errorMessage;
            }
        
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
        
    };


    console.log(errors, 'errors')

    return (
        <div className="max-w-4xl mx-auto p-8">
            <div className="text-center mb-6">
                <img src={logo} alt="Logo" className="w-32 mx-auto mb-3" />
                <h2 className="text-3xl font-bold text-[rgb(174,8,71)]">Client Submission Form</h2>
            </div>

            <Card className="shadow-lg rounded-xl border border-gray-200 p-6 bg-white">

                <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
                    <h3 className="text-xl font-semibold text-[rgb(174,8,71)] mb-4">Personal Details</h3>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label={
                                    <>
                                        Full Name <span style={{ color: "red" }}>*</span>
                                    </>
                                }
                                validateStatus={errors.personalDetails?.fullName ? "error" : ""}
                                help={errors.personalDetails?.fullName?.message}
                            >
                                <Controller
                                    name="personalDetails.fullName"
                                    control={control}
                                    render={({ field }) => (
                                        <Input {...field} placeholder="Enter your Name" />
                                    )}
                                />
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item
                                label={
                                    <>
                                        Email <span style={{ color: "red" }}>*</span>
                                    </>
                                }
                                validateStatus={errors.personalDetails?.email ? "error" : ""}
                                help={errors.personalDetails?.email?.message}
                            >
                                <Controller
                                    name="personalDetails.email"
                                    control={control}
                                    render={({ field }) => (
                                        <Input {...field} placeholder="Enter your Email Address" />
                                    )}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label={
                                    <>
                                        Contact Number <span style={{ color: "red" }}>*</span>
                                    </>
                                }
                                validateStatus={errors.personalDetails?.contactNumber ? "error" : ""}
                                help={errors.personalDetails?.contactNumber?.message}
                            >
                                <Controller
                                    name="personalDetails.contactNumber"
                                    control={control}
                                    rules={{ required: "Contact Number is required" }}
                                    render={({ field: { onChange, value } }) => (
                                        <PhoneInput
                                            value={value}
                                            onChange={onChange}
                                            international
                                            placeholder="Enter your Contact Number"
                                            className="ant-input border border-gray-300 rounded-md p-2"
                                            defaultCountry={undefined}
                                        />
                                    )}
                                />
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item
                                label={
                                    <>
                                        Country <span style={{ color: "red" }}>*</span>
                                    </>
                                }
                                validateStatus={errors.personalDetails?.country ? "error" : ""}
                                help={errors.personalDetails?.country?.message}
                            >
                                <Controller
                                    name="personalDetails.country"
                                    control={control}
                                    rules={{ required: "Country is required" }}
                                    render={({ field }) => (
                                        <Select
                                            {...field}
                                            onChange={(value) => field.onChange(value)}
                                            placeholder="Select country"
                                        >
                                            {countries.map(({ value, label }) => (
                                                <Option key={value} value={value}>
                                                    {label} ({value})
                                                </Option>
                                            ))}
                                        </Select>
                                    )}
                                />
                            </Form.Item>
                        </Col>
                    </Row>


                    <Form.Item
                        label={
                            <>
                                Location/ Town City/ Village <span style={{ color: "red" }}>*</span>
                            </>
                        }
                        validateStatus={errors.personalDetails?.location ? "error" : ""}
                        help={errors.personalDetails?.location?.message}
                    >
                        <Controller
                            name="personalDetails.location"
                            control={control}
                            rules={{ required: "Location is required" }}
                            render={({ field }) => (
                                <TextArea {...field} placeholder="Enter your Location" />
                            )}
                        />
                    </Form.Item>



                    <h3 className="text-xl font-semibold text-[rgb(174,8,71)] mt-6 mb-4">Basic Information</h3>
                    <Row gutter={16}>
                        {/* Gender Selection */}
                        <Col span={12}>
                            <Form.Item
                                label={<>Gender <span style={{ color: "red" }}>*</span></>}
                                validateStatus={errors.basicInformation?.gender ? "error" : ""}
                                help={errors.basicInformation?.gender?.message}
                            >
                                <Controller
                                    name="basicInformation.gender"
                                    control={control}
                                    rules={{ required: "Gender is required" }}
                                    render={({ field }) => (
                                        <Select {...field} placeholder="Select your Gender">
                                            <Select.Option value="Male">Male</Select.Option>
                                            <Select.Option value="Female">Female</Select.Option>
                                        </Select>
                                    )}
                                />
                            </Form.Item>
                        </Col>

                        {/* Religion Selection */}
                        <Col span={12}>
                            <Form.Item
                                label={<>Religion <span style={{ color: "red" }}>*</span></>}
                                validateStatus={errors.basicInformation?.religion ? "error" : ""}
                                help={errors.basicInformation?.religion?.message}
                            >
                                <Controller
                                    name="basicInformation.religion"
                                    control={control}
                                    rules={{ required: "Religion is required" }}
                                    render={({ field }) => (
                                        <Select {...field} placeholder="Select Religion">
                                            {[
                                                "Sikh", "Hindu", "Jain", "Buddhist",
                                                "Spiritual", "Muslim", "Christian", "Other"
                                            ].map((religion) => (
                                                <Select.Option key={religion} value={religion}>
                                                    {religion}
                                                </Select.Option>
                                            ))}
                                        </Select>
                                    )}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        {/* Marital Status */}
                        <Col span={12}>
                            <Form.Item
                                label={<>Marital Status <span style={{ color: "red" }}>*</span></>}
                                validateStatus={errors.basicInformation?.maritalStatus ? "error" : ""}
                                help={errors.basicInformation?.maritalStatus?.message}
                            >
                                <Controller
                                    name="basicInformation.maritalStatus"
                                    control={control}
                                    rules={{ required: "Marital Status is required" }}
                                    render={({ field }) => (
                                        <Select
                                            {...field}
                                            placeholder="Select marital status"
                                            onChange={(value) => field.onChange(value)}
                                            value={field.value ?? null}
                                        >
                                            {[
                                                "Never Married", "Divorced", "Widowed", "Separated", "Annulled",
                                                "Divorced(1 child, Living Together)", "Divorced(2 children, Living Together)",
                                                "Divorced(3 children, Living Together)", "Awaiting Divorce",
                                                "Widowed(1 child, Living Together)", "Divorced(Without child)"
                                            ].map((status) => (
                                                <Select.Option key={status} value={status}>
                                                    {status}
                                                </Select.Option>
                                            ))}
                                        </Select>
                                    )}
                                />
                            </Form.Item>
                        </Col>

                        {/* Birthdate */}
                        <Col span={12}>
                            <Form.Item
                                label={<>Birthdate <span style={{ color: "red" }}>*</span></>}
                                validateStatus={errors.basicInformation?.birthdate ? "error" : ""}
                                help={errors.basicInformation?.birthdate?.message}
                            >
                                <Controller
                                    name="basicInformation.birthdate"
                                    control={control}
                                    rules={{ required: "Birthdate is required" }}
                                    render={({ field: { onChange, value, ref } }) => (
                                        <DatePicker
                                            className="w-full"
                                            format="YYYY-MM-DD"
                                            placeholder="Select birthdate"
                                            value={value ? dayjs(value) : null}
                                            onChange={(date) => onChange(date ? date.format("YYYY-MM-DD") : null)}
                                            ref={ref}
                                        />
                                    )}
                                />
                            </Form.Item>
                        </Col>
                    </Row>


                    <Row gutter={16}>
                        {/* Caste */}
                        <Col span={12}>
                            <Form.Item
                                label="Caste"
                                validateStatus={errors.basicInformation?.caste ? "error" : ""}
                                help={errors.basicInformation?.caste?.message}
                            >
                                <Controller
                                    name="basicInformation.caste"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            {...field}
                                            placeholder="Select caste"
                                            onChange={(value) => field.onChange(value)}
                                            value={field.value ?? null}
                                        >
                                            {[
                                                "Ad Dharmi", "Ahluwalia", "Arora", "Baazigar", "Bhatia", "Bhatra", "Brahmin", "Baniya",
                                                "Chimba", "Ghumar", "Gujjar", "Sunyar (Gold Smith)", "Hindu Punjabi", "Intercaste",
                                                "Jatt (Sikh)", "Julahe", "Jain", "Jaat (Hindu)", "Kabir Panthi", "Kamboj", "Kashyap Rajput",
                                                "Khatri", "Kshatriya", "Lubana", "Mahajan", "Maid Rajput", "Mair Rajput", "Majabi",
                                                "Nai", "Parjapat", "Rai", "Rajput", "Ramdasia", "Ramgharia", "Ravidasia", "Saini",
                                                "Tonk Khatriya", "Other"
                                            ].map((caste) => (
                                                <Select.Option key={caste} value={caste}>
                                                    {caste}
                                                </Select.Option>
                                            ))}
                                        </Select>
                                    )}
                                />
                            </Form.Item>
                        </Col>

                        {/* Height */}
                        <Col span={12}>
                            <Form.Item
                                label="Height (ft & in)"
                                validateStatus={errors.basicInformation?.height ? "error" : ""}
                                help={errors.basicInformation?.height?.message}
                            >
                                <Controller
                                    name="basicInformation.height"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            {...field}
                                            placeholder="Select height"
                                            onChange={(value) => field.onChange(value)}
                                            value={field.value ?? null}
                                        >
                                            {Array.from({ length: 48 }, (_, i) => {
                                                const totalInches = i + 48;
                                                const feet = Math.floor(totalInches / 12);
                                                const inches = totalInches % 12;
                                                const height = `${feet}'${inches}"`;
                                                return (
                                                    <Select.Option key={height} value={height}>
                                                        {height}
                                                    </Select.Option>
                                                );
                                            })}
                                        </Select>
                                    )}
                                />
                            </Form.Item>
                        </Col>
                    </Row>


                    <h3 className="text-xl font-semibold text-[rgb(174,8,71)] mb-4">
                        Education & Profession
                    </h3>
                    <Row gutter={16}>
                        {/* Employment */}
                        <Col span={12}>
                            <Form.Item
                                label="Employment/ Job"
                                validateStatus={errors.educationProfession?.employment ? "error" : ""}
                                help={errors.educationProfession?.employment?.message}
                            >
                                <Controller
                                    name="educationProfession.employment"
                                    control={control}
                                    render={({ field: { onChange, value } }) => (
                                        <Input
                                            onChange={onChange}
                                            value={value ?? ""}
                                            placeholder="Enter your employment"
                                        />
                                    )}
                                />
                            </Form.Item>
                        </Col>

                        {/* Education */}
                        <Col span={12}>
                            <Form.Item
                                label="Education"
                                validateStatus={errors.educationProfession?.education ? "error" : ""}
                                help={errors.educationProfession?.education?.message}
                            >
                                <Controller
                                    name="educationProfession.education"
                                    control={control}
                                    render={({ field: { onChange, value } }) => (
                                        <Input
                                            onChange={onChange}
                                            value={value ?? ""}
                                            placeholder="Enter your education"
                                        />
                                    )}
                                />
                            </Form.Item>
                        </Col>
                    </Row>


                    <h3 className="text-xl font-semibold text-[rgb(174,8,71)] mb-4">
                        Family Details
                    </h3>
                    <Row gutter={16}>
                        {/* Father's Name */}
                        <Col span={12}>
                            <Form.Item
                                label="Father's Name"
                                validateStatus={errors.familyDetails?.fatherName ? "error" : ""}
                                help={errors.familyDetails?.fatherName?.message}
                            >
                                <Controller
                                    name="familyDetails.fatherName"
                                    control={control}
                                    render={({ field: { onChange, value } }) => (
                                        <Input
                                            onChange={onChange}
                                            value={value ?? ""}
                                            placeholder="Enter your Father's Name"
                                        />
                                    )}
                                />
                            </Form.Item>
                        </Col>

                        {/* Mother's Name */}
                        <Col span={12}>
                            <Form.Item
                                label="Mother's Name"
                                validateStatus={errors.familyDetails?.motherName ? "error" : ""}
                                help={errors.familyDetails?.motherName?.message}
                            >
                                <Controller
                                    name="familyDetails.motherName"
                                    control={control}
                                    render={({ field: { onChange, value } }) => (
                                        <Input
                                            onChange={onChange}
                                            value={value ?? ""}
                                            placeholder="Enter your Mother's Name"
                                        />
                                    )}
                                />
                            </Form.Item>
                        </Col>
                    </Row>


                    <h3 className="text-xl font-semibold text-[rgb(174,8,71)] mb-4">About Me</h3>
                    <Form.Item
                        label={
                            <span>
                                Upload Images <span style={{ color: "red" }}>*</span>
                            </span>
                        }
                        validateStatus={fileList.length === 0 ? "error" : ""}
                        help={fileList.length === 0 ? "Please upload at least one image" : ""}
                    >
                        <Controller
                            name="aboutMe.images"
                            control={control}
                            rules={{ required: "Please upload at least one image" }}
                            render={({ }) => (
                                <Upload
                                    listType="picture-card"
                                    fileList={fileList}
                                    beforeUpload={() => false}
                                    onChange={handleChange}
                                    multiple
                                >
                                    {fileList.length < 5 && <Button icon={<UploadOutlined />}>Upload</Button>}
                                </Upload>
                            )}
                        />
                    </Form.Item>


                    <h3 className="text-xl font-semibold text-[rgb(174,8,71)] mt-6 mb-4">Match Preferences</h3>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label={<span>Preferred Gender <span style={{ color: "red" }}>*</span></span>}
                                validateStatus={errors.matchPreferences?.preferredGender ? "error" : ""}
                                help={errors.matchPreferences?.preferredGender?.message}
                            >
                                <Controller
                                    name="matchPreferences.preferredGender"
                                    control={control}
                                    rules={{ required: "Preferred Gender is required" }}
                                    render={({ field }) => (
                                        <Select {...field} placeholder="Select your Gender">
                                            <Option value="Male">Male</Option>
                                            <Option value="Female">Female</Option>
                                        </Select>
                                    )}
                                />
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item
                                label={<span>Preferred Religion <span style={{ color: "red" }}>*</span></span>}
                                validateStatus={errors.matchPreferences?.preferredReligion ? "error" : ""}
                                help={errors.matchPreferences?.preferredReligion?.message}
                            >
                                <Controller
                                    name="matchPreferences.preferredReligion"
                                    control={control}
                                    rules={{ required: "Preferred Religion is required" }}
                                    render={({ field }) => (
                                        <Select {...field} placeholder="Select your Religion">
                                            {['Sikh', 'Hindu', 'Jain', 'Buddhist', 'Spiritual', 'Muslim', 'Christian', 'Other'].map((religion) => (
                                                <Option key={religion} value={religion}>{religion}</Option>
                                            ))}
                                        </Select>
                                    )}
                                />
                            </Form.Item>
                        </Col>
                    </Row>


                    <Row gutter={16}>
                        {/* Preferred Age Range */}
                        <Col span={12}>
                            <Form.Item label="Preferred Age Range">
                                <Row gutter={8}>
                                    <Col span={11}>
                                        <Controller
                                            name="matchPreferences.preferredAgeRange.min"
                                            control={control}
                                            render={({ field: { onChange, value } }) => (
                                                <InputNumber
                                                    min={18}
                                                    max={100}
                                                    placeholder="Min Age"
                                                    className="w-full"
                                                    value={value ?? undefined}
                                                    onChange={(val) => onChange(val ?? undefined)}
                                                />
                                            )}
                                        />
                                    </Col>
                                    <Col span={2} className="text-center">to</Col>
                                    <Col span={11}>
                                        <Controller
                                            name="matchPreferences.preferredAgeRange.max"
                                            control={control}
                                            render={({ field: { onChange, value } }) => (
                                                <InputNumber
                                                    min={18}
                                                    max={100}
                                                    placeholder="Max Age"
                                                    className="w-full"
                                                    value={value ?? undefined}
                                                    onChange={(val) => onChange(val ?? undefined)}
                                                />
                                            )}
                                        />
                                    </Col>
                                </Row>
                            </Form.Item>
                        </Col>

                        {/* Preferred Height */}
                        <Col span={12}>
                            <Form.Item label="Preferred Height">
                                <Row gutter={8}>
                                    <Col span={11}>
                                        <Controller
                                            name="matchPreferences.preferredHeight.min"
                                            control={control}
                                            rules={{ required: "Min height is required" }}
                                            render={({ field }) => (
                                                <InputNumber
                                                    {...field}
                                                    placeholder="Min Height (cm)"
                                                    min={100}
                                                    max={250}
                                                    onChange={(value) => field.onChange(value)}
                                                />
                                            )}
                                        />
                                    </Col>
                                    <Col span={2} className="text-center">to</Col>
                                    <Col span={11}>
                                        <Controller
                                            name="matchPreferences.preferredHeight.max"
                                            control={control}
                                            rules={{ required: "Max height is required" }}
                                            render={({ field }) => (
                                                <InputNumber
                                                    {...field}
                                                    placeholder="Max Height (cm)"
                                                    min={100}
                                                    max={250}
                                                    onChange={(value) => field.onChange(value)}
                                                />
                                            )}
                                        />
                                    </Col>
                                </Row>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        {/* Preferred Caste */}
                        <Col span={12}>
                            <Form.Item
                                label="Caste"
                                validateStatus={errors.matchPreferences?.caste ? "error" : ""}
                                help={errors.matchPreferences?.caste?.message}
                            >
                                <Controller
                                    name="matchPreferences.caste"
                                    control={control}
                                    render={({ field: { onChange, value } }) => (
                                        <Select
                                            placeholder="Select caste"
                                            onChange={onChange}
                                            value={value ?? undefined}
                                            allowClear
                                        >
                                            {[
                                                "Ad Dharmi", "Ahluwalia", "Arora", "Baazigar", "Bhatia", "Bhatra",
                                                "Brahmin", "Baniya", "Chimba", "Ghumar", "Gujjar", "Sunyar (Gold Smith)",
                                                "Hindu Punjabi", "Intercaste", "Jatt (Sikh)", "Julahe", "Jain",
                                                "Jaat (Hindu)", "Kabir Panthi", "Kamboj", "Kashyap Rajput", "Khatri",
                                                "Kshatriya", "Lubana", "Mahajan", "Maid Rajput", "Mair Rajput", "Majabi",
                                                "Nai", "Parjapat", "Rai", "Rajput", "Ramdasia", "Ramgharia", "Ravidasia",
                                                "Saini", "Tonk Khatriya", "Other",
                                            ].map((caste) => (
                                                <Select.Option key={caste} value={caste}>
                                                    {caste}
                                                </Select.Option>
                                            ))}
                                        </Select>
                                    )}
                                />
                            </Form.Item>
                        </Col>

                        {/* Preferred City */}
                        <Col span={12}>
                            <Form.Item
                                label="City Preferred"
                                validateStatus={errors.matchPreferences?.cityPreferred ? "error" : ""}
                                help={errors.matchPreferences?.cityPreferred?.message}
                            >
                                <Controller
                                    name="matchPreferences.cityPreferred"
                                    control={control}
                                    render={({ field: { onChange, value } }) => (
                                        <Select
                                            placeholder="Select City Preferred"
                                            onChange={onChange}
                                            value={value ?? undefined}
                                            allowClear
                                        >
                                            {[
                                                "Amritsar", "Barnala", "Bathinda", "Dera Bassi", "Delhi", "Chandigarh",
                                                "Faridkot", "Fatehgarh Sahib", "Firozpur", "Gurdaspur", "Gujarat",
                                                "Hoshiarpur", "Himachal Pradesh", "Haryana", "Jalandhar", "Jammu and Kashmir",
                                                "Kapurthala", "Khanna", "Ludhiana", "Mansa", "Moga", "Muktsar(Sri Muktsar Sahib)",
                                                "Nakodar", "Patiala", "Phagwara", "Rupnagar", "Rajasthan",
                                                "(Mohali)Sahibzada Ajit Singh Nagar", "Sangrur", "(Nawanshahr)Shahid Bhagat Singh Nagar",
                                                "Tarn Taran", "Uttarakhand", "Uttar Pradesh", "Zirakpur",
                                            ].map((city) => (
                                                <Select.Option key={city} value={city}>
                                                    {city}
                                                </Select.Option>
                                            ))}
                                        </Select>
                                    )}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="Preferred Appearance"
                                validateStatus={errors.matchPreferences?.preferredAppearance ? "error" : ""}
                                help={errors.matchPreferences?.preferredAppearance?.message}
                            >
                                <Controller
                                    name="matchPreferences.preferredAppearance"
                                    control={control}
                                    rules={{ required: "Preferred Appearance is required" }}
                                    render={({ field }) => (
                                        <Select {...field} placeholder="Select Preferred Appearance">
                                            {[
                                                "Hair-cut",
                                                "Turbaned (with trimmed beard)",
                                                "Gursikh",
                                                "Clean Shaven",
                                                "Amrit-Dhari",
                                                "Female Profile",
                                            ].map((appearance) => (
                                                <Option key={appearance} value={appearance}>
                                                    {appearance}
                                                </Option>
                                            ))}
                                        </Select>
                                    )}
                                />
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item
                                label="Marital Status Preference"
                                validateStatus={errors.matchPreferences?.maritalStatusPreference ? "error" : ""}
                                help={errors.matchPreferences?.maritalStatusPreference?.message}
                            >
                                <Controller
                                    name="matchPreferences.maritalStatusPreference"
                                    control={control}
                                    rules={{ required: "Marital Status Preference is required" }}
                                    render={({ field }) => (
                                        <Select {...field} placeholder="Select Marital Status Preference">
                                            {[
                                                "Single",
                                                "Married",
                                                "Divorced",
                                                "Widowed",
                                                "Separated",
                                                "Annulled",
                                                "Divorced (1 child, Living Together)",
                                                "Divorced (2 children, Living Together)",
                                                "Divorced (3 children, Living Together)",
                                                "Awaiting Divorce",
                                                "Widowed (1 child, Living Together)",
                                                "Divorced (Without child)",
                                            ].map((status) => (
                                                <Option key={status} value={status}>
                                                    {status}
                                                </Option>
                                            ))}
                                        </Select>
                                    )}
                                />
                            </Form.Item>
                        </Col>
                    </Row>



                    <Row gutter={16}>
                        {/* Education Preference */}
                        <Col span={12}>
                            <Form.Item
                                label="Education Preference"
                                validateStatus={errors.matchPreferences?.educationPreference ? "error" : ""}
                                help={errors.matchPreferences?.educationPreference?.message}
                            >
                                <Controller
                                    name="matchPreferences.educationPreference"
                                    control={control}
                                    rules={{ required: "Education preference is required" }}
                                    render={({ field: { onChange, value } }) => (
                                        <Select
                                            placeholder="Select Education Preference"
                                            onChange={onChange}
                                            value={value ?? undefined}
                                            allowClear
                                            options={[
                                                "High School",
                                                "Senior Secondary School",
                                                "Graduation - Bachelor’s degree, BA, BSc, BCom etc.",
                                                "Post-Graduation - Master’s degree, MA, MSc, MCom etc.",
                                                "Doctorate - PhD",
                                            ].map((education) => ({ label: education, value: education }))}
                                        />
                                    )}
                                />
                            </Form.Item>
                        </Col>

                        {/* Employment Preference */}
                        <Col span={12}>
                            <Form.Item
                                label="Employment Preference"
                                validateStatus={errors.matchPreferences?.employmentPreference ? "error" : ""}
                                help={errors.matchPreferences?.employmentPreference?.message}
                            >
                                <Controller
                                    name="matchPreferences.employmentPreference"
                                    control={control}
                                    rules={{ required: "Employment preference is required" }}
                                    render={({ field: { onChange, value } }) => (
                                        <Select
                                            placeholder="Select Employment Preference"
                                            onChange={onChange}
                                            value={value ?? undefined}
                                            allowClear
                                            options={[
                                                "Private Sector",
                                                "Government Job",
                                                "Businessman",
                                                "Self-Employed",
                                                "Freelancer",
                                                "Student",
                                                "Retired",
                                                "Homemaker",
                                                "Consultant",
                                                "Part-Time Worker",
                                            ].map((employment) => ({ label: employment, value: employment }))}
                                        />
                                    )}
                                />
                            </Form.Item>
                        </Col>
                    </Row>


                    <Row gutter={16}>
                        {/* Vegetarian Preference */}
                        <Col span={12}>
                            <Form.Item
                                label="Vegetarian Preference"
                                validateStatus={errors.matchPreferences?.vegetarianPreference ? "error" : ""}
                                help={errors.matchPreferences?.vegetarianPreference?.message}
                            >
                                <Controller
                                    name="matchPreferences.vegetarianPreference"
                                    control={control}
                                    rules={{ required: "Vegetarian preference is required" }}
                                    render={({ field: { onChange, value } }) => (
                                        <Select
                                            placeholder="Select Vegetarian Preference"
                                            onChange={(val) => onChange(val === "Yes")}
                                            value={value !== undefined ? (value ? "Yes" : "No") : undefined}
                                            allowClear
                                            options={[
                                                { label: "Yes", value: "Yes" },
                                                { label: "No", value: "No" },
                                            ]}
                                        />
                                    )}
                                />
                            </Form.Item>
                        </Col>

                        {/* Drink Alcohol */}
                        <Col span={12}>
                            <Form.Item
                                label="Drink Alcohol"
                                validateStatus={errors.matchPreferences?.drinkAlcohol ? "error" : ""}
                                help={errors.matchPreferences?.drinkAlcohol?.message}
                            >
                                <Controller
                                    name="matchPreferences.drinkAlcohol"
                                    control={control}
                                    rules={{ required: "Drink alcohol preference is required" }}
                                    render={({ field: { onChange, value } }) => (
                                        <Select
                                            placeholder="Select Drink Alcohol"
                                            onChange={(val) => onChange(val === "Yes")}
                                            value={value !== undefined ? (value ? "Yes" : "No") : undefined}
                                            allowClear
                                            options={[
                                                { label: "Yes", value: "Yes" },
                                                { label: "No", value: "No" },
                                            ]}
                                        />
                                    )}
                                />
                            </Form.Item>
                        </Col>
                    </Row>


                    <Form.Item className="flex justify-center">
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            className="!bg-[rgb(174,8,71)] !border-none !hover:bg-[rgb(174,8,71)] !focus:bg-[rgb(174,8,71)] !active:bg-[rgb(174,8,71)]"
                        >
                            Submit Application
                        </Button>
                    </Form.Item>

                </Form>
            </Card>
        </div>
    );
};

export default ClientSubmissionForm;
