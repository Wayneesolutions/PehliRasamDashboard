import React, { useState, useEffect } from "react";
import {
  getAllClientLists,
  addCustomerToClientList,
} from "../../config/apiClient";
import { message, Select } from "antd";

type ClientListManagerProps = {
  customerId: string;
  fetchCustomerDetails: () => Promise<any>; // Ensure it returns the updated data
};

type ClientList = {
  _id: string;
  listName: string;
  color: string;
  status: string;
};

const ClientList: React.FC<ClientListManagerProps> = ({
  customerId,
  fetchCustomerDetails,
}) => {
  const [clientLists, setClientLists] = useState<ClientList[]>([]);
  const [customerClientLists, setCustomerClientLists] = useState<ClientList[]>([]);


  const [selectedClientListId, setSelectedClientListId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch all available client lists
        const clientListsResponse = await getAllClientLists();
        if (clientListsResponse?.success && Array.isArray(clientListsResponse.data)) {
          setClientLists(clientListsResponse.data);
        } else {
          message.error(clientListsResponse?.message || "Failed to fetch client lists");
        }
  
        // Fetch customer's assigned lists
        const customerDetails = await fetchCustomerDetails();
        console.log("Fetched Customer Details:", customerDetails?.data); // ✅ Debug log
  
        if (customerDetails?.data?.clientLists) {
          setCustomerClientLists(customerDetails.data.clientLists);
        }
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

      if (response?.message) {
        message.success(response.message);
      }

      if (response?.data) {
        setSelectedClientListId("");
        const updatedData = await fetchCustomerDetails();
        console.log("Updated Customer Details:", updatedData);

        if (updatedData?.data?.clientLists) {
          setCustomerClientLists(updatedData.data.clientLists);
        }
      } else {
        message.error(response?.message || "Failed to add client to the list");
      }
    } catch (error) {
      message.error("An error occurred while adding client to the list");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-md w-full max-w-sm mx-auto">
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
        className={`w-full py-2 text-white font-medium rounded-lg transition ${
          loading ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"
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
          <span className="text-gray-700">{list.listName}</span>
          <span
            className="ml-2 w-4 h-4 rounded-full border border-gray-300"
            style={{ backgroundColor: list.color }}
          />
        </li>
      ))}
    </ul>
  </div>
)}

    </div>
  );
};

export default ClientList;
