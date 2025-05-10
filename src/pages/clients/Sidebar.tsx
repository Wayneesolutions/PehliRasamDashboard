import { useEffect, useState, KeyboardEvent, ChangeEvent, useRef } from "react";
import { Mail, MapPin, Camera, Check, X, Upload, Pencil } from "lucide-react";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { getCustomerBasicDetail, updateCustomerBasicDetail, uploadFile } from "../../config/apiClient";
import { Customer } from "../../schema/customernew";
import { message } from "antd";
import { CustomerUpdate } from "../clientsForm/types/clientTypes";
import ClientListManager from "./ClientList";
import Select from "react-select";
import axios from "axios";

type CountryOption = {
  label: string;
  value: string;
  flag: string;
};

type SidebarProps = {
  customerId: string;
};

const cityOptions = [
  "Amritsar", "Barnala", "Bathinda", "Dera Bassi", "Delhi", "Chandigarh",
  "Faridkot", "Fatehgarh Sahib", "Firozpur", "Gurdaspur", "Gujarat",
  "Hoshiarpur", "Himachal Pradesh", "Haryana", "Jalandhar", "Jammu and Kashmir",
  "Kapurthala", "Khanna", "Ludhiana", "Mansa", "Moga", "Muktsar(Sri Muktsar Sahib)",
  "Nakodar", "Patiala", "Phagwara", "Rupnagar", "Rajasthan",
  "(Mohali)Sahibzada Ajit Singh Nagar", "Sangrur",
  "(Nawanshahr)Shahid Bhagat Singh Nagar", "Tarn Taran", "Uttarakhand",
  "Uttar Pradesh", "Zirakpur"
];

const fetchCountries = async (): Promise<CountryOption[]> => {
  const { data } = await axios.get("https://restcountries.com/v3.1/all");
  return data
    .map((country: any) => ({
      label: country.name.common,
      value: country.name.common,
      flag: country.flags.svg,
    }))
    .sort((a: CountryOption, b: CountryOption) => a.label.localeCompare(b.label));
};

// Custom SingleValue
const customSingleValue = ({ data }: { data: CountryOption }) => (
  <div className="flex items-center">
    <img src={data.flag} alt="flag" className="w-5 h-4 mr-2" />
    {data.label}
  </div>
);

// Custom Option
const customOption = (props: {
  data: CountryOption;
  innerRef: (element: HTMLDivElement) => void;
  innerProps: React.HTMLAttributes<HTMLDivElement>;
}) => {
  const { data, innerRef, innerProps } = props;
  return (
    <div ref={innerRef} {...innerProps} className="px-2 py-1 hover:bg-gray-100 cursor-pointer flex items-center">
      <img src={data.flag} alt="flag" className="w-5 h-4 mr-2" />
      {data.label}
    </div>
  );
};


const Sidebar = ({ customerId }: SidebarProps) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [editMode, setEditMode] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [countryOptions, setCountryOptions] = useState<CountryOption[]>([]);

  const [imagePath, setImagePath] = useState<string | undefined>();


  const [address, setAddress] = useState<{
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string; // Add this line for the 'country' property
  }>({
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "", // Initialize country as an empty string
  });


  useEffect(() => {
    if (customerId) {
      fetchCustomerDetails();
    }
  }, [customerId]);

  const fetchCustomerDetails = async () => {
    try {
      const res = await getCustomerBasicDetail(customerId);
      if (res.success) {
        const customerData = res.data;
        setCustomer(customerData);

        // Ensure address state is populated correctly
        if (customerData.address) {
          setAddress({
            street: customerData.address.street || "",
            city: customerData.address.city || "",
            state: customerData.address.state || "",
            postalCode: customerData.address.postalCode || "",
            country: customerData.address.country || "",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching customer details:", error);
    }
  };


  const handleEdit = (field: string, value: string) => {
    setEditMode(field);
    setEditValue(value);
  };

  const handleCancel = () => {
    setEditMode(null);
    setEditValue("");
  };

  const handleSave = async () => {
    if (!editMode || !customer) return;

    setIsUpdating(true);

    try {
      const addressData: any = {};
      Object.entries(address).forEach(([key, value]) => {
        if (value && value.trim() !== "") {
          addressData[key] = value;
        }
      });

      const updateData: CustomerUpdate = {
        customerId: customerId,
        firstName: customer.firstName,
        middelName: customer.middelName,
        lastName: customer.lastName,
        email: customer.email,
        address: addressData,
      };

      if (customer.Number && customer.Number.toString().trim() !== "") {
        updateData.Number = customer.Number.toString();
      }

      if (editMode && editMode !== "address") {
        (updateData as any)[editMode] = editValue;
      }

      const res = await updateCustomerBasicDetail(updateData);

      if (res.success) {
        if (res.customer) {
          setCustomer(res.customer);
        } else {
          await fetchCustomerDetails();
        }
        setEditMode(null);
        setEditValue("");
        setAddress({ street: "", city: "", state: "", postalCode: "", country: "" });
        message.success(res.message);
      } else {
        message.error(res.message || "Failed to update");
      }
    } catch (error) {
      console.error("Error updating customer:", error);
      message.error("An error occurred while updating");
    } finally {
      setIsUpdating(false);
    }
  };



  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await uploadFile(formData);

      if (response.success && Array.isArray(response.fileUrls) && response.fileUrls[0]) {
        const updateData = {
          customerId: customerId,
          imagePath: response.fileUrls[0],
        };

        const updateRes = await updateCustomerBasicDetail(updateData);

        if (updateRes.success) {
          setCustomer(updateRes.customer);
          message.success("Profile image updated successfully");
        } else {
          message.error(updateRes.message || "Failed to update profile image");
        }
      } else {
        message.error(response.message || "Failed to upload image");
      }
    } catch (error) {
      message.error((error as Error).message || "An error occurred while uploading");
    } finally {
      setIsUploading(false);
    }
  };


  useEffect(() => {
    const loadCountries = async () => {
      const countries = await fetchCountries();
      setCountryOptions(countries);
    };
    loadCountries();
  }, []);
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await getCustomerBasicDetail(customerId);
        if (res.success && res.data.imagePath) {
          setImagePath(res.data.imagePath);
        }
      } catch (error) {
        console.error("Error fetching imagePath:", error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [customerId]);



  return (
    <div className="w-1/5 min-w-[280px] bg-white shadow-md p-4 flex flex-col fixed md:relative md:h-screen h-screen overflow-y-auto z-50 transition-all">
      {/* Profile Image with upload button */}
      <div className="relative w-full h-80 bg-gray-300 rounded-md flex items-center justify-center overflow-hidden mb-4">
        {imagePath ? (
          <img
            src={imagePath}
            alt={customer?.firstName}
            className="w-full h-full object-contain rounded-md"
          />
        ) : (
          <Camera className="text-gray-500" size={50} />
        )}


        {/* Upload button overlay */}
        <div
          className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer rounded-md"
          onClick={handleUploadClick}
        >
          <Upload className="text-white" size={24} />
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
      </div>

      {isUploading && (
        <p className="text-xs text-blue-500 mt-1">Uploading...</p>
      )}

      {/* Fields Section */}
      <div className="flex-grow overflow-y-auto">

        {/* First Name */}
        <div className="my-4 w-full">
          <h2 className="text-sm font-semibold mb-2">First Name</h2>
          {editMode === "firstName" ? (
            <div className="flex items-center justify-center">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="px-2 py-1 border rounded mr-1 w-32 text-sm"
                autoFocus
              />
              <button onClick={handleSave} disabled={isUpdating} className="text-green-500 text-sm">
                <Check size={16} />
              </button>
              <button onClick={handleCancel} className="text-red-500 ml-1 text-sm">
                <X size={16} />
              </button>
            </div>
          ) : (
            <span
              className="inline-flex items-center gap-1 text-sm font-medium cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
              onClick={() => customer && handleEdit("firstName", customer.firstName)}
            >
              {customer ? customer.firstName : "Loading..."}
              <Pencil size={14} className="text-gray-400 hover:text-gray-600" />
            </span>
          )}
          <hr />
        </div>

        {/* Middle Name */}
        <div className="my-4 w-full">
          <h2 className="text-sm font-semibold mb-2">Middle Name</h2>
          {editMode === "middelName" ? (
            <div className="flex items-center justify-center">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="px-2 py-1 border rounded mr-1 w-32 text-sm"
                autoFocus
                placeholder="Enter middle name"
              />
              <button onClick={handleSave} disabled={isUpdating} className="text-green-500">
                <Check size={16} />
              </button>
              <button onClick={handleCancel} className="text-red-500 ml-1">
                <X size={16} />
              </button>
            </div>
          ) : (
            <span
              className="inline-flex items-center gap-1 text-sm font-medium cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
              onClick={() => customer && handleEdit("middelName", customer.middelName)}
            >
              {customer ? customer.middelName || "No middle name" : "Loading..."}
              <Pencil size={14} className="text-gray-400 hover:text-gray-600" />
            </span>
          )}
          <hr />
        </div>

        {/* Last Name */}
        <div className="my-4 w-full">
          <h2 className="text-sm font-semibold mb-2">Last Name</h2>
          {editMode === "lastName" ? (
            <div className="flex items-center justify-center">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="px-2 py-1 border rounded mr-1 w-32 text-sm"
                autoFocus
              />
              <button onClick={handleSave} disabled={isUpdating} className="text-green-500">
                <Check size={16} />
              </button>
              <button onClick={handleCancel} className="text-red-500 ml-1">
                <X size={16} />
              </button>
            </div>
          ) : (
            <span
              className="inline-flex items-center gap-1 text-sm font-medium cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
              onClick={() => customer && handleEdit("lastName", customer.lastName)}
            >
              {customer ? customer.lastName : ""}
              <Pencil size={14} className="text-gray-400 hover:text-gray-600" />
            </span>
          )}
          <hr />
        </div>


        {/* Email display/edit */}
        <div className="my-4 w-full">
          <h2 className="text-sm font-semibold mb-2">Email Address</h2>
          {editMode === "email" ? (
            <div className="flex items-center justify-center">
              <input
                type="email"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="px-2 py-1 border rounded mr-1 w-full"
                autoFocus
              />
              <button onClick={handleSave} disabled={isUpdating} className="text-green-500">
                <Check size={16} />
              </button>
              <button onClick={handleCancel} className="text-red-500 ml-1">
                <X size={16} />
              </button>
            </div>
          ) : (
            <span
              className="inline-flex items-center gap-1 text-sm font-medium cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
              onClick={() => customer && handleEdit("email", customer.email)}
            >
              {customer?.email || "No email available"}
              <Pencil size={14} className="text-gray-400 hover:text-gray-600" />
            </span>
          )}
          <hr />
        </div>


        {/* Contact Info */}
        <div className="mt-4 space-y-2 w-full text-gray-600">
          <div className="flex items-center space-x-2">
            <Mail size={18} />
            <span
              className="text-sm break-words cursor-pointer bg-gray-100 px-2 py-1 rounded flex-1"
              onClick={() => customer && handleEdit("email", customer.email)}
            >
              {customer?.email || "N/A"}
            </span>
          </div>

          <div className="flex items-start space-x-2">
            {editMode === "Number" ? (
              <div className="flex flex-col w-full">


                {/* Stack flag above number visually */}
                <div className="relative w-full">
                  <PhoneInput
                    value={editValue}
                    onChange={(value) => setEditValue(value || "")}

                    placeholder="Enter phone number"
                    inputStyle={{ width: '100%' }}
                  />

                </div>

                <div className="flex justify-end mt-2 space-x-2">
                  <button onClick={handleSave} disabled={isUpdating} className="text-green-500">
                    <Check size={16} />
                  </button>
                  <button onClick={handleCancel} className="text-red-500">
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="flex items-center space-x-2 flex-1 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                onClick={() => customer && handleEdit("Number", customer?.Number?.toString() || "")}
              >
                <PhoneInput
                  value={customer?.Number ? customer.Number.toString() : ""}
                  onChange={() => { }}
                  placeholder="Enter phone number"
                  inputStyle={{ width: '100%' }}
                />

              </div>
            )}
          </div>





          <div className="flex items-center space-x-2">
            <MapPin size={18} />
            {editMode === "address" ? (
              <div className="flex flex-col w-full">
                <input
                  type="text"
                  value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  onKeyDown={handleKeyDown}
                  className="px-2 py-1 border rounded w-full mb-2"
                  autoFocus
                  placeholder="Street"
                />

                <select
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  className="px-2 py-1 border rounded w-full mb-2"
                >
                  <option value="" disabled>Select City</option>
                  {cityOptions.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  value={address.postalCode}
                  onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                  onKeyDown={handleKeyDown}
                  className="px-2 py-1 border rounded w-full mb-2"
                  placeholder="Postal Code"
                />

                <Select
                  options={countryOptions}
                  value={countryOptions.find((c) => c.label === address.country) || null}
                  onChange={(val) => {
                    if (val) setAddress({ ...address, country: val.label });
                  }}
                  components={{ SingleValue: customSingleValue, Option: customOption }}
                  placeholder="Select Country"
                  className="w-full mb-2"
                />



                <div className="flex justify-end space-x-2">
                  <button onClick={handleSave} disabled={isUpdating} className="text-green-500">
                    <Check size={16} />
                  </button>
                  <button onClick={handleCancel} className="text-red-500">
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <span
                className="text-sm cursor-pointer hover:bg-gray-100 px-2 py-1 rounded flex-1"
                onClick={() => {
                  if (customer?.address) {
                    setEditMode("address");
                    setAddress({
                      street: customer.address.street || "",
                      city: customer.address.city || "",
                      state: customer.address.state || "",
                      postalCode: customer.address.postalCode || "",
                      country: customer.address.country || "",
                    });
                  }
                }}
              >
                {customer?.address
                  ? `${customer.address.street || ""}, ${customer.address.city || ""}, ${customer.address.postalCode || ""}, ${customer.address.country || ""}`
                  : "N/A"}
              </span>
            )}
          </div>


        </div>

        <ClientListManager
          customerId={customerId}
        />
      </div>
    </div>
  );
};

export default Sidebar;