import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import debounce from "lodash.debounce";
import { message } from "antd";
import {
  getMatchGroupDetails,
  searchCustomerByName,
  createMatchGroupValue,
  getMatchSuggestions, deleteMatchGroupValue, updateMatchGroupValue
} from "../../../config/apiClient";
import { Dropdown, Menu, Modal } from "antd";
import { EllipsisOutlined, ExclamationCircleOutlined } from "@ant-design/icons";

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
  const [matchSuggestions, setMatchSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

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
  useEffect(() => {
    if (activeTab === "suggestions" && customerId) {
      fetchSuggestions();
    }
  }, [activeTab, customerId]);

  const fetchSuggestions = async () => {
    try {
      setLoadingSuggestions(true);
      const suggestions = await getMatchSuggestions(customerId);
      setMatchSuggestions(suggestions || []);
    } catch (error) {
      console.error("Failed to fetch match suggestions:", error);
    } finally {
      setLoadingSuggestions(false);
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
                    {group.values.map((value: any) => {

                      const showDeleteConfirm = () => {
                        Modal.confirm({
                          title: "Are you sure you want to delete this match?",
                          icon: <ExclamationCircleOutlined />,
                          content: "This action cannot be undone.",
                          okText: "Yes, Delete",
                          okType: "danger",
                          cancelText: "Cancel",
                          async onOk() {
                            try {
                              await deleteMatchGroupValue(value.valueId);
                              await fetchGroups(); 
                              // Optional: Refresh UI here
                            } catch (error) {
                              console.error("Error deleting match:", error);
                            }
                          },
                        });
                      };

                      const menu = (
                        <Menu>
                          <Menu.ItemGroup title="Move to Group">
                            {groupList.map((g) => (
                              <Menu.Item
                                key={g.groupId}
                                onClick={async () => {
                                  try {
                                    await updateMatchGroupValue({
                                      matchGroupId: g.groupId,
                                      id: value.valueId, // assuming this is the match value ID
                                      customerId: value.customerId, // the actual customer ID
                                      matchingDescription: value.matchingDescription || ""
                                    });
                                    await fetchGroups(); 
                                  } catch (error) {
                                    console.error("Failed to move customer:", error);
                                  }
                                }}
                              >
                                {g.groupName}
                              </Menu.Item>
                            ))}
                          </Menu.ItemGroup>
                          <Menu.Divider />
                          <Menu.Item danger onClick={showDeleteConfirm}>
                            Delete Match
                          </Menu.Item>
                        </Menu>
                      );


                      return (
                        <div
                          key={value.valueId}
                          className="relative flex gap-4 p-4 rounded-2xl shadow-sm border border-gray-200 bg-white"
                        >
                          {/* Dropdown Button */}
                          <div className="absolute top-4 right-4">
                            <Dropdown overlay={menu} trigger={['click']}>
                              <EllipsisOutlined className="text-xl cursor-pointer" />
                            </Dropdown>
                          </div>

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
                      );
                    })}
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
        <div className="p-4">
          {loadingSuggestions ? (
            <div className="text-center text-gray-500">Loading suggestions...</div>
          ) : matchSuggestions.length === 0 ? (
            <div className="text-gray-400 text-sm text-center py-10">
              No suggestions available yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matchSuggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  className="bg-white p-4 rounded shadow hover:shadow-md transition-shadow"
                >
                  <h4 className="font-semibold text-gray-700">
                    {suggestion.name || "Unnamed"}
                  </h4>
                  <p className="text-sm text-gray-500">{suggestion.email || "No email"}</p>
                  {/* Add more fields if available */}
                </div>
              ))}
            </div>
          )}
        </div>
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
                <div className="mt-2 border rounded w-full max-h-40 overflow-y-auto bg-white shadow">
                  {searchResults.map((client) => {
                    const fullName = `${client.firstName} ${client.lastName}`;
                    const isSelected = selectedClientId === client._id;
                    return (
                      <div
                        key={client._id}
                        onClick={() => {
                          setSelectedClientId(client._id);
                          setSearchTerm(fullName);
                          setSearchResults([]); // hide results after selection
                        }}
                        className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-blue-50 ${isSelected ? "bg-blue-100" : ""
                          }`}
                      >
                        {client.imagePath ? (
                          <img
                            src={client.imagePath}
                            alt={fullName}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-semibold text-gray-700">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-5 h-5 text-gray-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5.121 17.804A9 9 0 1119.07 7.75m-5.05 11.196a4.978 4.978 0 01-6.829-6.829"
                              />
                            </svg>
                          </div>
                        )}
                        <span className="text-sm">{fullName}</span>
                      </div>
                    );
                  })}
                </div>


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
