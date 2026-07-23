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
import { countries as countriesData } from "countries-list";

type CountryOption = {
  label: string;
  value: string;
  flag: string;
};

type SidebarProps = {
  customerId: string;
};

const allCountryOptions: CountryOption[] = Object.entries(countriesData)
  .map(([code, country]) => ({
    label: country.name,
    value: country.name,
    flag: code.toLowerCase(),
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

// Custom SingleValue
const customSingleValue = ({ data }: { data: CountryOption }) => (
  <div className="flex items-center">
    <img src={`https://flagcdn.com/w20/${data.flag}.png`} alt={data.label} className="w-5 h-4 mr-2" />
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
      <img src={`https://flagcdn.com/w20/${data.flag}.png`} alt={data.label} className="w-5 h-4 mr-2" />
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
  const [countryOptions] = useState<CountryOption[]>(allCountryOptions);

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

      if (editMode && editMode !== "address") {
        // Handle entryName - allow empty string to clear it
        if (editMode === "entryName") {
          (updateData as any)[editMode] = editValue.trim() || null;
        } else if (editMode === "Number") {
          // Handle phone number update
          updateData.Number = editValue || "";
        } else {
          (updateData as any)[editMode] = editValue;
        }
      } else if (customer.Number && customer.Number.toString().trim() !== "") {
        // Only set Number from customer if we're not editing it
        updateData.Number = customer.Number.toString();
      }

      const res = await updateCustomerBasicDetail(updateData);

      if (res.success) {
        if (res.customer) {
          setCustomer(res.customer);
          // Update browser tab title and URL if entryName was updated
          if (editMode === "entryName") {
            const entryName = res.customer.entryName;
            if (entryName && entryName.trim()) {
              document.title = `${entryName} - Pehli Rasam`;
            } else {
              // Fallback to firstName + lastName
              const name = `${res.customer.firstName || ''} ${res.customer.lastName || ''}`.trim();
              document.title = name ? `${name} - Pehli Rasam` : 'Pehli Rasam';
            }

            // Dispatch custom event to update URL in AddClient component
            window.dispatchEvent(new CustomEvent('entryNameUpdated', {
              detail: { entryName: entryName || null }
            }));
          }
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
    <div className="w-1/5 min-w-[280px] bg-white shadow-md flex flex-col fixed md:relative md:h-screen h-screen overflow-y-auto z-50 transition-all">
      <div className="p-5 space-y-6">
        {/* Profile Image with upload button */}
        <div
          className="relative w-full rounded-md h-[380px] bg-gray-100"
          style={{ flexShrink: 0 }}
        >
          {imagePath ? (
            <img
              src={imagePath}
              alt={customer?.firstName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <Camera className="text-gray-400" size={50} />
            </div>
          )}

          <button
            onClick={handleUploadClick}
            className="absolute bottom-3 right-3 p-3 bg-white rounded-full shadow-lg hover:bg-gray-50 z-10 border border-gray-200"
          >
            <Upload className="text-gray-700" size={18} />
          </button>
        </div>



        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {isUploading && (
          <div className="px-4 py-2 bg-blue-50 border border-blue-100 rounded-md">
            <p className="text-xs text-blue-600 font-medium">Uploading image...</p>
          </div>
        )}

        {/* Fields Section */}
        <div className="space-y-6">

          {/* Basic Information Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Basic Information</h3>

            {/* Entry Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Entry Name</label>
              {editMode === "entryName" ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === "Enter") {
                        handleSave();
                      } else if (e.key === "Escape") {
                        handleCancel();
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                  <button
                    onClick={handleSave}
                    disabled={isUpdating}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                    title="Save"
                  >
                    <Check size={18} />
                  </button>
                  <button
                    onClick={handleCancel}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Cancel"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div
                  className="flex items-center justify-between p-2.5 bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer transition-colors group"
                  onClick={() => handleEdit("entryName", customer?.entryName || "")}
                >
                  <p className="text-sm text-gray-800 flex-1">
                    {customer?.entryName || <span className="text-gray-400">Not set</span>}
                  </p>
                  <Pencil size={14} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
              )}
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-3">
              {/* First Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">First Name</label>
                {editMode === "firstName" ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button onClick={handleSave} disabled={isUpdating} className="p-1 text-green-600 hover:bg-green-50 rounded">
                      <Check size={16} />
                    </button>
                    <button onClick={handleCancel} className="p-1 text-red-600 hover:bg-red-50 rounded">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div
                    className="p-2 bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer transition-colors group"
                    onClick={() => customer && handleEdit("firstName", customer.firstName)}
                  >
                    <p className="text-sm text-gray-800">{customer?.firstName || "—"}</p>
                  </div>
                )}
              </div>

              {/* Last Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">Last Name</label>
                {editMode === "lastName" ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button onClick={handleSave} disabled={isUpdating} className="p-1 text-green-600 hover:bg-green-50 rounded">
                      <Check size={16} />
                    </button>
                    <button onClick={handleCancel} className="p-1 text-red-600 hover:bg-red-50 rounded">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div
                    className="p-2 bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer transition-colors group"
                    onClick={() => customer && handleEdit("lastName", customer.lastName)}
                  >
                    <p className="text-sm text-gray-800">{customer?.lastName || "—"}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Middle Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Middle Name</label>
              {editMode === "middelName" ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                    placeholder="Enter middle name"
                  />
                  <button onClick={handleSave} disabled={isUpdating} className="p-2 text-green-600 hover:bg-green-50 rounded-md">
                    <Check size={18} />
                  </button>
                  <button onClick={handleCancel} className="p-2 text-red-600 hover:bg-red-50 rounded-md">
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div
                  className="p-2.5 bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer transition-colors group"
                  onClick={() => customer && handleEdit("middelName", customer.middelName || "")}
                >
                  <p className="text-sm text-gray-800">{customer?.middelName || <span className="text-gray-400">Not provided</span>}</p>
                </div>
              )}
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact Information</h3>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                <Mail size={14} className="text-gray-400" />
                Email Address
              </label>
              {editMode === "email" ? (
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button onClick={handleSave} disabled={isUpdating} className="p-2 text-green-600 hover:bg-green-50 rounded-md">
                    <Check size={18} />
                  </button>
                  <button onClick={handleCancel} className="p-2 text-red-600 hover:bg-red-50 rounded-md">
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div
                  className="p-2.5 bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer transition-colors group"
                  onClick={() => customer && handleEdit("email", customer.email)}
                >
                  <p className="text-sm text-gray-800 break-words">{customer?.email || <span className="text-gray-400">Not provided</span>}</p>
                </div>
              )}
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Phone Number</label>
              {editMode === "Number" ? (
                <div className="space-y-2">
                  <div className="relative">
                    <PhoneInput
                      value={editValue}
                      onChange={(value) => setEditValue(value || "")}
                      placeholder="Enter phone number"
                      inputStyle={{ width: '100%', padding: '8px 12px', paddingLeft: '48px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                      buttonStyle={{ borderRadius: '6px 0 0 6px', border: '1px solid #d1d5db', borderRight: 'none' }}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={handleSave} disabled={isUpdating} className="p-2 text-green-600 hover:bg-green-50 rounded-md">
                      <Check size={18} />
                    </button>
                    <button onClick={handleCancel} className="p-2 text-red-600 hover:bg-red-50 rounded-md">
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="p-2.5 bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => customer && handleEdit("Number", customer?.Number?.toString() || "")}
                >
                  {customer?.Number ? (
                    <div className="relative">
                      <PhoneInput
                        key={customer.Number.toString()}
                        value={customer.Number.toString()}
                        onChange={() => { }}
                        disabled
                        inputStyle={{ 
                          width: '100%', 
                          background: 'transparent', 
                          border: 'none', 
                          padding: '0', 
                          paddingLeft: '48px',
                          cursor: 'pointer',
                          color: '#1f2937'
                        }}
                        buttonStyle={{ 
                          background: 'transparent', 
                          border: 'none',
                          borderRadius: '0'
                        }}
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Not provided</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Address Section */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
              <MapPin size={14} className="text-gray-400" />
              Address
            </h3>
            {editMode === "address" ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  onKeyDown={handleKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Street Address"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    onKeyDown={handleKeyDown}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="City"
                  />
                  <input
                    type="text"
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    onKeyDown={handleKeyDown}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="State"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={address.postalCode}
                    onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                    onKeyDown={handleKeyDown}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Postal Code"
                  />
                  <Select
                    options={countryOptions}
                    value={countryOptions.find((c) => c.label === address.country) || null}
                    onChange={(val) => {
                      if (val) setAddress({ ...address, country: val.label });
                    }}
                    components={{ SingleValue: customSingleValue, Option: customOption }}
                    placeholder="Country"
                    className="w-full"
                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: '38px',
                        borderColor: '#d1d5db',
                        '&:hover': { borderColor: '#9ca3af' }
                      })
                    }}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={handleSave} disabled={isUpdating} className="px-3 py-1.5 text-green-600 hover:bg-green-50 rounded-md text-sm font-medium flex items-center gap-1">
                    <Check size={16} />
                    Save
                  </button>
                  <button onClick={handleCancel} className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-md text-sm font-medium flex items-center gap-1">
                    <X size={16} />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="p-2.5 bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer transition-colors group"
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
                {customer?.address ? (
                  <div className="space-y-1">
                    {customer.address.street && <p className="text-sm text-gray-800">{customer.address.street}</p>}
                    <p className="text-sm text-gray-600">
                      {[customer.address.city, customer.address.state, customer.address.postalCode].filter(Boolean).join(", ")}
                    </p>
                    {customer.address.country && <p className="text-sm text-gray-600">{customer.address.country}</p>}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Not provided</p>
                )}
              </div>
            )}
          </div>

          <ClientListManager
            customerId={customerId}
          />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;