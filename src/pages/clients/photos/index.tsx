import React, { useState, useEffect } from "react";
import {
  uploadMultipleFiles ,
  addCustomerPhoto,
  getCustomerBasicDetail,
  updateCustomerBasicDetail, // Import the update function
} from "../../../config/apiClient";
import { useOutletContext } from "react-router-dom";
import { message, Dropdown, Menu } from "antd";
import { Customer } from "../../../schema/customernew";
import { MoreOutlined } from "@ant-design/icons";

interface CustomerWithPhotos extends Customer {
  photos?: {
    _id: string;
    url: string;
  }[];
}

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

type CustomerBasicDetailResponse = ApiResponse<Customer>;

const Index = () => {
  const { customerId } = useOutletContext<{ customerId: string }>();
  const [customer, setCustomer] = useState<CustomerWithPhotos | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    if (customerId) {
      fetchCustomerDetails();
    }
  }, [customerId]);

  const fetchCustomerDetails = async (): Promise<CustomerBasicDetailResponse | undefined> => {
    try {
      const res = await getCustomerBasicDetail(customerId);
      if (res.success) {
        setCustomer(res.data);
        console.log("Customer Basic Profile:", res.data);
      }
      return res;
    } catch (error) {
      console.error("Error fetching customer details:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles(selected);
    setPreviews(selected.map((file) => URL.createObjectURL(file)));
    e.target.value = "";
  };

  const handleUpload = async () => {
    if (!files.length) return message.warning("Please select at least one file");
  
    const uploadRes = await uploadMultipleFiles(files); // Assumes this uploads multiple and returns URLs
  
    if (uploadRes?.success && Array.isArray(uploadRes.files)) {
      const urls = uploadRes.files.map((fileObj: { fileUrl: string }) => fileObj.fileUrl).filter(Boolean);
  
      if (!urls.length) {
        return message.error("No images were successfully uploaded.");
      }
  
      const saveRes = await addCustomerPhoto({
        customerId,
        url: urls,
      });
  
      if (saveRes?.success) {
        message.success("All images uploaded and saved successfully");
        fetchCustomerDetails();
      } else {
        message.error(saveRes?.message || "Failed to save images");
      }
    } else {
      message.error("Upload failed");
    }
  
    setFiles([]);
    setPreviews([]);
  };
  
  

  const handleSetCoverPhoto = async (imagePath: string) => {
    try {
      const res = await updateCustomerBasicDetail({
        customerId,
        imagePath,
      });

      if (res?.success) {
        message.success("Cover photo updated");
        
        fetchCustomerDetails();
      } else {
        message.error(res?.message || "Failed to update cover photo");
      }
    } catch (error) {
      console.error("Error updating cover photo:", error);
      message.error("An error occurred");
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded inline-block">
        Select Images
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>

      {previews.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold text-lg mb-2">Selected Images Preview</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {previews.map((src, idx) => (
              <img
                key={idx}
                src={src}
                alt={`preview-${idx}`}
                className="w-full h-auto rounded shadow object-cover"
              />
            ))}
          </div>

          <button
            onClick={handleUpload}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded"
          >
            Upload
          </button>
        </div>
      )}

      {Array.isArray(customer?.photos) && customer.photos.length > 0 && (
        <div className="mt-8">
          <h3 className="font-semibold text-lg mb-2">Uploaded Photos</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {customer.photos.map((photo: { _id: string; url: string }) => (
              <div
                key={photo._id}
                className="relative rounded overflow-hidden shadow hover:shadow-lg transition-shadow"
              >
                <img
                  src={photo.url}
                  alt="Customer Uploaded"
                  className="w-full h-48 object-cover"
                />

                <Dropdown
                  overlay={
                    <Menu>
                      <Menu.Item
                        key="setCover"
                        onClick={() => handleSetCoverPhoto(photo.url)}
                      >
                        Set as Cover Photo
                      </Menu.Item>
                    </Menu>
                  }
                  trigger={['click']}
                  placement="bottomRight"
                >
                  <div className="absolute top-2 right-2 bg-white p-1 rounded shadow cursor-pointer">
                    <MoreOutlined style={{ fontSize: '16px', color: 'black' }} />
                  </div>
                </Dropdown>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
