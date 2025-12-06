import React, { useState, useEffect } from "react";
import apiClient, {
  uploadMultipleFiles,
  addCustomerPhoto,
  getCustomerBasicDetail,
  updateCustomerBasicDetail,
} from "../../../config/apiClient";
import { useOutletContext } from "react-router-dom";
import { message, Dropdown, Menu, Modal, Checkbox } from "antd";
import { Customer } from "../../../schema/customernew";
import { MoreOutlined, DeleteOutlined, DownloadOutlined } from "@ant-design/icons";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import axios from "axios";

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
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [downloading, setDownloading] = useState(false);

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

    const uploadRes = await uploadMultipleFiles(files);

    if (uploadRes?.success && Array.isArray(uploadRes.fileUrls)) {
      const urls = uploadRes.fileUrls.filter(Boolean);

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

  const handleRemovePreview = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeletePhoto = (photoId: string, customerId: string) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this photo?',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const response = await apiClient.post('/admin/deleteCustomerPhoto', {
            customerId,
            photoId,
          });

          if (response.data.success) {
            message.success('Photo deleted successfully');
            await fetchCustomerDetails();
          } else {
            message.error(response.data.message || 'Failed to delete photo');
          }
        } catch (error) {
          message.error('An error occurred while deleting the photo');
        }
      },
    });
  };

  const handlePhotoSelection = (photoId: string, checked: boolean) => {
    if (checked) {
      setSelectedPhotos((prev) => [...prev, photoId]);
    } else {
      setSelectedPhotos((prev) => prev.filter((id) => id !== photoId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && customer?.photos) {
      setSelectedPhotos(customer.photos.map((photo) => photo._id));
    } else {
      setSelectedPhotos([]);
    }
  };

  // Improved download method using backend proxy to bypass CORS
  const fetchImageAsBlob = async (url: string): Promise<Blob | null> => {
    try {
      // Method 1: Use backend proxy (bypasses CORS issues)
      try {
        const response = await apiClient.post('/admin/proxyImage', 
          { imageUrl: url },
          { responseType: 'blob', timeout: 30000 }
        );
        if (response.data instanceof Blob && response.data.size > 0) {
          return response.data;
        }
      } catch (proxyError) {
        console.log("Backend proxy failed, trying direct fetch:", proxyError);
      }

      // Method 2: Try using axios directly (for external URLs)
      try {
        const response = await axios.get(url, {
          responseType: 'blob',
          timeout: 30000, // 30 second timeout
        });
        if (response.data instanceof Blob && response.data.size > 0) {
          return response.data;
        }
      } catch (axiosError) {
        console.log("Axios fetch failed, trying fetch API:", axiosError);
      }

      // Method 3: Try using fetch with CORS mode
      try {
        const response = await fetch(url, {
          mode: 'cors',
          credentials: 'omit',
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const blob = await response.blob();
        if (blob && blob.size > 0) {
          return blob;
        }
      } catch (fetchError) {
        console.log("Fetch API failed, trying canvas method:", fetchError);
      }

      // Method 4: Canvas-based approach (works even with CORS)
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        let resolved = false;
        let timeoutId: NodeJS.Timeout;
        
        const resolveOnce = (blob: Blob | null) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            resolve(blob);
          }
        };
        
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              canvas.toBlob((blob) => {
                resolveOnce(blob);
              }, 'image/jpeg', 0.95);
            } else {
              resolveOnce(null);
            }
          } catch (error) {
            console.error("Canvas conversion error:", error);
            resolveOnce(null);
          }
        };

        img.onerror = () => {
          console.error("Image load error for URL:", url);
          resolveOnce(null);
        };

        // Set a timeout for image loading
        timeoutId = setTimeout(() => {
          if (!img.complete && !resolved) {
            console.error("Image load timeout for URL:", url);
            resolveOnce(null);
          }
        }, 30000);

        img.src = url;
      });
    } catch (error) {
      console.error("Error fetching image:", error);
      return null;
    }
  };

  const handleDownloadSelected = async () => {
    if (selectedPhotos.length === 0) {
      return message.warning("Please select at least one photo to download");
    }

    setDownloading(true);

    try {
      const selectedPhotoData = customer?.photos?.filter((photo) =>
        selectedPhotos.includes(photo._id)
      );

      if (!selectedPhotoData || selectedPhotoData.length === 0) {
        message.error("No photos found to download");
        setDownloading(false);
        return;
      }

      if (selectedPhotoData.length === 1) {
        // Single image download
        const photo = selectedPhotoData[0];
        const blob = await fetchImageAsBlob(photo.url);
        
        if (!blob || blob.size === 0) {
          message.error("Failed to download photo");
          setDownloading(false);
          return;
        }

        const fileName = photo.url.split('/').pop() || `customer-photo-${photo._id}.jpg`;
        saveAs(blob, fileName);
        message.success("Photo downloaded successfully");
      } else {
        // Multiple images - download as zip
        const zip = new JSZip();
        let successCount = 0;
        let failCount = 0;

        const imageFetchPromises = selectedPhotoData.map(async (photo, index) => {
          const blob = await fetchImageAsBlob(photo.url);
          if (blob && blob.size > 0) {
            // Extract filename from URL or use index
            let fileName = photo.url.split('/').pop() || `photo-${index + 1}.jpg`;
            // Remove query parameters if any
            fileName = fileName.split('?')[0];
            // Ensure unique filename if duplicates exist
            if (zip.file(fileName)) {
              const ext = fileName.split('.').pop() || 'jpg';
              const nameWithoutExt = fileName.replace(`.${ext}`, '');
              fileName = `${nameWithoutExt}-${index + 1}.${ext}`;
            }
            zip.file(fileName, blob);
            successCount++;
          } else {
            failCount++;
            console.error(`Failed to fetch image: ${photo.url}`);
          }
        });

        await Promise.all(imageFetchPromises);

        // Check if we have any files in the zip
        const fileCount = Object.keys(zip.files).length;
        if (fileCount === 0) {
          message.error("Failed to download any photos. Please check your network connection and try again.");
          setDownloading(false);
          return;
        }

        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, `customer-photos-${customerId}.zip`);
        
        if (failCount > 0) {
          message.warning(`${successCount} photos downloaded, ${failCount} failed`);
        } else {
          message.success(`${successCount} photos downloaded as ZIP`);
        }
      }

      setSelectedPhotos([]);
    } catch (error) {
      console.error("Download error:", error);
      message.error("Failed to download photos");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 transition text-white px-5 py-2 rounded font-medium inline-block">
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
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">
            Selected Image Previews
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {previews.map((src, idx) => (
              <div
                key={idx}
                className="relative rounded-md overflow-hidden shadow border bg-white group"
              >
                <img
                  src={src}
                  alt={`preview-${idx}`}
                  className="w-full h-48 object-cover"
                />
                <button
                  onClick={() => handleRemovePreview(idx)}
                  className="absolute top-2 right-2 bg-red-600 !text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  title="Remove image"
                >
                  <DeleteOutlined style={{ fontSize: "16px" }} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={handleUpload}
              className="bg-green-600 hover:bg-green-700 transition !text-white px-6 py-2 rounded-md font-medium"
            >
              Upload Images
            </button>
          </div>
        </div>
      )}

      {Array.isArray(customer?.photos) && customer.photos.length > 0 && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">Uploaded Photos</h3>
            <div className="flex items-center gap-4">
              <Checkbox
                checked={
                  selectedPhotos.length === customer.photos.length &&
                  customer.photos.length > 0
                }
                indeterminate={
                  selectedPhotos.length > 0 &&
                  selectedPhotos.length < customer.photos.length
                }
                onChange={(e) => handleSelectAll(e.target.checked)}
              >
                Select All
              </Checkbox>
              {selectedPhotos.length > 0 && (
                <button
                  onClick={handleDownloadSelected}
                  disabled={downloading}
                  className="bg-blue-600 hover:bg-blue-700 transition !text-white px-4 py-2 rounded-md font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <DownloadOutlined />
                  {downloading
                    ? "Downloading..."
                    : `Download ${selectedPhotos.length} ${
                        selectedPhotos.length === 1 ? "Photo" : "Photos"
                      }`}
                </button>
              )}
            </div>
          </div>
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

                <div className="absolute top-2 left-2 z-10">
                  <Checkbox
                    checked={selectedPhotos.includes(photo._id)}
                    onChange={(e) =>
                      handlePhotoSelection(photo._id, e.target.checked)
                    }
                    className="bg-white rounded shadow-md p-1"
                  />
                </div>

                <Dropdown
                  overlay={
                    <Menu>
                      <Menu.Item key="setCover" onClick={() => handleSetCoverPhoto(photo.url)}>
                        Set as Cover Photo
                      </Menu.Item>
                      <Menu.Item
                        key="deletePhoto"
                        onClick={() => handleDeletePhoto(photo._id, customerId)}
                        danger
                      >
                        Delete Photo
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