import { useEffect, useState, KeyboardEvent, ChangeEvent, useRef } from "react";
import { Mail, Camera, Check, X, Upload } from "lucide-react";
import PhoneInput from "react-phone-number-input";
import { Dropdown, Menu, Button } from 'antd';
import SendMessage from './SendMessage';
import { getCustomerBasicDetail, updateCustomerBasicDetail, uploadFile } from "../../config/apiClient";
import { Customer } from "../../schema/customernew";
import { message } from "antd";
import { CustomerUpdate } from "../clientsForm/types/clientTypes";
import ClientListManager from "./ClientList";

type SidebarProps = {
  customerId: string;
};



const Sidebar = ({ customerId }: SidebarProps) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [editMode, setEditMode] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const [modalVisible, setModalVisible] = useState(false);

  const handleSendMessageClick = () => {
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const menu = (
    <Menu>
      <Menu.Item key="sendMessage" onClick={handleSendMessageClick}>
        Send Message
      </Menu.Item>
      {/* Add more actions here */}
    </Menu>
  );

  const [address, setAddress] = useState<{
    street: string;
    city: string;
    stateOrProvince: string;
    postalCode: string;
    country: string; // Add this line for the 'country' property
  }>({
    street: "",
    city: "",
    stateOrProvince: "",
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
      console.log('res===', res)
      if (res.success) {
        setCustomer(res.data);
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
      // Create a structured address object, ensuring no empty strings or invalid data
      const addressData = {
        street: address.street || "", // Provide an empty string if not available
        city: address.city || "",
        stateOrProvince: address.stateOrProvince || "",
        postalCode: address.postalCode || "",
        country: address.country || "", // Ensure country is set correctly
      };

      // Prepare the update data
      const updateData: CustomerUpdate = {
        customerId: customerId,
        firstName: customer.firstName,
        middelName: customer.middelName,
        lastName: customer.lastName,
        email: customer.email,
        Number: customer.Number?.toString() || "", // Ensure Number is a string
        address: addressData, // Pass the structured address
      };

      if (editMode) {
        (updateData as any)[editMode] = editValue;
      }

      // Make the API call to update customer details
      const res = await updateCustomerBasicDetail(updateData);

      if (res.success) {
        if (res.customer) {
          setCustomer(res.customer);
        } else {
          await fetchCustomerDetails();
        }
        setEditMode(null);
        setEditValue("");
        setAddress({ street: "", city: "", stateOrProvince: "", postalCode: "", country: "" }); // Reset the address fields after save
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

  // New functions for image upload
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

      const response = await uploadFile(formData)

      if (response.success) {
        const updateData = {
          customerId: customerId,
          imagePath: response.fileUrl
        };

        const updateRes = await updateCustomerBasicDetail(updateData);

        if (updateRes.success) {
          setCustomer(updateRes.customer);
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
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="w-1/5 min-w-[250px] bg-white shadow-md p-4 flex flex-col items-center fixed md:relative md:h-screen h-screen overflow-y-auto z-50 transition-all">
      {/* Profile Image with upload button */}
      <div className="relative w-32 h-32 bg-gray-300 rounded-md flex items-center justify-center">
        {customer?.imagePath ? (
          <img src={customer.imagePath} alt={customer.firstName} className="w-full h-full object-cover rounded-md" />
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

      {/* First Name - separate field */}
      <div className="mt-3 text-center w-full">
        {editMode === "firstName" ? (
          <div className="flex items-center justify-center">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="px-2 py-1 border rounded mr-1 w-32"
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
          <h2
            className="text-lg font-semibold cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
            onClick={() => customer && handleEdit("firstName", customer.firstName)}
          >
            {customer ? customer.firstName : "Loading..."}
          </h2>
        )}
      </div>
      <div className="mt-3 text-center w-full">
        {editMode === "middelName" ? (
          <div className="flex items-center justify-center">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="px-2 py-1 border rounded mr-1 w-32"
              autoFocus
              placeholder="Enter middle name" // ✅ Add this
            />
            <button onClick={handleSave} disabled={isUpdating} className="text-green-500">
              <Check size={16} />
            </button>
            <button onClick={handleCancel} className="text-red-500 ml-1">
              <X size={16} />
            </button>
          </div>
        ) : (
          <h2
            className="text-lg font-semibold cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
            onClick={() => customer && handleEdit("middelName", customer.middelName)}
          >
            {customer ? customer.middelName || "No middle name" : "Loading..."}
          </h2>
        )}
      </div>

      {/* Last Name - separate field */}
      <div className="mt-1 text-center w-full">
        {editMode === "lastName" ? (
          <div className="flex items-center justify-center">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="px-2 py-1 border rounded mr-1 w-32"
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
          <h3
            className="text-md cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
            onClick={() => customer && handleEdit("lastName", customer.lastName)}
          >
            {customer ? customer.lastName : ""}
          </h3>
        )}
      </div>

      {/* Email display/edit */}
      <div className="w-full mt-2">
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
          <p
            className="text-gray-500 text-sm text-center cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
            onClick={() => customer && handleEdit("email", customer.email)}
          >
            {customer?.email || "No email available"}
          </p>
        )}
      </div>


      <Dropdown overlay={menu} trigger={['click']}>
        <a onClick={(e) => e.preventDefault()}>Actions ▼</a>
      </Dropdown>

      <SendMessage
        isOpen={modalVisible}
        onClose={handleCloseModal}
        func={() => {}}
        val={null}
      />

      {/* Contact Info */}
      <div className="mt-4 space-y-2 w-full text-gray-600">
        <div className="flex items-center space-x-2">
          <Mail size={18} />
          <span
            className="text-sm break-words cursor-pointer hover:bg-gray-100 px-2 py-1 rounded flex-1"
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
                  international
                  defaultCountry="US"
                  placeholder="Enter your Contact Number"
                  className="custom-stacked-phone-input w-full"
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
                disabled
                international
                defaultCountry="US"
                className="custom-stacked-phone-input w-full pointer-events-none"
              />

            </div>
          )}
        </div>





        {/* <div className="flex items-center space-x-2">
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
              <input
                type="text"
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                onKeyDown={handleKeyDown}
                className="px-2 py-1 border rounded w-full mb-2"
                placeholder="City"
              />
              <input
                type="text"
                value={address.stateOrProvince}
                onChange={(e) => setAddress({ ...address, stateOrProvince: e.target.value })}
                onKeyDown={handleKeyDown}
                className="px-2 py-1 border rounded w-full mb-2"
                placeholder="State/Province"
              />
              <input
                type="text"
                value={address.postalCode}
                onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                onKeyDown={handleKeyDown}
                className="px-2 py-1 border rounded w-full mb-2"
                placeholder="Postal Code"
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
              onClick={() =>
                customer &&
                handleEdit(
                  "address",
                  ${customer.address?.street || ""}, ${customer.address?.city || ""}, ${customer.address?.stateOrProvince || ""
                  }, ${customer.address?.postalCode || ""}
                )
              }
            >
              {customer?.address
                ? ${customer.address.street || ""}, ${customer.address.city || ""}, ${customer.address.stateOrProvince || ""
                }, ${customer.address.postalCode || ""}
                : "N/A"}
            </span>
          )}
        </div> */}



      </div>

      <ClientListManager
        customerId={customerId}
      />

    </div>
  );
};

export default Sidebar;