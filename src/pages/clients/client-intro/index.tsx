import { Card, Avatar, Divider } from 'antd';
import { FaCheckCircle } from 'react-icons/fa';
import { IoCopyOutline } from 'react-icons/io5';

const Index = () => {
    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="flex flex-col md:flex-row">
                    {/* Left side - Image */}
                    <div className="md:w-1/2">
                        <img
                            src="https://picsum.photos/600/800"
                            alt="Profile"
                            className="w-full max-h-[500px] object-cover mx-auto"
                        />

                    </div>

                    {/* Right side - Profile Info */}
                    <div className="md:w-1/2 p-6 relative">
                        {/* Intro ID and Time */}
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-lg font-semibold">Intro ID 3289</h2>
                                <p className="text-gray-500 text-sm">Sent: 25 Apr 2025 11:38 PM</p>
                            </div>
                            <button className="text-blue-500 flex items-center space-x-1 hover:underline">
                                <IoCopyOutline />
                                <span>Copy intro link</span>
                            </button>
                        </div>

                        {/* Expiration */}
                        <div className="text-sm text-gray-400 mb-6">Expiration: 01 May 2025</div>

                        {/* Profile Card */}
                        <Card bordered={false} className="shadow-none">
                            <div className="flex items-center space-x-3 mb-4">
                                <Avatar
                                    shape="square"
                                    size={64}
                                    src="https://picsum.photos/100"
                                    alt="Profile"
                                />
                                <div className="flex items-center space-x-1 text-blue-500">
                                    <FaCheckCircle />
                                    <span className="text-sm">Verified Profile</span>
                                </div>
                            </div>

                            <Divider />

                            {/* Profile fields */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="font-medium text-gray-600">Religion</div>
                                <div>Sikh</div>

                                <div className="font-medium text-gray-600">Gender</div>
                                <div>Female</div>

                                <div className="font-medium text-gray-600">Caste</div>
                                <div>Khatri</div>

                                <div className="font-medium text-gray-600">Sub Caste</div>
                                <div>Bedi</div>

                                <div className="font-medium text-gray-600">Age</div>
                                <div>29</div>

                                <div className="font-medium text-gray-600">Height</div>
                                <div>5'5"</div>

                                <div className="font-medium text-gray-600">Marital Status</div>
                                <div>Never Married</div>

                                <div className="font-medium text-gray-600">Vegetarian</div>
                                <div>Yes</div>

                                <div className="font-medium text-gray-600">Do you Drink Alcohol?</div>
                                <div>No</div>

                                <div className="font-medium text-gray-600">Do you smoke?</div>
                                <div>No</div>

                                <div className="font-medium text-gray-600">High School</div>
                                <div>High School (India)</div>

                                <div className="font-medium text-gray-600">Education</div>
                                <div>Diploma in Business & Management</div>

                                <div className="font-medium text-gray-600">Employment</div>
                                <div>Private Sector (Restaurant Porter)</div>

                                <div className="font-medium text-gray-600">Location</div>
                                <div>Calgary, AB, Canada</div>

                                <div className="font-medium text-gray-600">Father's Employment</div>
                                <div>Retired</div>

                                <div className="font-medium text-gray-600">Mother's Employment</div>
                                <div>Housewife</div>

                                <div className="font-medium text-gray-600">Other Family Details</div>
                                <div>1 Elder Brother Married, 1 Younger Sister Unmarried</div>

                                <div className="font-medium text-gray-600">Family Belong To</div>
                                <div>Amritsar, Punjab, India</div>

                                <div className="font-medium text-gray-600">Residency Status</div>
                                <div>Permanent Resident</div>

                                <div className="font-medium text-gray-600">Religion</div>
                                <div>Sikh</div>

                                <div className="font-medium text-gray-600">Gender</div>
                                <div>Female</div>

                                <div className="font-medium text-gray-600">Caste</div>
                                <div>Khatri</div>

                                <div className="font-medium text-gray-600">Sub Caste</div>
                                <div>Bedi</div>

                                <div className="font-medium text-gray-600">Age</div>
                                <div>29</div>

                                <div className="font-medium text-gray-600">Height</div>
                                <div>5'5"</div>

                                <div className="font-medium text-gray-600">Marital Status</div>
                                <div>Never Married</div>

                                <div className="font-medium text-gray-600">Vegetarian</div>
                                <div>Yes</div>

                                <div className="font-medium text-gray-600">Do you Drink Alcohol?</div>
                                <div>No</div>

                                <div className="font-medium text-gray-600">Do you smoke?</div>
                                <div>No</div>

                                <div className="font-medium text-gray-600">High School</div>
                                <div>High School (India)</div>

                                <div className="font-medium text-gray-600">Education</div>
                                <div>Diploma in Business & Management</div>

                                <div className="font-medium text-gray-600">Employment</div>
                                <div>Private Sector (Restaurant Porter)</div>

                                <div className="font-medium text-gray-600">Location</div>
                                <div>Calgary, AB, Canada</div>

                                <div className="font-medium text-gray-600">Father's Employment</div>
                                <div>Retired</div>

                                <div className="font-medium text-gray-600">Mother's Employment</div>
                                <div>Housewife</div>

                                <div className="font-medium text-gray-600">Other Family Details</div>
                                <div>1 Elder Brother Married, 1 Younger Sister Unmarried</div>

                                <div className="font-medium text-gray-600">Family Belong To</div>
                                <div>Amritsar, Punjab, India</div>

                                <div className="font-medium text-gray-600">Residency Status</div>
                                <div>Permanent Resident</div>
                                <div className="font-medium text-gray-600">Religion</div>
                                <div>Sikh</div>

                                <div className="font-medium text-gray-600">Gender</div>
                                <div>Female</div>

                                <div className="font-medium text-gray-600">Caste</div>
                                <div>Khatri</div>

                                <div className="font-medium text-gray-600">Sub Caste</div>
                                <div>Bedi</div>

                                <div className="font-medium text-gray-600">Age</div>
                                <div>29</div>

                                <div className="font-medium text-gray-600">Height</div>
                                <div>5'5"</div>

                                <div className="font-medium text-gray-600">Marital Status</div>
                                <div>Never Married</div>

                                <div className="font-medium text-gray-600">Vegetarian</div>
                                <div>Yes</div>

                                <div className="font-medium text-gray-600">Do you Drink Alcohol?</div>
                                <div>No</div>

                                <div className="font-medium text-gray-600">Do you smoke?</div>
                                <div>No</div>

                                <div className="font-medium text-gray-600">High School</div>
                                <div>High School (India)</div>

                                <div className="font-medium text-gray-600">Education</div>
                                <div>Diploma in Business & Management</div>

                                <div className="font-medium text-gray-600">Employment</div>
                                <div>Private Sector (Restaurant Porter)</div>

                                <div className="font-medium text-gray-600">Location</div>
                                <div>Calgary, AB, Canada</div>

                                <div className="font-medium text-gray-600">Father's Employment</div>
                                <div>Retired</div>

                                <div className="font-medium text-gray-600">Mother's Employment</div>
                                <div>Housewife</div>

                                <div className="font-medium text-gray-600">Other Family Details</div>
                                <div>1 Elder Brother Married, 1 Younger Sister Unmarried</div>

                                <div className="font-medium text-gray-600">Family Belong To</div>
                                <div>Amritsar, Punjab, India</div>

                                <div className="font-medium text-gray-600">Residency Status</div>
                                <div>Permanent Resident</div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Index;
