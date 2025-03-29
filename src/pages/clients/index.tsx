import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Button, Card, Modal, Form, message } from "antd";
import { SearchOutlined, AppstoreOutlined, UserAddOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { getCustomerList } from "./Actions";
import apiClient from '../../config/apiClient';


// Add interface for the API response
interface Address {
  street: string;
  city: string;
  stateOrProvince: string;
  country: string;
  postalCode: string;
}

interface Customer {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  activeStatus: boolean;
  imagePath: string;
  address: Address;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: Customer[];
}

const Clients: React.FC = () => {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedClient, setSelectedClient] = useState<Customer | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [clients, setClients] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    getCustomerList()
      .then((response: ApiResponse) => {
        if (response.success && Array.isArray(response.data)) {
          setClients(response.data);
        } else {
          console.error("Unexpected API response format:", response);
          message.error("Invalid data format received from server.");
        }
      })
      .catch((error) => {
        console.error("API Error:", error);
        message.error("Failed to fetch clients. Please try again.");
      })
      .finally(() => setLoading(false));
  }, []);

  const openClientModal = (client: Customer) => {
    setSelectedClient(client);
    setIsClientModalOpen(true);
  };

  const openAddClientModal = () => {
    setIsAddClientModalOpen(true);
  };

  // const handleSaveClient = () => {
  //   form.validateFields().then((values) => {
  //     setIsAddClientModalOpen(false);
  //     navigate("/dashboard/add-client", { state: values });
  //   });
  // };
  const handleSaveClient = async () => {
    try {
      const values = await form.validateFields(); // Validate form fields
      setLoading(true);
  
      const response = await apiClient.post('/admin/addCustomerByAdmin', values);
  
      if (response.data.success) {
        message.success("Client added successfully!");
        form.resetFields();
        setIsAddClientModalOpen(false);
  
        getCustomerList().then((response: ApiResponse) => {
          if (response.success && Array.isArray(response.data)) {
            setClients(response.data);
          }
        });
      } else {
        message.error(response.data.message || "Failed to add client.");
      }
    } catch (error) {
      const errorMessage = (error as any)?.response?.data?.message || 'Failed to add client. Please try again.';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      {/* Search & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <Input prefix={<SearchOutlined />} placeholder="Type name to search" className="w-full sm:w-1/3" />
        <div className="flex flex-wrap gap-2">
          <Button icon={<UserAddOutlined />} type="primary" onClick={openAddClientModal}>
            + Client
          </Button>
          <Button icon={<AppstoreOutlined />} onClick={() => setView("grid")} />
        </div>
      </div>

      {/* Client Display */}
      <div className={`grid ${view === "grid" ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3" : "flex flex-col"} gap-4`}>
        {loading ? (
          <div>Loading...</div>
        ) : (
          clients.map((client) => (
            <Card key={client._id} className="flex flex-col items-center gap-3 p-4 text-center shadow-md">
              {client.imagePath ? (
                <img src={client.imagePath} alt={`${client.firstName} ${client.lastName}`} className="object-cover w-24 h-24 rounded-full shadow-md" />
              ) : (
                <div className="flex items-center justify-center w-24 h-24 text-xl font-semibold bg-gray-200 rounded-full">
                  {`${client.firstName[0]}${client.lastName[0]}`}
                </div>
              )}
              <h3 className="text-lg font-semibold">{`${client.firstName} ${client.lastName}`}</h3>
              <p className="text-gray-500">{`${client.address.city}, ${client.address.country}`}</p>
              <Button type="primary" icon={<InfoCircleOutlined />} onClick={() => openClientModal(client)}>
                View Details
              </Button>
            </Card>
          ))
        )}
      </div>

      {/* Client Details Modal */}
      <Modal
        title={<h2 className="text-lg font-semibold text-center">
          {selectedClient ? `${selectedClient.firstName} ${selectedClient.lastName}` : ''}
        </h2>}
        open={isClientModalOpen}
        onCancel={() => setIsClientModalOpen(false)}
        footer={null}
        centered
        width={350}
      >
        {selectedClient && (
          <div className="flex flex-col items-center p-4 text-center">
            {selectedClient.imagePath ? (
              <img src={selectedClient.imagePath} alt="Profile" className="object-cover w-24 h-24 rounded-full shadow-md" />
            ) : (
              <div className="flex items-center justify-center w-24 h-24 text-3xl font-semibold bg-gray-200 rounded-full shadow-md">
                {`${selectedClient.firstName[0]}${selectedClient.lastName[0]}`}
              </div>
            )}
            <div className="w-full mt-4 space-y-2">
              <p className="text-sm text-gray-600">
                <strong>📍 Location:</strong> {`${selectedClient.address.street}, ${selectedClient.address.city}, ${selectedClient.address.stateOrProvince} ${selectedClient.address.postalCode}, ${selectedClient.address.country}`}
              </p>
              <p className="text-sm text-gray-600"><strong>📧 Email:</strong> {selectedClient.email}</p>
              <p className="text-sm text-gray-600"><strong>Status:</strong> {selectedClient.activeStatus ? 'Active' : 'Inactive'}</p>
            </div>
            <Button 
              type="link" 
              className="mt-4 text-sm text-blue-600 hover:underline" 
              onClick={() => navigate("/dashboard/add-client", { state: { clientId: selectedClient._id } })}
            >
              🔗 View Full Profile
            </Button>
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
          <Form.Item label="Email" name="email" rules={[{ required: true, type: "email", message: "Enter a valid email" }]}>
            <Input placeholder="Enter email" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Clients;
