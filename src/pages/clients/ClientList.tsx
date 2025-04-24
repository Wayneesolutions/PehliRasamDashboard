import React, { useState, useEffect } from "react";
import {
  getAllClientLists,
  addCustomerToClientList,
  removeCustomerToClientList,
  getCustomerBasicDetail,
} from "../../config/apiClient";
import { message, Select } from "antd";
import { Customer } from "../../schema/customernew";
import { X } from "lucide-react";

type ClientListManagerProps = {
  customerId: string;
};

type ClientList = {
  _id: string;
  listName: string;
  color: string;
  status: string;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

type CustomerBasicDetailResponse = ApiResponse<Customer>;

const ClientList: React.FC<ClientListManagerProps> = ({ customerId }) => {
  const [, setCustomer] = useState<Customer | null>(null);
  const [clientLists, setClientLists] = useState<ClientList[]>([]);
  const [customerClientLists, setCustomerClientLists] = useState<ClientList[]>([]);
  const [selectedClientListId, setSelectedClientListId] = useState<string>("");
  const [loading, setLoading] = useState(false);

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
        setCustomerClientLists(res.data.clientLists || []);
      }
      return res;
    } catch (error) {
      console.error("Error fetching customer details:", error);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const clientListsResponse = await getAllClientLists();
        if (clientListsResponse?.success && Array.isArray(clientListsResponse.data)) {
          setClientLists(clientListsResponse.data);
        } else {
          message.error(clientListsResponse?.message || "Failed to fetch client lists");
        }

        await fetchCustomerDetails();
      } catch (error) {
        message.error("An error occurred while loading client data");
      }
    };

    fetchInitialData();
  }, [customerId]);

  const handleAddClientList = async () => {
    if (!selectedClientListId) {
      message.warning("Please select a client list first");
      return;
    }

    setLoading(true);
    try {
      const response = await addCustomerToClientList({
        clientListId: selectedClientListId,
        customerId,
      });

      setSelectedClientListId("");

      if (response?.success) {
        const msg = response.message?.toLowerCase();
        if (msg?.includes("already")) {
          message.info(response.message);
        }
      } else {
        message.error(response?.message || "Could not add client to the list.");
      }

      await fetchCustomerDetails();

    } catch (error) {
      message.error("An error occurred while adding the client to the list.");
    } finally {
      setLoading(false);
    }
  };



  const handleRemoveClientList = async (clientListId: string) => {
    setLoading(true);
    try {
      const response = await removeCustomerToClientList({
        clientListId,
        customerId,
      });

      if (response?.success) {
        message.success(response.message || "Client list updated.");
      } else {
        message.error(response?.message || "Could not remove client from the list.");
      }

      // Always refresh after attempt
      await fetchCustomerDetails();

    } catch (error) {
      message.error("An error occurred while removing the client from the list.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="mt-4 p-6 bg-white rounded-2xl w-full max-w-sm mx-auto" style={{
      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)'
    }}
    >
      <h3 className="text-lg font-bold mb-4 text-gray-700">Client Listing</h3>

      <Select
        className="w-full mb-4"
        placeholder="Select a client list"
        value={selectedClientListId || undefined}
        onChange={(value) => setSelectedClientListId(value)}
        options={clientLists.map((list) => ({
          label: (
            <div className="flex justify-between items-center">
              <span className="text-gray-700">{list.listName}</span>
              <span
                className="ml-2 w-4 h-4 rounded-full border border-gray-300"
                style={{ backgroundColor: list.color }}
              />
            </div>
          ),
          value: list._id,
        }))}
      />

      <button
        onClick={handleAddClientList}
        disabled={loading}
        className={`w-full py-2 text-white !mt-5 font-medium rounded-lg transition ${loading ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"
          }`}
      >
        {loading ? "Adding..." : "Add"}
      </button>

      {customerClientLists.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-gray-600 mb-2">
            Client belongs to:
          </h4>
          <ul className="space-y-2">
            {customerClientLists.map((list, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between px-3 py-1 bg-gray-100 rounded-md"
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-700">{list.listName}</span>
                  <span
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: list.color }}
                  />
                </div>
                <button
                  className="text-red-500 hover:text-red-700"
                  onClick={() => handleRemoveClientList(list._id)}
                >
                  <X size={16} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ClientList;
