import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import debounce from "lodash.debounce";
import { message } from "antd";
import moment from "moment";
import {
  getMatchGroupDetails,
  searchCustomerByName,
  createMatchGroupValue,
  getMatchSuggestions, deleteMatchGroupValue, updateMatchGroupValue
} from "../../../config/apiClient";
import { Dropdown, Menu, Modal, Button, Input } from "antd";
import { EllipsisOutlined, ExclamationCircleOutlined, MailOutlined, EnvironmentOutlined, InfoCircleOutlined, PushpinFilled, FileTextOutlined, UserAddOutlined } from "@ant-design/icons";
import SendIntro from "../SendIntro";

const ExpandableSection = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="border border-gray-200 rounded-lg mb-4 bg-white shadow-sm">
      <button
        className="w-full flex justify-between items-center px-5 py-3.5 text-left bg-gray-50 rounded-t-lg hover:bg-gray-100 transition-colors border-b border-gray-200"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="font-semibold text-gray-800 text-sm">{title}</span>
        <span className="text-gray-500 text-sm">{isExpanded ? "▲" : "▼"}</span>
      </button>
      {isExpanded && <div className="p-5">{children}</div>}
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
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [activeCardTab, setActiveCardTab] = useState<Record<string, "info" | "notes">>({});
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [inlineNotesText, setInlineNotesText] = useState<string>("");
  const [isCreateIntroModalOpen, setIsCreateIntroModalOpen] = useState(false);
  const [selectedMatchCustomerId, setSelectedMatchCustomerId] = useState<string | null>(null);


  const fetchGroups = async () => {
    try {
      const res = await getMatchGroupDetails(customerId);
      setGroupList(res || []);
      
      // Extract notes from the response and populate notes state
      const notesMap: Record<string, string> = {};
      if (res && Array.isArray(res)) {
        res.forEach((group: any) => {
          if (group.values && Array.isArray(group.values)) {
            group.values.forEach((value: any) => {
              if (value.valueId && value.notes) {
                notesMap[value.valueId] = value.notes;
              }
            });
          }
        });
      }
      setNotes(notesMap);
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




  const openClientModal = (client: any) => {
    setSelectedClient(client);
    setIsClientModalOpen(true);
  };


  const handleCreateIntro = (value: any) => {
    // Set the matched customer ID (the customer being introduced)
    const matchCustomerId = value.matchCustomerId || value._id;
    if (!matchCustomerId) {
      message.error("Customer ID not found");
      return;
    }
    setSelectedMatchCustomerId(matchCustomerId);
    setIsCreateIntroModalOpen(true);
  };

  const setCardTab = (valueId: string, tab: "info" | "notes") => {
    setActiveCardTab(prev => ({
      ...prev,
      [valueId]: tab
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Tabs - Card Based Design */}
      <div className="mb-6 flex gap-3">
        <button
          onClick={() => setActiveTab("matchGroups")}
          className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
            activeTab === "matchGroups"
              ? "bg-gray-900 !text-white shadow-md"
              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
          }`}
        >
          Match Groups
        </button>
        <button
          onClick={() => setActiveTab("suggestions")}
          className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
            activeTab === "suggestions"
              ? "bg-gray-900 !text-white shadow-md"
              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
          }`}
        >
          Suggestions
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "matchGroups" && (
        <>
          {/* Action Button */}
          <div className="flex justify-end mb-6">
            <button
              className="bg-gray-900 !text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-sm hover:bg-gray-800 transition-colors"
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
                  <div className="text-gray-500 text-sm py-6 text-center bg-gray-50 rounded-lg">No matches in this group.</div>
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
                                      id: value.valueId,
                                      customerId: value.customerId,
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
                          <Menu.Item 
                            icon={<FileTextOutlined />}
                            onClick={() => {
                              setCardTab(value.valueId, "notes");
                              setEditingNotesId(value.valueId);
                              setInlineNotesText(notes[value.valueId] || "");
                            }}
                          >
                            Notes
                          </Menu.Item>
                          <Menu.Item 
                            icon={<UserAddOutlined />}
                            onClick={() => handleCreateIntro(value)}
                          >
                            Create Intro
                          </Menu.Item>
                          <Menu.Divider />
                          <Menu.Item danger onClick={showDeleteConfirm}>
                            Delete Match
                          </Menu.Item>
                        </Menu>
                      );


                      const bgColors = [
                        "bg-blue-500", "bg-purple-500", "bg-pink-500", "bg-indigo-500",
                        "bg-green-500", "bg-yellow-500", "bg-red-500", "bg-teal-500"
                      ];
                      const bgColor = bgColors[value.firstName?.charCodeAt(0) % bgColors.length] || "bg-gray-500";
                      const initials = `${value.firstName?.[0] || ""}${value.lastName?.[0] || ""}`.toUpperCase();

                      return (
                        <div
                          key={value.valueId}
                          className="relative flex gap-4 p-5 rounded-lg shadow-sm border border-gray-200 bg-white hover:shadow-md transition-shadow"
                        >
                          {/* Dropdown Button */}
                          <div className="absolute top-4 right-4">
                            <Dropdown overlay={menu} trigger={['click']}>
                              <button className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
                                <EllipsisOutlined className="text-lg text-gray-600 cursor-pointer" />
                              </button>
                            </Dropdown>
                          </div>

                          {/* Image with Info Icon */}
                          <div className="relative flex-shrink-0">
                            {value.imagePath ? (
                              <img
                                src={value.imagePath}
                                alt={`${value.firstName} ${value.lastName}`}
                                className="w-24 h-24 rounded-lg object-cover border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => openClientModal(value)}
                                title="Click to view details"
                              />
                            ) : (
                              <div className={`w-24 h-24 rounded-lg ${bgColor} flex items-center justify-center text-white text-2xl font-bold border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity`}>
                                {initials}
                              </div>
                            )}
                            <button
                              onClick={() => openClientModal(value)}
                              className="absolute bottom-1 right-1 p-1.5 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors border border-gray-200"
                              title="View client details"
                            >
                              <InfoCircleOutlined className="text-xs text-gray-600" />
                            </button>
                          </div>

                          <div className="flex flex-col justify-center text-sm text-gray-700 flex-1 min-w-0">
                            <div className="mb-2">
                              <h4 className="font-semibold text-gray-900 text-base mb-0.5">
                                {value.firstName} {value.middleName} {value.lastName}
                              </h4>
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-4 mb-3 border-b border-gray-200">
                              <button
                                onClick={() => setCardTab(value.valueId, "info")}
                                className={`pb-2 text-xs font-medium transition-colors ${
                                  (activeCardTab[value.valueId] || "info") === "notes" 
                                    ? "text-gray-500 hover:text-gray-700" 
                                    : "text-gray-900 border-b-2 border-gray-900"
                                }`}
                              >
                                Info
                              </button>
                              <button
                                onClick={() => setCardTab(value.valueId, "notes")}
                                className={`pb-2 text-xs font-medium transition-colors ${
                                  (activeCardTab[value.valueId] || "info") === "notes" 
                                    ? "text-gray-900 border-b-2 border-gray-900" 
                                    : "text-gray-500 hover:text-gray-700"
                                }`}
                              >
                                Notes
                              </button>
                            </div>

                            {/* Tab Content */}
                            {(activeCardTab[value.valueId] || "info") === "notes" ? (
                              <div className="min-h-[100px]">
                                {editingNotesId === value.valueId ? (
                                  <div className="space-y-2">
                                    <Input.TextArea
                                      rows={4}
                                      value={inlineNotesText}
                                      onChange={(e) => setInlineNotesText(e.target.value)}
                                      placeholder="Enter your notes here..."
                                      className="text-sm"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === "Escape") {
                                          setEditingNotesId(null);
                                          setInlineNotesText("");
                                        }
                                      }}
                                    />
                                    <div className="flex justify-end gap-2">
                                      <button
                                        onClick={() => {
                                          setEditingNotesId(null);
                                          setInlineNotesText("");
                                        }}
                                        className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={async () => {
                                          try {
                                            await updateMatchGroupValue({
                                              id: value.valueId,
                                              customerId: value.customerId || customerId,
                                              notes: inlineNotesText
                                            });
                                            setNotes(prev => ({
                                              ...prev,
                                              [value.valueId]: inlineNotesText
                                            }));
                                            setEditingNotesId(null);
                                            setInlineNotesText("");
                                            message.success("Notes saved successfully");
                                          } catch (error) {
                                            console.error("Failed to save notes:", error);
                                            message.error("Failed to save notes");
                                          }
                                        }}
                                        className="px-3 py-1.5 text-sm text-white bg-gray-900 hover:bg-gray-800 rounded-md transition-colors"
                                      >
                                        Save
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div
                                    onClick={() => {
                                      setEditingNotesId(value.valueId);
                                      setInlineNotesText(notes[value.valueId] || "");
                                    }}
                                    className="cursor-pointer"
                                  >
                                    {notes[value.valueId] ? (
                                      <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors min-h-[80px]">
                                        {notes[value.valueId]}
                                      </div>
                                    ) : (
                                      <div className="text-sm text-gray-400 text-center py-6 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors min-h-[80px]">
                                        Click to add notes
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <>
                                <div className="mb-1.5 text-xs">
                                  <span className="font-medium text-gray-600">Email:</span>{" "}
                                  <span className="text-gray-700">{value.email || "N/A"}</span>
                                </div>
                                <div className="mb-1.5 text-xs">
                                  <span className="font-medium text-gray-600">Description:</span>{" "}
                                  <span className="text-gray-700">{value.matchingDescription || "N/A"}</span>
                                </div>
                                <div className="mb-1.5 text-xs">
                                  <span className="font-medium text-gray-600">Address:</span>{" "}
                                  <span className="text-gray-700">
                                    {value.address?.street ? `${value.address.street}, ` : ""}
                                    {value.address?.city ? `${value.address.city}, ` : ""}
                                    {value.address?.state ? `${value.address.state}, ` : ""}
                                    {value.address?.country || ""}
                                    {value.address?.postalCode ? ` - ${value.address.postalCode}` : ""}
                                  </span>
                                </div>
                                {value.createdAt && (
                                  <div className="mb-1 text-xs text-gray-500">
                                    <span className="font-medium">Added on:</span> {moment(value.createdAt).format('MMM DD, YYYY HH:mm')}
                                  </div>
                                )}
                                {value.createdBy && (
                                  <div className="text-xs text-gray-500">
                                    <span className="font-medium">Added by:</span> {value.createdBy.firstName} {value.createdBy.lastName}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ExpandableSection>
            ))
          ) : (
            <div className="text-gray-500 text-center py-10 bg-white rounded-lg border border-gray-200">No match groups found.</div>
          )}



        </>
      )}

      {activeTab === "suggestions" && (
        <div className="p-4">
          {loadingSuggestions ? (
            <div className="text-center text-gray-500 py-10">Loading suggestions...</div>
          ) : matchSuggestions.length === 0 ? (
            <div className="text-gray-400 text-sm text-center py-10 bg-white rounded-lg border border-gray-200">
              No suggestions available yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matchSuggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => openClientModal(suggestion)}
                >
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {suggestion.name || "Unnamed"}
                  </h4>
                  <p className="text-sm text-gray-600">{suggestion.email || "No email"}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}


      {/* Add Client Modal */}
      {showModal && (
        <>
          {/* Overlay Backdrop */}
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999]" onClick={() => setShowModal(false)} />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center z-[1000] px-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Add New Client Match</h3>

              {/* Search Client */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Client</label>
                <input
                  type="text"
                  className="border border-gray-300 rounded-lg px-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    debouncedSearch(e.target.value);
                    setSelectedClientId("");
                  }}
                  placeholder="Type to search..."
                />
                {searchResults.length > 0 && (
                  <div className="mt-2 border border-gray-200 rounded-lg w-full max-h-40 overflow-y-auto bg-white shadow-sm">
                    {searchResults.map((client) => {
                      const fullName = `${client.firstName} ${client.lastName}`;
                      const isSelected = selectedClientId === client._id;
                      const firstLetter = client.firstName.charAt(0).toUpperCase();
                      const bgColors = [
                        "bg-blue-500", "bg-purple-500", "bg-pink-500", "bg-indigo-500",
                        "bg-green-500", "bg-yellow-500", "bg-red-500", "bg-teal-500"
                      ];
                      const bgColor = bgColors[client.firstName?.charCodeAt(0) % bgColors.length] || "bg-gray-500";

                      return (
                        <div
                          key={client._id}
                          onClick={() => {
                            setSelectedClientId(client._id);
                            setSearchTerm(fullName);
                            setSearchResults([]);
                          }}
                          className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                            isSelected ? "bg-gray-100" : "hover:bg-gray-50"
                          }`}
                        >
                          {client.imagePath ? (
                            <img
                              src={client.imagePath}
                              alt={fullName}
                              className="w-10 h-10 rounded-full object-cover border border-gray-200"
                            />
                          ) : (
                            <div className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center text-sm font-semibold text-white`}>
                              {firstLetter}
                            </div>
                          )}
                          <span className="text-sm text-gray-700">{fullName}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Select Matching Group */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Matching Group</label>
                <select
                  className="border border-gray-300 rounded-lg px-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white"
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
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Matching Description</label>
                <textarea
                  rows={3}
                  className="border border-gray-300 rounded-lg px-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent resize-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter matching description..."
                />
              </div>

              {/* Actions */}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className="px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium transition-colors"
                >
                  Save
                </button>
              </div>

              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-light transition-colors"
                onClick={() => setShowModal(false)}
              >
                &times;
              </button>
            </div>
          </div>
        </>
      )}

      {/* Client Details Modal */}
      <Modal
        title={null}
        open={isClientModalOpen}
        onCancel={() => setIsClientModalOpen(false)}
        footer={null}
        centered
        width={650}
        className="client-details-modal"
        bodyStyle={{ padding: 0 }}
      >
        {selectedClient && (
          <div className="flex">
            {/* Left Side - Image */}
            <div className="flex-shrink-0 w-56 h-80 rounded-l-lg overflow-hidden shadow-lg">
              {selectedClient.imagePath ? (
                <img
                  src={selectedClient.imagePath}
                  alt={`${selectedClient.firstName} ${selectedClient.lastName}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-400 to-gray-600 text-4xl font-bold text-white">
                  {`${selectedClient.firstName?.[0] || ""}${selectedClient.lastName?.[0] || ""}`}
                </div>
              )}
            </div>

            {/* Right Side - Content */}
            <div className="flex-1 p-6 flex flex-col bg-white rounded-r-lg">
              {/* Name and Status */}
              <div className="mb-4">
                <h2 className="text-2xl font-semibold text-gray-800 mb-1">
                  {`${selectedClient.firstName || ""} ${selectedClient.middleName || ""} ${selectedClient.lastName || ""}`.trim()}
                </h2>
                <div className="flex items-center gap-2">
                  {selectedClient.isPinned && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                      <PushpinFilled className="text-xs" />
                      Pinned
                    </span>
                  )}
                  {selectedClient.activeStatus && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      Active
                    </span>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="space-y-4 flex-1">
                {/* Email */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <MailOutlined className="text-gray-600 text-sm" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 font-semibold">EMAIL</p>
                    <p className="text-sm text-gray-800 font-medium">{selectedClient.email || "Not provided"}</p>
                  </div>
                </div>

                {/* Location */}
                {selectedClient.address && (
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <EnvironmentOutlined className="text-gray-600 text-sm" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 font-semibold">LOCATION</p>
                      <p className="text-sm text-gray-800 font-medium">
                        {selectedClient.address?.city || "N/A"}
                        {selectedClient.address?.state && `, ${selectedClient.address.state}`}
                        {selectedClient.address?.country && `, ${selectedClient.address.country}`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Street Address */}
                {selectedClient.address?.street && (
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <EnvironmentOutlined className="text-gray-600 text-sm" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 font-semibold">ADDRESS</p>
                      <p className="text-sm text-gray-800 font-medium">{selectedClient.address.street}</p>
                    </div>
                  </div>
                )}

                {/* Matching Description */}
                {selectedClient.matchingDescription && (
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-600 text-sm">📝</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 font-semibold">MATCHING DESCRIPTION</p>
                      <p className="text-sm text-gray-800 font-medium">{selectedClient.matchingDescription}</p>
                    </div>
                  </div>
                )}

                {/* Created Date */}
                {selectedClient.createdAt && (
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-600 text-sm">📅</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 font-semibold">ADDED ON</p>
                      <p className="text-sm text-gray-800 font-medium">
                        {moment(selectedClient.createdAt).format('MMM DD, YYYY HH:mm')}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <Button
                  type="primary"
                  className="w-full !h-10 text-base font-medium !bg-gray-900 hover:!bg-gray-800"
                  onClick={() => {
                    if (selectedClient.matchCustomerId || selectedClient._id) {
                      const url = `/dashboard/add-client?customerId=${selectedClient.matchCustomerId || selectedClient._id}`;
                      window.open(url, "_blank");
                    }
                  }}
                >
                  🔗 View Full Profile
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Intro Modal */}
      <SendIntro
        customerId={selectedMatchCustomerId}
        isOpen={isCreateIntroModalOpen}
        onClose={() => {
          setIsCreateIntroModalOpen(false);
          setSelectedMatchCustomerId(null);
        }}
      />

    </div>
  );
};

export default MatchesPage;
