import { Mail, Phone, MapPin, Camera } from "lucide-react";
import apiClient from "../../config/apiClient";
import { useEffect, useState, } from "react";
import { useLocation } from "react-router-dom";


const Sidebar = () => {
    const [customer, setCustomer] = useState(null);
    const location = useLocation();

    useEffect(() => {
        const fetchCustomerDetails = async () => {
            try {
                const response = await apiClient.post('admin/getCustomerBasicDetail', {
                    customerId: location.state.clientId,
                });
                setCustomer(response.data.data);
            } catch (error) {
                console.error('Error fetching customer details:', error);
            }
        };

        fetchCustomerDetails();
    }, []);

    return (
        <div className="w-1/5 min-w-[250px] bg-white shadow-md p-4 flex flex-col items-center
            fixed md:relative md:h-screen h-screen overflow-y-auto z-50 transition-all">

            {/* Profile Image */}
            <div className="relative flex items-center justify-center w-32 h-32 bg-yellow-500 rounded-md">
                {customer?.imagePath && (
                    <img 
                        src={customer.imagePath} 
                        alt="Profile" 
                        className="object-cover w-full h-full rounded-md"
                    />
                )}
                <Camera className="absolute p-1 bg-white rounded-full cursor-pointer bottom-2 right-2" size={24} />
            </div>
            <h2 className="mt-3 text-lg font-semibold">{customer?.firstName} {customer?.lastName}</h2>
            <button className="px-4 py-1 mt-3 text-gray-700 bg-gray-200 rounded">Actions ▼</button>

            {/* Contact Info */}
            <div className="w-full mt-4 space-y-2 text-gray-600">
                <div className="flex items-center space-x-2">
                    <Mail size={18} /> <span className="text-sm break-words">{customer?.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                    <MapPin size={18} /> 
                    <span className="text-sm">
                        {customer?.address?.city}, {customer?.address?.stateOrProvince}, {customer?.address?.country}
                    </span>
                </div>
            </div>

            <button className="px-4 py-1 mt-4 text-white bg-blue-500 rounded">Set Location</button>
        </div>
    );
};

export default Sidebar;
