import React, { useState } from "react";
import { uploadImage, addCustomerPhoto } from "../../../config/apiClient";
import { useOutletContext } from "react-router-dom";
import { message } from "antd";

const Index = () => {
  const { customerId } = useOutletContext<{ customerId: string }>();
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles(selected);
    setPreviews(selected.map(file => URL.createObjectURL(file)));
    e.target.value = ''; // Reset input
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
        } else {
          message.error(saveRes?.message || "Failed to save image");
        }
      } else {
        message.error("Upload failed");
      }
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded">
        Select Images
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>

      <div className="mt-4 grid grid-cols-3 gap-4">
        {previews.map((src, idx) => (
          <img key={idx} src={src} alt={`preview-${idx}`} className="w-full h-auto rounded" />
        ))}
      </div>

      <button
        onClick={handleUpload}
        className="mt-4 px-4 py-2 bg-green-600 text-white rounded"
      >
        Upload
      </button>
    </div>
  );
};

export default Index;
