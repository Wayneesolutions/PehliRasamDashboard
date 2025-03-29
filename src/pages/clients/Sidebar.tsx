import { useEffect, useState } from "react";
import { Mail, Phone, MapPin, Camera } from "lucide-react";
import { getCustomerBasicDetail } from "../../config/apiClient";
import { Customer } from "../../schema/customernew";

const Sidebar = ({ customerId }:{customerId:string}) => {
    const [customer, setCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    if (customerId) {
      const fetchCustomerDetailsById = async () => {
        try {
          const res = await getCustomerBasicDetail(customerId);
          if (res.success) {
            setCustomer(res.data);
          }
        } catch (error) {
          console.error("Error fetching customer details:", error);
        }
      };
      fetchCustomerDetailsById();
    }
  }, [customerId]);

  return (
    <div className="w-1/5 min-w-[250px] bg-white shadow-md p-4 flex flex-col items-center fixed md:relative md:h-screen h-screen overflow-y-auto z-50 transition-all">
      {/* Profile Image */}
      <div className="relative w-32 h-32 bg-gray-300 rounded-md flex items-center justify-center">
        {customer?.imagePath ? (
          <img src={customer.imagePath} alt={customer.firstName} className="w-full h-full object-cover rounded-md" />
        ) : (
          <Camera className="text-gray-500" size={50} />
        )}
      </div>
      <h2 className="text-lg font-semibold mt-3">{customer ? `${customer.firstName} ${customer.lastName}` : "Loading..."}</h2>
      <p className="text-gray-500 text-sm">{customer?.email || "No email available"}</p>
      <button className="bg-gray-200 text-gray-700 px-4 py-1 rounded mt-3">Actions ▼</button>

      {/* Contact Info */}
      <div className="mt-4 space-y-2 w-full text-gray-600">
        <div className="flex items-center space-x-2">
          <Mail size={18} /> <span className="text-sm break-words">{customer?.email || "N/A"}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Phone size={18} /> <span className="text-sm">{customer?.contact || "N/A"}</span>
        </div>
        <div className="flex items-center space-x-2">
          <MapPin size={18} /> <span className="text-sm">
            {customer?.address ? `${customer.address.city}, ${customer.address.country}` : "N/A"}
          </span>
        </div>
      </div>
      <button className="bg-blue-500 text-white px-4 py-1 rounded mt-4">Set Location</button>
    </div>
  );
};

export default Sidebar;
