import React, { useState, useEffect } from "react";
import apiClient, {
  uploadMultipleFiles,
  addCustomerPhoto,
  getCustomerBasicDetail,
  updateCustomerBasicDetail,
} from "../../../config/apiClient";
import { useOutletContext } from "react-router-dom";
import { message, Dropdown, Menu, Modal, Checkbox, Image } from "antd";
import { Customer } from "../../../schema/customernew";
import { MoreOutlined, DeleteOutlined, DownloadOutlined } from "@ant-design/icons";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const apiBaseUrl = (import.meta.env.VITE_APP_BASE_URL || "").replace(/\/+$/, "");
let apiOrigin = "";
try {
  const parsed = new URL(apiBaseUrl || "/", window.location.origin);
  apiOrigin = `${parsed.protocol}//${parsed.host}`;
} catch (error) {
  console.warn("Could not parse API base URL for origin derivation", error);
  apiOrigin = "";
}

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

const Index: React.FC = () => {
  const { customerId } = useOutletContext<{ customerId: string }>();
  const [customer, setCustomer] = useState<CustomerWithPhotos | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [downloading, setDownloading] = useState(false);

  const isAbsolute = (url: string) => /^https?:\/\//i.test(url);

  // Treat URL as external if its origin doesn't match our apiOrigin (or if apiOrigin not set, treat absolute as external)
  const isExternalUrl = (url: string) => {
    if (!isAbsolute(url)) return false;
    if (!apiOrigin) return true;
    try {
      const p = new URL(url);
      return `${p.protocol}//${p.host}`.toLowerCase() !== apiOrigin.toLowerCase();
    } catch {
      return true;
    }
  };

  const resolvePhotoUrl = (url: string) => {
    if (isAbsolute(url)) return url;
    if (!apiOrigin) return url;
    const normalizedPath = url.startsWith("/") ? url : `/${url}`;
    return `${apiOrigin}${normalizedPath}`;
  };

  const getPhotoFileName = (url: string, fallback = "photo.jpg") => {
    try {
      const parsed = new URL(url, window.location.origin);
      const pathname = decodeURIComponent(parsed.pathname || "");
      const name = pathname.split("/").filter(Boolean).pop();
      if (name) return name.split("?")[0].split("#")[0];
    } catch {
      const withoutQuery = url.split("?")[0].split("#")[0];
      const parts = withoutQuery.split("/").filter(Boolean);
      if (parts.length) return parts[parts.length - 1];
    }
    return fallback;
  };

  useEffect(() => {
    if (customerId) fetchCustomerDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const fetchCustomerDetails = async (): Promise<ApiResponse<Customer> | undefined> => {
    try {
      const res = await getCustomerBasicDetail(customerId);
      if (res.success) setCustomer(res.data);
      return res;
    } catch (err) {
      console.error("Error fetching customer details:", err);
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
      if (!urls.length) return message.error("No images were successfully uploaded.");
      const saveRes = await addCustomerPhoto({ customerId, url: urls });
      if (saveRes?.success) {
        message.success("All images uploaded and saved successfully");
        fetchCustomerDetails();
      } else message.error(saveRes?.message || "Failed to save images");
    } else message.error("Upload failed");
    setFiles([]); setPreviews([]);
  };

  const handleSetCoverPhoto = async (imagePath: string) => {
    try {
      const res = await updateCustomerBasicDetail({ customerId, imagePath });
      if (res?.success) { message.success("Cover photo updated"); fetchCustomerDetails(); }
      else message.error(res?.message || "Failed to update cover photo");
    } catch (err) { console.error(err); message.error("An error occurred"); }
  };

  const handleRemovePreview = (index: number) => {
    setFiles((p) => p.filter((_, i) => i !== index));
    setPreviews((p) => p.filter((_, i) => i !== index));
  };

  const handleDeletePhoto = (photoId: string, customerId: string) => {
    Modal.confirm({
      title: "Are you sure you want to delete this photo?",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          const response = await apiClient.post("/admin/deleteCustomerPhoto", { customerId, photoId });
          if (response.data.success) { message.success("Photo deleted successfully"); await fetchCustomerDetails(); }
          else message.error(response.data.message || "Failed to delete photo");
        } catch (err) {
          console.error(err); message.error("An error occurred while deleting the photo");
        }
      },
    });
  };

  const handlePhotoSelection = (photoId: string, checked: boolean) => {
    setSelectedPhotos((prev) => (checked ? [...prev, photoId] : prev.filter((id) => id !== photoId)));
  };
  const handleSelectAll = (checked: boolean) => {
    if (checked && customer?.photos) setSelectedPhotos(customer.photos.map((p) => p._id));
    else setSelectedPhotos([]);
  };

  // Fetch blobs: use proxy for external Azure URLs to bypass CORS, direct fetch for same-origin
  const fetchImageAsBlob = async (url: string): Promise<Blob | null> => {
    const resolved = resolvePhotoUrl(url);
    const isExternal = isExternalUrl(resolved);

    try {
      // For external Azure blob URLs, use backend proxy to bypass CORS
      if (isExternal && resolved.includes("pehlirasamstorage.blob.core.windows.net")) {
        const response = await apiClient.get("/admin/downloadExternalPhoto", {
          params: { url: resolved },
          responseType: "blob",
        });
        return response.data as Blob;
      }

      // For same-origin URLs, fetch directly with auth if needed
      const token = localStorage.getItem("token");
      const headers: Record<string, string> | undefined =
        !isExternal && token ? { Authorization: `Bearer ${token}` } : undefined;

      const resp = await fetch(resolved, {
        method: "GET",
        headers,
        mode: "cors",
        credentials: "omit",
      });

      if (!resp.ok) {
        console.error("[fetchImageAsBlob] fetch failed", { url: resolved, status: resp.status });
        return null;
      }

      const blob = await resp.blob();
      return blob;
    } catch (err) {
      console.error("[fetchImageAsBlob] error for", resolved, err);
      return null;
    }
  };

  const handleDownloadSelected = async () => {
    if (selectedPhotos.length === 0) return message.warning("Please select at least one photo to download");
    setDownloading(true);

    try {
      const selectedPhotoData = customer?.photos?.filter((p) => selectedPhotos.includes(p._id));
      if (!selectedPhotoData || selectedPhotoData.length === 0) { message.error("No photos found to download"); return; }

      if (selectedPhotoData.length === 1) {
        const photo = selectedPhotoData[0];
        const blob = await fetchImageAsBlob(photo.url);
        if (!blob) { message.error("Failed to download photo — check console/network for CORS or errors"); return; }

        const resolvedUrl = resolvePhotoUrl(photo.url);
        let fileName = getPhotoFileName(resolvedUrl, `customer-photo-${photo._id}.jpg`);
        if (!/\.[a-zA-Z0-9]{1,5}$/.test(fileName)) {
          const ext = blob.type ? blob.type.split("/").pop() : null;
          fileName = `${fileName}${ext ? `.${ext}` : ".jpg"}`;
        }
        saveAs(blob, fileName);
        message.success("Photo downloaded successfully");
      } else {
        const zip = new JSZip();
        let added = 0;
        await Promise.all(selectedPhotoData.map(async (photo, idx) => {
          const blob = await fetchImageAsBlob(photo.url);
          if (!blob) { console.warn("Skipping failed:", photo.url); return; }
          const resolvedUrl = resolvePhotoUrl(photo.url);
          let fname = getPhotoFileName(resolvedUrl, `photo-${idx + 1}.jpg`);
          if (!/\.[a-zA-Z0-9]{1,5}$/.test(fname)) {
            const ext = blob.type ? blob.type.split("/").pop() : null;
            fname = `${fname}${ext ? `.${ext}` : ".jpg"}`;
          }
          zip.file(fname, blob);
          added++;
        }));

        if (added === 0) { message.error("Failed to fetch any photos"); return; }
        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, `customer-photos-${customerId}.zip`);
        message.success(`${added} photos downloaded as ZIP`);
      }

      setSelectedPhotos([]);
    } catch (err) {
      console.error("Download error:", err);
      message.error("Failed to download photos");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 transition text-white px-5 py-2 rounded font-medium inline-block">
        Select Images
        <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
      </label>

      {previews.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Selected Image Previews</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {previews.map((src, idx) => (
              <div key={idx} className="relative rounded-md overflow-hidden shadow border bg-white group">
                <Image
                  src={src}
                  alt={`preview-${idx}`}
                  className="w-full h-48 object-cover cursor-pointer"
                  rootClassName="w-full"
                  preview={{
                    src: src,
                  }}
                />
                <button onClick={(e) => { e.stopPropagation(); handleRemovePreview(idx); }} className="absolute top-2 right-2 bg-red-600 !text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-10" title="Remove image">
                  <DeleteOutlined style={{ fontSize: "16px" }} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-6">
            <button onClick={handleUpload} className="bg-green-600 hover:bg-green-700 transition !text-white px-6 py-2 rounded-md font-medium">Upload Images</button>
          </div>
        </div>
      )}

      {Array.isArray(customer?.photos) && customer.photos.length > 0 && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">Uploaded Photos</h3>
            <div className="flex items-center gap-4">
              <Checkbox checked={selectedPhotos.length === customer.photos.length && customer.photos.length > 0} indeterminate={selectedPhotos.length > 0 && selectedPhotos.length < customer.photos.length} onChange={(e) => handleSelectAll(e.target.checked)}>Select All</Checkbox>
              {selectedPhotos.length > 0 && (
                <button onClick={handleDownloadSelected} disabled={downloading} className="bg-blue-600 hover:bg-blue-700 transition !text-white px-4 py-2 rounded-md font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  <DownloadOutlined />
                  {downloading ? "Downloading..." : `Download ${selectedPhotos.length} ${selectedPhotos.length === 1 ? "Photo" : "Photos"}`}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {customer.photos.map((photo) => (
              <div key={photo._id} className="relative rounded overflow-hidden shadow hover:shadow-lg transition-shadow">
                <Image
                  src={resolvePhotoUrl(photo.url)}
                  alt="Customer Uploaded"
                  className="w-full h-48 object-cover cursor-pointer"
                  rootClassName="w-full"
                  preview={{
                    src: resolvePhotoUrl(photo.url),
                  }}
                />
                <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
                  <Checkbox checked={selectedPhotos.includes(photo._id)} onChange={(e) => handlePhotoSelection(photo._id, e.target.checked)} className="bg-white rounded shadow-md p-1" />
                </div>

                <div onClick={(e) => e.stopPropagation()}>
                  <Dropdown overlay={<Menu>
                    <Menu.Item key="setCover" onClick={() => handleSetCoverPhoto(photo.url)}>Set as Cover Photo</Menu.Item>
                    <Menu.Item key="deletePhoto" onClick={() => handleDeletePhoto(photo._id, customerId)} danger>Delete Photo</Menu.Item>
                  </Menu>} trigger={["click"]} placement="bottomRight">
                    <div className="absolute top-2 right-2 bg-white p-1 rounded shadow cursor-pointer">
                      <MoreOutlined style={{ fontSize: "16px", color: "black" }} />
                    </div>
                  </Dropdown>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
