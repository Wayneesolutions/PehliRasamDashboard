import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Input, Button, Card, Modal, Form, message, Spin } from "antd";
import { SearchOutlined, AppstoreOutlined, UserAddOutlined, InfoCircleOutlined } from "@ant-design/icons";

const Clients: React.FC = () => {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await axios.get("/api/customers/active");
      setClients(response.data.data);
    } catch (error) {
      console.error("Error fetching clients:", error);
      setError("Failed to load clients.");
    } finally {
      setLoading(false);
    }
  };

  const openClientModal = (client: any) => {
    setSelectedClient(client);
    setIsClientModalOpen(true);
  };

  const openAddClientModal = () => {
    setIsAddClientModalOpen(true);
  };

  const handleSaveClient = () => {
    form.validateFields().then((values) => {
      setIsAddClientModalOpen(false);
      navigate("/dashboard/add-client", { state: values });
    });
  };

  if (loading) return <Spin size="large" className="flex justify-center mt-10" />;
  if (error) return <p className="text-center text-red-500">{error}</p>;

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
        {clients.map((client) => (
          <Card key={client._id} className="flex flex-col items-center gap-3 p-4 text-center shadow-md">
            {client.imagePath ? (
              <img src={client.imagePath} alt={client.firstName} className="object-cover w-24 h-24 rounded-full shadow-md" />
            ) : (
              <div className="flex items-center justify-center w-24 h-24 text-xl font-semibold bg-gray-200 rounded-full">
                {client.firstName[0]}{client.lastName[0]}
              </div>
            )}
            <h3 className="text-lg font-semibold">{client.firstName} {client.lastName}</h3>
            <p className="text-gray-500">{client.address}</p>
            <Button type="primary" icon={<InfoCircleOutlined />} onClick={() => openClientModal(client)}>
              View Details
            </Button>
          </Card>
        ))}
      </div>

      {/* Client Details Modal */}
      <Modal
        title={<h2 className="text-lg font-semibold text-center">{selectedClient?.firstName} {selectedClient?.lastName}</h2>}
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
                {selectedClient.firstName[0]}
              </div>
            )}
            <div className="w-full mt-4 space-y-2">
              <p className="text-sm text-gray-600"><strong>📍 Address:</strong> {selectedClient.address}</p>
              <p className="text-sm text-gray-600"><strong>📧 Email:</strong> {selectedClient.email}</p>
            </div>
            <Button type="link" className="mt-4 text-sm text-blue-600 hover:underline" onClick={() => navigate("/dashboard/add-client", { state: { clientId: selectedClient._id } })}>
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
