import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import debounce from "lodash.debounce";
import { message } from "antd";
import {
  getMatchGroupDetails,
  searchCustomerByName,
  createMatchGroupValue,
} from "./Actions";

const ExpandableSection = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="border rounded-xl mb-4 bg-white shadow">
      <button
        className="w-full flex justify-between items-center px-4 py-3 text-left bg-gray-100 rounded-t-xl hover:bg-gray-200 transition"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="font-semibold text-gray-700">{title}</span>
        <span className="text-gray-500">{isExpanded ? "▲" : "▼"}</span>
      </button>
      {isExpanded && <div className="p-4 border-t">{children}</div>}
    </div>
  );
};


const MatchesPage = () => {
  const { customerId } = useOutletContext<{ customerId: string }>();
  const [activeTab, setActiveTab] = useState<"matchGroups" | "suggestions">("matchGroups");
  const [showModal, setShowModal] = useState(false);
  const [groupList, setGroupList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [description, setDescription] = useState("");

  const fetchGroups = async () => {
    try {
      const res = await getMatchGroupDetails(customerId);
      setGroupList(res || []);
    } catch (err) {
      console.error("Failed to fetch group list", err);
    }
  };
  useEffect(() => {
    if (customerId) {
      fetchGroups();
    }
  }, [customerId]);
    


  const debouncedSearch = debounce(async (value: string) => {
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const result = await searchCustomerByName(value);
      // Optional: sort alphabetically by firstName + lastName
      const sorted = result.sort((a: { firstName: string; lastName: string }, b: { firstName: string; lastName: string }) => {
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });


      setSearchResults(sorted);
    } catch (err) {
      console.error("Search failed", err);
    }
  }, 300); // debounce by 300ms


  const handleCreate = async () => {
    if (!selectedClientId || !selectedGroupId || !description) return;
  
    const payload = {
      matchGroupId: selectedGroupId,
      customerId,
      matchCustomerId: selectedClientId,
      matchingDescription: description,
    };
  
    try {
      const res = await createMatchGroupValue(payload);
      message.success(res?.message || "Client match created successfully.");
  
      // ✅ Fetch updated groups from API
      await fetchGroups();
  
      // ✅ Reset modal state
      setShowModal(false);
      setSearchTerm("");
      setSelectedClientId("");
      setSelectedGroupId("");
      setDescription("");
      setSearchResults([]);
    } catch (err) {
      console.error("Failed to create match", err);
      message.error("Failed to create client match");
    }
  };
  

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Tabs */}
      <div className="mb-6 border-b flex gap-6">
        <button
          onClick={() => setActiveTab("matchGroups")}
          className={`pb-2 text-sm font-medium ${activeTab === "matchGroups"
            ? "border-b-2 border-blue-600 text-blue-600"
            : "text-gray-600 hover:text-blue-600"
            }`}
        >
          Match Groups
        </button>
        <button
          onClick={() => setActiveTab("suggestions")}
          className={`pb-2 text-sm font-medium ${activeTab === "suggestions"
            ? "border-b-2 border-blue-600 text-blue-600"
            : "text-gray-600 hover:text-blue-600"
            }`}
        >
          Suggestions
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "matchGroups" && (
        <>
          {/* Action Button */}
          <div className="flex justify-end mb-4">
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm shadow hover:bg-blue-700 transition"
              onClick={() => setShowModal(true)}
            >
              + Add Clients
            </button>
          </div>

          {/* Group Panels */}
          {groupList.length > 0 ? (
            groupList.map((group) => (
              <ExpandableSection key={group.groupId} title={`${group.groupName} (${group.count})`}>
                {group.count === 0 ? (
                  <div className="text-gray-400 text-sm py-4 text-center">No matches in this group.</div>
                ) : (
                  <div className="flex flex-col gap-4 p-4">
                    {group.values.map((value: any) => (
                      <div
                        key={value.valueId}
                        className="flex gap-4 p-4 rounded-2xl shadow-sm border border-gray-200 bg-white"
                      >
                        <img
                          src={value.imagePath}
                          alt={`${value.firstName} ${value.lastName}`}
                          className="w-28 h-28 rounded-xl object-cover border"
                        />
                        <div className="flex flex-col justify-center text-sm text-gray-700">
                          <div className="mb-1">
                            <span className="font-semibold">Name:</span>{" "}
                            {value.firstName} {value.middleName} {value.lastName}
                          </div>
                          <div className="mb-1">
                            <span className="font-semibold">Email:</span> {value.email || "N/A"}
                          </div>
                          <div className="mb-1">
                            <span className="font-semibold">Description:</span> {value.matchingDescription || "N/A"}
                          </div>
                          <div>
                            <span className="font-semibold">Address:</span>{" "}
                            {value.address?.street}, {value.address?.city}, {value.address?.stateOrProvince}, {value.address?.country} - {value.address?.postalCode}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                )}
              </ExpandableSection>
            ))
          ) : (
            <div className="text-gray-500 text-center">No match groups found.</div>
          )}

        </>
      )}

      {activeTab === "suggestions" && (
        <div className="text-gray-400 text-sm text-center py-10">No suggestions available yet.</div>
      )}

      {/* Modal */}

      {showModal && (
        <>
          {/* Overlay Backdrop */}
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999]" />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center z-[1000] px-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
              <h3 className="text-lg font-semibold mb-4">Add New Client Match</h3>

              {/* Search Client */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Search Client</label>
                <input
                  type="text"
                  className="border rounded px-3 py-2 w-full text-sm"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    debouncedSearch(e.target.value);
                    setSelectedClientId("");
                  }}
                />
                {searchResults.length > 0 && (
                  <select
                    className="mt-2 border px-2 py-1 rounded w-full"
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const selectedClient = searchResults.find((c) => c._id === selectedId);
                      setSelectedClientId(selectedId);
                      setSearchTerm(selectedClient ? `${selectedClient.firstName} ${selectedClient.lastName}` : "");
                    }}
                  >
                    <option value="">Select a client</option>
                    {searchResults.map((client) => (
                      <option key={client._id} value={client._id}>
                        {client.firstName} {client.lastName}
                      </option>
                    ))}
                  </select>
                )}

              </div>


              {/* Select Matching Group */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Select Matching Group</label>
                <select
                  className="border px-2 py-2 rounded w-full text-sm"
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                >
                  <option value="">Select a group</option>
                  {groupList.map((g) => (
                    <option key={g.groupId} value={g.groupId}>
                      {g.groupName}
                    </option>
                  ))}

                </select>
              </div>

              {/* Matching Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Matching Description</label>
                <textarea
                  rows={3}
                  className="border rounded px-3 py-2 w-full text-sm"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Actions */}
              <div className="mt-6 flex justify-end gap-2">
                <button
                  className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Save
                </button>
              </div>

              <button
                className="absolute top-2 right-3 text-gray-500 hover:text-gray-700 text-xl"
                onClick={() => setShowModal(false)}
              >
                &times;
              </button>
            </div>
          </div>
        </>
      )}


    </div>
  );
};

export default MatchesPage;
