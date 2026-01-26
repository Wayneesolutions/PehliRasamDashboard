import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Button, Modal, Form, Menu, Dropdown, message, Checkbox, Tabs, Select, DatePicker } from "antd";
import { SearchOutlined, UserAddOutlined, InfoCircleOutlined, EllipsisOutlined, DownOutlined, CloseOutlined, PushpinOutlined, PushpinFilled, MailOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { addCustomerByAdmin, allActiveCustomer, deleteCustomer, getCustomerBasicDetail, getAllClientLists, advancedSearchCustomers, togglePinCustomer } from "../../config/apiClient";
import { ActiveClientDetails } from "../../schema/customernew";

const { TabPane } = Tabs;
const { Option } = Select;

type ClientList = {
  _id: string;
  listName: string;
  color: string;
  status: string;
};


const bgColors = [
  "bg-amber-300",     // soft gold
  "bg-rose-300",      // elegant rose
  "bg-sky-300",       // clean blue
  "bg-emerald-300",   // fresh green
  "bg-violet-300",    // modern purple
  "bg-orange-300",    // warm orange
  "bg-indigo-300",    // deep blue
  "bg-teal-300",      // minty teal
];


const Clients: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [activeclients, setActiveClients] = useState<ActiveClientDetails[]>([])
  const [clientListsMap, setClientListsMap] = useState<Record<string, ClientList[]>>({});
  const [form] = Form.useForm();
  const navigate = useNavigate();
  
  // Lists dropdown states
  const [isListsDropdownOpen, setIsListsDropdownOpen] = useState(false);
  const [allClientLists, setAllClientLists] = useState<ClientList[]>([]);
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
  const [listSearchTerm, setListSearchTerm] = useState("");
  
  // Advanced Search modal states
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("fields");
  const [searchCriteria, setSearchCriteria] = useState<any[]>([
    { id: 1, field: "membershipType", value: "" },
    { id: 2, field: "gender", value: "" },
    { id: 3, field: "caste", value: "" },
    { id: 4, field: "birthday", value: ["", ""] },
    { id: 5, field: "height", value: ["", ""] },
    { id: 6, field: "maritalStatus", value: "" },
    { id: 7, field: "registeredOnDate", value: ["", ""] },
    { id: 8, field: "registeredBy", value: "" },
  ]);

  const openClientModal = (client: ActiveClientDetails) => {
    setSelectedClient(client);
    setIsClientModalOpen(true);
  };

  const openAddClientModal = () => {
    setIsAddClientModalOpen(true);
  };

  const handleSaveClient = async () => {
    try {
      const values = await form.validateFields();
      const res = await addCustomerByAdmin(values);

      const newClient = res.data;

      // ✅ Prepend new client to activeclients list
      setActiveClients((prevClients) => [newClient, ...prevClients]);
      
      // Fetch client lists for the new client
      try {
        const detailRes = await getCustomerBasicDetail(newClient._id);
        if (detailRes.success && detailRes.data?.clientLists) {
          setClientListsMap((prev) => ({
            ...prev,
            [newClient._id]: detailRes.data.clientLists,
          }));
        } else {
          setClientListsMap((prev) => ({
            ...prev,
            [newClient._id]: [],
          }));
        }
      } catch (error) {
        console.error(`Error fetching client lists for new client:`, error);
        setClientListsMap((prev) => ({
          ...prev,
          [newClient._id]: [],
        }));
      }

      setIsAddClientModalOpen(false);

      navigate("/dashboard/add-client", {
        state: {
          customerId: newClient._id,
          customerData: newClient,
        },
      });
    } catch (error) {
      console.error("Validation or API error:", error);
    }
  };

  const fetchingCustomers = async (listIds?: string[]) => {
    const res = await allActiveCustomer(listIds);
    if (res.success) {
      const sorted = [...res.data].sort((a, b) => {
        return (
          new Date(parseInt(b._id.substring(0, 8), 16) * 1000).getTime() -
          new Date(parseInt(a._id.substring(0, 8), 16) * 1000).getTime()
        );
      });
      setActiveClients(sorted);
      
      // Fetch client lists for each customer
      const listsMap: Record<string, ClientList[]> = {};
      await Promise.all(
        sorted.map(async (client) => {
          try {
            const detailRes = await getCustomerBasicDetail(client._id);
            if (detailRes.success && detailRes.data?.clientLists) {
              listsMap[client._id] = detailRes.data.clientLists;
            } else {
              listsMap[client._id] = [];
            }
          } catch (error) {
            console.error(`Error fetching client lists for ${client._id}:`, error);
            listsMap[client._id] = [];
          }
        })
      );
      setClientListsMap(listsMap);
    } else {
      setActiveClients([]);
      setClientListsMap({});
    }
  };
  
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    fetchingCustomers();
    fetchAllClientLists();
    setIsInitialLoad(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch customers when list filter changes (but not on initial load)
  useEffect(() => {
    if (!isInitialLoad) {
      fetchingCustomers(selectedListIds.length > 0 ? selectedListIds : undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedListIds]);

  const fetchAllClientLists = async () => {
    try {
      const res = await getAllClientLists();
      if (res.success && res.data) {
        setAllClientLists(res.data);
      }
    } catch (error) {
      console.error("Error fetching all client lists:", error);
    }
  };
  const handleTogglePin = async (customerId: string) => {
    try {
      const res = await togglePinCustomer(customerId);
      if (res.success) {
        // Update the client's pin status in the local state
        setActiveClients((prevClients) =>
          prevClients.map((client) =>
            client._id === customerId
              ? { ...client, isPinned: res.data.isPinned }
              : client
          )
        );
        // Re-sort clients (pinned first)
        setActiveClients((prevClients) => {
          const sorted = [...prevClients].sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return (
              new Date(parseInt(b._id.substring(0, 8), 16) * 1000).getTime() -
              new Date(parseInt(a._id.substring(0, 8), 16) * 1000).getTime()
            );
          });
          return sorted;
        });
        message.success(res.message || `Client ${res.data.isPinned ? 'pinned' : 'unpinned'} successfully`);
      } else {
        message.error(res.message || "Failed to toggle pin status");
      }
    } catch (error) {
      console.error("Error toggling pin:", error);
      message.error("An error occurred while toggling pin status");
    }
  };

  const handleDeleteCustomer = (customerId: string) => {
    Modal.confirm({
      title: "Are you sure?",
      content: "This will permanently delete the customer.",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        const res = await deleteCustomer(customerId);
        if (res?.success) {
          message.success("Customer deleted successfully"); // ✅ green check
          await fetchingCustomers();
        } else {
          message.error(res?.message || "Failed to delete customer"); // ❌ red cross
        }

      },
    });
  };


  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const filteredClients = useMemo(() => {
    // Only filter by search term - list filtering is done on backend
    const filtered = activeclients.filter((client) =>
      `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchTerm)
    );
    
    // Sort: pinned clients first, then by creation date
    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return (
        new Date(parseInt(b._id.substring(0, 8), 16) * 1000).getTime() -
        new Date(parseInt(a._id.substring(0, 8), 16) * 1000).getTime()
      );
    });
  }, [searchTerm, activeclients]);

  // Filter lists based on search term (including "No List" option)
  const filteredLists = useMemo(() => {
    const noListOption = { _id: "no-list", listName: "No List", color: "#e5e7eb", status: "" };
    const allListsWithNoList = [noListOption, ...allClientLists];
    
    if (!listSearchTerm) return allListsWithNoList;
    return allListsWithNoList.filter((list) =>
      list.listName.toLowerCase().includes(listSearchTerm.toLowerCase())
    );
  }, [listSearchTerm, allClientLists]);

  // Handle select all lists (only selects filtered/visible lists)
  const handleSelectAllLists = () => {
    const allFilteredIds = filteredLists.map((list) => list._id);
    setSelectedListIds((prev) => {
      // Combine previous selections with filtered list IDs, removing duplicates
      const combined = [...new Set([...prev, ...allFilteredIds])];
      return combined;
    });
  };

  // Handle deselect all lists (deselects only filtered/visible lists)
  const handleDeselectAllLists = () => {
    const filteredIds = filteredLists.map((list) => list._id);
    setSelectedListIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
  };

  // Handle individual list selection
  const handleListToggle = (listId: string, checked: boolean) => {
    if (checked) {
      setSelectedListIds((prev) => 
        prev.includes(listId) ? prev : [...prev, listId]
      );
    } else {
      setSelectedListIds((prev) => prev.filter((id) => id !== listId));
    }
  };

  // Lists dropdown menu
  const listsDropdownMenu = (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 min-w-[280px] max-w-[320px]">
      {/* Search input inside dropdown */}
      <div className="p-3 border-b border-gray-200">
        <Input
          placeholder="Search lists..."
          value={listSearchTerm}
          onChange={(e) => setListSearchTerm(e.target.value)}
          prefix={<SearchOutlined />}
          className="w-full"
        />
      </div>

      {/* Select All / Deselect All */}
      <div className="p-2 border-b border-gray-200 flex gap-2">
        <button
          onClick={handleSelectAllLists}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium px-2 py-1"
        >
          Select All
        </button>
        <button
          onClick={handleDeselectAllLists}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium px-2 py-1"
        >
          Deselect All
        </button>
      </div>

      {/* Lists with checkboxes */}
      <div className="max-h-[300px] overflow-y-auto">
        {filteredLists.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">No lists found</div>
        ) : (
          <div className="p-2">
            {filteredLists.map((list) => {
              const isChecked = selectedListIds.includes(list._id);
              return (
                <div
                  key={list._id}
                  className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  onClick={(e) => {
                    // Prevent double triggering if clicking directly on checkbox
                    if (e.target instanceof HTMLInputElement) return;
                    handleListToggle(list._id, !isChecked);
                  }}
                >
                  <Checkbox
                    checked={isChecked}
                    onChange={(e) => handleListToggle(list._id, e.target.checked)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span
                    className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0"
                    style={{ backgroundColor: list.color }}
                  />
                  <span className="text-sm text-gray-700 flex-1">{list.listName}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      {/* Header with search, Advanced Search, and Add Client button */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          {/* Search input */}
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Type name to search"
              onChange={handleSearch}
              className="w-full"
            />
          </div>
          {/* Advanced Search button */}
          <Button
            type="default"
            className="border-gray-300"
            onClick={() => setIsAdvancedSearchOpen(true)}
          >
            Advanced Search
          </Button>
          {/* Reset/Show All button - only show if we have filtered results */}
          {(activeclients.length > 0 || selectedListIds.length > 0 || searchTerm) && (
            <Button
              type="default"
              className="border-gray-300"
              onClick={async () => {
                setSelectedListIds([]);
                setSearchTerm("");
                await fetchingCustomers(undefined);
                message.success("Showing all customers");
              }}
            >
              Show All
            </Button>
          )}
          {/* Add Client button - top right */}
          <Button
            icon={<UserAddOutlined />}
            type="primary"
            onClick={openAddClientModal}
          >
            + Client
          </Button>
        </div>

        {/* Filter buttons row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Lists dropdown */}
          <Dropdown
            overlay={listsDropdownMenu}
            trigger={["click"]}
            open={isListsDropdownOpen}
            onOpenChange={setIsListsDropdownOpen}
            placement="bottomLeft"
          >
            <Button className="flex items-center gap-1 border-gray-300">
              Lists
              {selectedListIds.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full min-w-[20px] text-center">
                  {selectedListIds.length}
                </span>
              )}
              <DownOutlined className="text-xs" />
            </Button>
          </Dropdown>
          {/* Clear list filter button - show when lists are selected */}
          {selectedListIds.length > 0 && (
            <Button
              type="default"
              className="border-gray-300"
              icon={<CloseOutlined />}
              onClick={() => {
                setSelectedListIds([]);
                message.info("List filter cleared");
              }}
            >
              Clear Lists
            </Button>
          )}
        </div>
      </div>




      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 mt-8">
        {filteredClients.map((client, index) => {
          const initials = `${client.firstName[0]}${client.lastName[0]}`;
          const bgColor = bgColors[index % bgColors.length]; // cycle through colors

          return (
            <div 
              key={client._id} 
              className="flex flex-col items-center text-center group"
            >
              {/* Image Container with Three-Dot Menu Inside */}
              <div className="relative w-24 h-36 rounded-md shadow-md overflow-hidden">
                {client.imagePath ? (
                  <img
                    src={client.imagePath}
                    alt={`${client.firstName} ${client.lastName}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${bgColor} text-3xl font-bold text-white`}>
                    {initials}
                  </div>
                )}

                {/* Pin Icon Indicator - Top Left */}
                {client.isPinned && (
                  <div className="absolute top-2 left-2 z-10">
                    <div className="bg-yellow-400 rounded-full p-1.5 shadow-lg">
                      <PushpinFilled className="text-yellow-900 text-sm" />
                    </div>
                  </div>
                )}

                {/* Three dot menu inside image box */}
                <div className="absolute top-2 right-2 z-10">
                  <Dropdown
                    overlay={
                      <Menu>
                        <Menu.Item 
                          key="togglePin"
                          icon={client.isPinned ? <PushpinFilled /> : <PushpinOutlined />}
                          onClick={() => handleTogglePin(client._id)}
                        >
                          {client.isPinned ? 'Unpin Client' : 'Pin Client'}
                        </Menu.Item>

                        <Menu.Item key="openProfile">
                          <button
                            className="w-full text-left"
                            onClick={() => {
                              const url = `/dashboard/add-client?customerId=${client._id}`;
                              window.open(url, "_blank");
                            }}
                          >
                            🔗 Open Profile in New Tab
                          </button>
                        </Menu.Item>

                        <Menu.Item
                          key="deleteCustomer"
                          danger
                          onClick={() => handleDeleteCustomer(client._id)}
                        >
                          🗑️ Delete Customer
                        </Menu.Item>
                      </Menu>
                    }
                    trigger={["click"]}
                  >
                    <Button
                      type="text"
                      className="!bg-white/90 hover:!bg-white rounded-full p-1.5 shadow-md backdrop-blur-sm border-0"
                      icon={
                        <EllipsisOutlined
                          style={{ transform: "rotate(90deg)", fontSize: 14, color: "#374151" }}
                        />
                      }
                    />
                  </Dropdown>
                </div>
              </div>

              <h3 className="!mt-2 !mb-0 text-sm font-semibold truncate w-full text-blue-600">
                {`${client.firstName} ${client.lastName}`}
              </h3>
              
              {/* Client List Colors and Info Icon Container */}
              <div className="flex items-center justify-center gap-2 mt-0 min-h-[20px] w-full">
                {/* Client List Colors */}
                {clientListsMap[client._id] && clientListsMap[client._id].length > 0 ? (
                  <div className="flex items-center justify-center gap-1.5 flex-wrap max-w-[80px]">
                    {clientListsMap[client._id].slice(0, 6).map((list) => (
                      <span
                        key={list._id}
                        className="w-4 h-4 rounded-full border border-gray-300 shadow-sm flex-shrink-0"
                        style={{ backgroundColor: list.color }}
                        title={list.listName}
                      />
                    ))}
                    {clientListsMap[client._id].length > 6 && (
                      <span
                        className="text-xs text-gray-500 font-medium"
                        title={clientListsMap[client._id].slice(6).map(l => l.listName).join(', ')}
                      >
                        +{clientListsMap[client._id].length - 6}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="w-[80px]"></div>
                )}
                
                {/* Info Icon */}
                <button
                  onClick={() => openClientModal(client)}
                  className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-200 group"
                  title="View client details"
                >
                  <InfoCircleOutlined className="text-xs text-gray-600 group-hover:text-blue-500" />
                </button>
              </div>




            </div>
          );
        })}
      </div>



      {/* Client Details Modal */}
      <Modal
        title={null}
        open={isClientModalOpen}
        onCancel={() => setIsClientModalOpen(false)}
        footer={null}
        centered
        width={650}
        className="client-details-modal"
        styles={{
          body: { padding: 0 }
        }}
      >
        {selectedClient && (
          <div className="flex">
            {/* Left Side - Image */}
            <div className="flex-shrink-0 w-56 h-80">
              <div className="w-full h-full rounded-l-lg overflow-hidden">
                {selectedClient.imagePath ? (
                  <img 
                    src={selectedClient.imagePath} 
                    alt={`${selectedClient.firstName} ${selectedClient.lastName}`} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500 text-5xl font-bold text-white">
                    {`${selectedClient.firstName[0]}${selectedClient.lastName[0]}`}
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Content */}
            <div className="flex-1 flex flex-col p-6 bg-white rounded-r-lg">
              {/* Name and Status */}
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  {`${selectedClient.firstName} ${selectedClient.lastName}`}
                </h2>
                <div className="flex items-center gap-2">
                  {selectedClient.activeStatus && (
                    <span className="inline-flex items-center px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                      Active
                    </span>
                  )}
                  {selectedClient.isPinned && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-medium rounded-full">
                      <PushpinFilled className="text-xs" />
                      Pinned
                    </span>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="space-y-4 flex-1">
                {/* Email */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                    <MailOutlined className="text-red-500 text-sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 font-semibold">EMAIL</p>
                    <p className="text-sm text-gray-800 font-medium break-words break-all">{selectedClient.email || "Not provided"}</p>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                    <EnvironmentOutlined className="text-red-500 text-sm" />
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

                {/* Street Address */}
                {selectedClient.address?.street && (
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                      <EnvironmentOutlined className="text-gray-500 text-sm" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 font-semibold">ADDRESS</p>
                      <p className="text-sm text-gray-800 font-medium">{selectedClient.address.street}</p>
                    </div>
                  </div>
                )}

                {/* Postal Code */}
                {selectedClient.address?.postalCode && (
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                      <span className="text-gray-500 text-xs">📮</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 font-semibold">POSTAL CODE</p>
                      <p className="text-sm text-gray-800 font-medium">{selectedClient.address.postalCode}</p>
                    </div>
                  </div>
                )}

                {/* Registration Date */}
                {selectedClient.registrationDate && (
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                      <span className="text-gray-500 text-xs">📅</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 font-semibold">REGISTERED ON</p>
                      <p className="text-sm text-gray-800 font-medium">
                        {new Date(selectedClient.registrationDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <Button
                  type="primary"
                  size="large"
                  className="w-full h-10 font-medium"
                  onClick={() => {
                    setIsClientModalOpen(false);
                    navigate("/dashboard/add-client", {
                      state: { customerId: selectedClient._id },
                    });
                  }}
                >
                  View Full Profile
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>


      {/* Add Client Modal */}
      <Modal
        title="Add New Client"
        open={isAddClientModalOpen}
        onCancel={() => setIsAddClientModalOpen(false)}
        onOk={handleSaveClient}
        okText="Save"
      >
        <Form form={form} layout="vertical">
          <Form.Item label="First Name" name="firstName" rules={[{ required: true, message: "First name is required" }]}>
            <Input placeholder="Enter first name" />
          </Form.Item>
          <Form.Item label="Last Name" name="lastName" rules={[{ required: true, message: "Last name is required" }]}>
            <Input placeholder="Enter last name" />
          </Form.Item>
          <Form.Item label="Email" name="email" rules={[{ type: "email", message: "Enter a valid email" }]}>
            <Input placeholder="Enter email" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Advanced Search Modal */}
      <Modal
        title={null}
        open={isAdvancedSearchOpen}
        onCancel={() => setIsAdvancedSearchOpen(false)}
        footer={null}
        width={900}
        className="advanced-search-modal"
        closable={true}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Fields" key="fields">
            <div className="mt-4">
              {/* Action Buttons */}
              <div className="flex items-center gap-3 mb-4">
                <Button
                  type="link"
                  className="!p-0 !text-blue-600"
                  onClick={() => {
                    setSearchCriteria(searchCriteria.map(c => ({ ...c, value: Array.isArray(c.value) ? ["", ""] : "" })));
                  }}
                >
                  Clear Values
                </Button>
              </div>

              {/* Search Criteria Rows */}
              <div className="space-y-3">
                {searchCriteria.map((criterion, index) => {
                  const getFieldLabel = (field: string) => {
                    const labels: Record<string, string> = {
                      membershipType: "Membership Type",
                      gender: "Gender",
                      caste: "Caste",
                      birthday: "Birthday (Age)",
                      height: "Height (ft & in)",
                      maritalStatus: "Marital Status",
                      registeredOnDate: "Registered On Date",
                      registeredBy: "Registered By",
                    };
                    return labels[field] || field;
                  };

                  const isRangeField = criterion.field === "birthday" || criterion.field === "height" || criterion.field === "registeredOnDate";

                  // Get dropdown options based on field type
                  const getFieldOptions = (field: string) => {
                    switch (field) {
                      case "membershipType":
                        return [
                          { value: "paid", label: "Paid Member" },
                          { value: "free", label: "Free Member" },
                          { value: "premium", label: "Premium Member" },
                          { value: "trial", label: "Trial Member" },
                        ];
                      case "gender":
                        return [
                          { value: "male", label: "Male" },
                          { value: "female", label: "Female" },
                          { value: "other", label: "Other" },
                        ];
                      case "caste":
                        return [
                          { value: "jatt", label: "Jatt" },
                          { value: "khatri", label: "Khatri" },
                          { value: "arora", label: "Arora" },
                          { value: "saini", label: "Saini" },
                          { value: "other", label: "Other" },
                        ];
                      case "maritalStatus":
                        return [
                          { value: "single", label: "Single" },
                          { value: "divorced", label: "Divorced" },
                          { value: "widowed", label: "Widowed" },
                          { value: "separated", label: "Separated" },
                        ];
                      case "registeredBy":
                        return [
                          { value: "admin", label: "Admin" },
                          { value: "self", label: "Self Registration" },
                          { value: "referral", label: "Referral" },
                        ];
                      default:
                        return [];
                    }
                  };

                  const fieldDropdownOptions = getFieldOptions(criterion.field);

                  return (
                    <div key={criterion.id} className="border border-gray-200 rounded p-3 bg-gray-50">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Field Label - Fixed */}
                        <div className="w-48 text-sm font-medium text-gray-700">
                          {getFieldLabel(criterion.field)}
                        </div>

                        {/* Value Input(s) */}
                        {isRangeField ? (
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder={criterion.field === "birthday" ? "Min Age" : criterion.field === "height" ? "Min Height" : "From Date"}
                              value={Array.isArray(criterion.value) ? criterion.value[0] : ""}
                              onChange={(e) => {
                                const updated = [...searchCriteria];
                                updated[index].value = [e.target.value, Array.isArray(criterion.value) ? criterion.value[1] : ""];
                                setSearchCriteria(updated);
                              }}
                              className="w-32"
                            />
                            <Input
                              placeholder={criterion.field === "birthday" ? "Max Age" : criterion.field === "height" ? "Max Height" : "To Date"}
                              value={Array.isArray(criterion.value) ? criterion.value[1] : ""}
                              onChange={(e) => {
                                const updated = [...searchCriteria];
                                updated[index].value = [Array.isArray(criterion.value) ? criterion.value[0] : "", e.target.value];
                                setSearchCriteria(updated);
                              }}
                              className="w-32"
                            />
                          </div>
                        ) : (
                          <Select
                            placeholder="Select value"
                            value={criterion.value || undefined}
                            onChange={(value) => {
                              const updated = [...searchCriteria];
                              updated[index].value = value;
                              setSearchCriteria(updated);
                            }}
                            className="w-48"
                            allowClear
                            showSearch
                          >
                            {fieldDropdownOptions.map(opt => (
                              <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                            ))}
                          </Select>
                        )}

                        {/* Remove Button */}
                        <Button
                          type="text"
                          danger
                          icon={<CloseOutlined />}
                          onClick={() => {
                            setSearchCriteria(searchCriteria.filter(c => c.id !== criterion.id));
                          }}
                          className="!p-1"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Search Button */}
              <div className="mt-6 flex justify-end">
                <Button type="primary" onClick={async () => {
                  try {
                    // Filter out empty criteria
                    const validCriteria = searchCriteria.filter(c => {
                      if (c.field === "registeredOnDate" || c.field === "birthday" || c.field === "height") {
                        return Array.isArray(c.value) && (c.value[0] || c.value[1]);
                      }
                      return c.value && c.value.trim();
                    });

                    if (validCriteria.length === 0) {
                      message.warning("Please fill at least one search criterion");
                      return;
                    }

                    // Show loading
                    const hideLoading = message.loading("Searching customers...", 0);

                    // Call advanced search API
                    const res = await advancedSearchCustomers(validCriteria);
                    hideLoading();

                    if (res.success) {
                      const sorted = [...res.data].sort((a, b) => {
                        return (
                          new Date(parseInt(b._id.substring(0, 8), 16) * 1000).getTime() -
                          new Date(parseInt(a._id.substring(0, 8), 16) * 1000).getTime()
                        );
                      });
                      setActiveClients(sorted);
                      
                      // Fetch client lists for filtered customers
                      const listsMap: Record<string, ClientList[]> = {};
                      await Promise.all(
                        sorted.map(async (client) => {
                          try {
                            const detailRes = await getCustomerBasicDetail(client._id);
                            if (detailRes.success && detailRes.data?.clientLists) {
                              listsMap[client._id] = detailRes.data.clientLists;
                            } else {
                              listsMap[client._id] = [];
                            }
                          } catch (error) {
                            console.error(`Error fetching client lists for ${client._id}:`, error);
                            listsMap[client._id] = [];
                          }
                        })
                      );
                      setClientListsMap(listsMap);

                      message.success(`Found ${sorted.length} customer(s) matching your criteria`);
                      setIsAdvancedSearchOpen(false);
                    } else {
                      message.error(res.message || "Search failed");
                    }
                  } catch (error) {
                    message.error("Error performing search");
                    console.error("Advanced search error:", error);
                  }
                }}>
                  Search
                </Button>
              </div>
            </div>
          </TabPane>
          <TabPane tab="Schedule" key="schedule">
            <div className="mt-4 p-4 text-center text-gray-500">
              Schedule search functionality coming soon
            </div>
          </TabPane>
        </Tabs>
      </Modal>
    </div>
  );
};

export default Clients;
