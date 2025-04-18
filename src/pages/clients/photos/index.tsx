import React, { useState, useEffect } from "react";
import {
  uploadImage,
  addCustomerPhoto,
  getCustomerBasicDetail,
} from "../../../config/apiClient";
import { useOutletContext } from "react-router-dom";
import { message } from "antd";
import { Customer } from "../../../schema/customernew";

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
    e.target.value = ""; // Reset input
  };

  const handleUpload = async () => {
    if (!files.length) return message.warning("Please select a file first");

    for (const file of files) {
      const uploadRes = await uploadImage(file);
      if (uploadRes?.fileUrl) {
        const saveRes = await addCustomerPhoto({
          customerId,
          url: uploadRes.fileUrl,
        });

        if (saveRes?.success) {
          message.success("Uploaded successfully");
          fetchCustomerDetails(); // Refresh the customer data after upload
        } else {
          message.error(saveRes?.message || "Failed to save image");
        }
      } else {
        message.error("Upload failed");
      }
    }

    // Reset preview and file state after upload
    setFiles([]);
    setPreviews([]);
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      {/* Upload Section */}
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
                className="rounded overflow-hidden shadow hover:shadow-lg transition-shadow"
              >
                <img
                  src={photo.url}
                  alt="Customer Uploaded"
                  className="w-full h-48 object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}


    </div>
  );
};

export default Index;
