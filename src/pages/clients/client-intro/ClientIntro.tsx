import { Card } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import logo from "../../../components/images/logo.png"

const ClientIntro = () => {
    return (
        <div className="relative min-h-screen bg-[#f8fafc] flex justify-center items-center p-8 overflow-hidden">
            {/* Background Diagonal Shape */}
            <div className="absolute top-70 left-0 w-full h-[300px] bg-[rgb(216,226,239)] transform -skew-y-10 origin-top-left z-0"></div>

            {/* Content Container */}
            <div className="relative z-10 flex flex-col md:flex-row gap-2 w-[90%] mx-auto items-start">
                {/* Left - Image */}
                <div className="flex justify-center items-start w-full md:w-1/2">
                    <div className="w-full !md:w-[300px] h-[500px] !md:h-[200px] bg-white rounded-lg shadow-lg overflow-hidden flex justify-center items-center p-2">
                        <img
                            src="https://picsum.photos/400/500"
                            alt="Profile"
                            className="w-full h-full object-cover rounded-lg border-[5px] border-white"
                        />
                    </div>
                </div>

                {/* Right - Profile Card */}
                <div className="flex justify-center items-stretch w-full md:w-1/2">
                    <Card
                        title={
                            <div className="flex justify-between items-center">
                                <div className="text-lg font-semibold">Profile</div>
                                <img src={logo} alt="Logo" className="w-20 mb-3 mt-3 ml-auto" />
                            </div>
                        }
                        className="rounded-lg shadow-md w-full flex flex-col justify-between"
                    >
                        {/* Verified Section */}
                        <div className="flex justify-between items-center mb-4">
                            <div className="text-gray-600 font-medium">Verified Profile</div>
                            <CheckCircleOutlined className="text-blue-500 text-2xl" />
                        </div>

                        {/* Small Image */}
                        <div className="flex justify-center mb-6">
                            <img
                                src="https://picsum.photos/80/120"
                                alt="Small Profile"
                                className="rounded-md object-cover shadow-md"
                            />
                        </div>

                        {/* Profile Details */}
                        <div className="text-sm flex-grow">

                            {[
                                { label: "Religion", value: "Sikh" },
                                { label: "Gender", value: "Female" },
                                { label: "Caste", value: "Khatri" },
                                { label: "Sub Caste", value: "Bedi" },
                                { label: "Age", value: "29" },
                                { label: "Height (ft & in)", value: `5'5"` },
                                { label: "Marital Status", value: "Never Married" },
                                { label: "Vegetarian", value: "Yes" },
                                { label: "Do you Drink Alcohol?", value: "No" },
                                { label: "Do you smoke?", value: "No" },
                                { label: "Name of High School", value: "High School (India)" },
                                { label: "Education", value: "Diploma In Business & Management" },
                                { label: "Employment", value: "Private Sector (Restaurant Porter)" },
                                { label: "Location", value: "Calgary, AB, Canada" },
                                { label: "Religion", value: "Sikh" },
                                { label: "Gender", value: "Female" },
                                { label: "Caste", value: "Khatri" },
                                { label: "Sub Caste", value: "Bedi" },
                                { label: "Age", value: "29" },
                                { label: "Height (ft & in)", value: `5'5"` },
                                { label: "Marital Status", value: "Never Married" },
                                { label: "Vegetarian", value: "Yes" },
                                { label: "Do you Drink Alcohol?", value: "No" },
                                { label: "Do you smoke?", value: "No" },
                                { label: "Name of High School", value: "High School (India)" },
                                { label: "Education", value: "Diploma In Business & Management" },
                                { label: "Employment", value: "Private Sector (Restaurant Porter)" },
                                { label: "Location", value: "Calgary, AB, Canada" },
                                { label: "Religion", value: "Sikh" },
                                { label: "Gender", value: "Female" },
                                { label: "Caste", value: "Khatri" },
                                { label: "Sub Caste", value: "Bedi" },
                                { label: "Age", value: "29" },
                                { label: "Height (ft & in)", value: `5'5"` },
                                { label: "Marital Status", value: "Never Married" },
                                { label: "Vegetarian", value: "Yes" },
                                { label: "Do you Drink Alcohol?", value: "No" },
                                { label: "Do you smoke?", value: "No" },
                                { label: "Name of High School", value: "High School (India)" },
                                { label: "Education", value: "Diploma In Business & Management" },
                                { label: "Employment", value: "Private Sector (Restaurant Porter)" },
                                { label: "Location", value: "Calgary, AB, Canada" },
                            ].map((item, idx) => (
                                <div
                                    key={idx}
                                    className={`flex justify-between py-2 px-2 ${idx % 2 === 0 ? "bg-gray-50" : "bg-white"} md:flex-row flex-col`}
                                >
                                    <div className="text-gray-500">{item.label}</div>
                                    <div className="font-medium">{item.value}</div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ClientIntro;
