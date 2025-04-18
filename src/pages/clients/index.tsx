import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Button, Card, Modal, Form } from "antd";
import { SearchOutlined, UserAddOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { addCustomerByAdmin, allActiveCustomer } from "../../config/apiClient";
import { ActiveClientDetails } from "../../schema/customernew";


const Clients: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [activeclients, setActiveClients] = useState<ActiveClientDetails[]>([])
  const [form] = Form.useForm();
  const navigate = useNavigate();

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

      const customerId = res.data._id;
      setIsAddClientModalOpen(false);

      navigate("/dashboard/add-client", {
        state: { customerId, customerData: res.data }
      });
    } catch (error) {
      console.error("Validation or API error:", error);
    }
  };

  useEffect(() => {
    const fetchingCustomers = async () => {
      const res = await allActiveCustomer()
      if (res.success) {
        setActiveClients(res?.data)
      } else {
        setActiveClients([])
      }

    }
    fetchingCustomers()
  }, [])


  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const filteredClients = useMemo(() => {
    return activeclients.filter((client) =>
      `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchTerm)
    );
  }, [searchTerm, activeclients]);

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      {/* Header with search and button */}
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        {/* Left: Search input with fixed width */}
        <div className="flex-1 min-w-[200px] max-w-[300px]">
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search by name"
            onChange={handleSearch}
          />
        </div>

        {/* Right: Add Client button */}
        <Button icon={<UserAddOutlined />} type="primary" onClick={openAddClientModal}>
          + Client
        </Button>
      </div>




      {/* Client Grid Display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filteredClients.map((client) => (
          <Card key={client._id} className="p-4 shadow-md flex flex-col items-center gap-3 text-center">
            {client.imagePath ? (
              <img
                src={client.imagePath}
                alt={`${client.firstName} ${client.lastName}`}
                className="w-24 h-24 object-cover rounded-full shadow-md"
              />
            ) : (
              <div className="w-24 h-24 flex items-center justify-center bg-gray-200 rounded-full text-xl font-semibold">
                {`${client.firstName[0]}${client.lastName[0]}`}
              </div>
            )}
            <h3 className="text-lg font-semibold">{`${client.firstName} ${client.lastName}`}</h3>
            <p className="text-gray-500">
              {`${client.address?.city || "City"}, ${client.address?.country || "Country"}`}
            </p>
            <Button
              type="primary"
              icon={<InfoCircleOutlined />}
              onClick={() => openClientModal(client)}
            >
              View Details
            </Button>
          </Card>
        ))}
      </div>


      {/* Client Details Modal */}
      <Modal
        title={<h2 className="text-lg font-semibold text-center">{selectedClient ? `${selectedClient.firstName} ${selectedClient.lastName}` : "Client Details"}</h2>}
        open={isClientModalOpen}
        onCancel={() => setIsClientModalOpen(false)}
        footer={null}
        centered
        width={350}
      >
        {selectedClient && (
          <div className="flex flex-col items-center text-center p-4">
            {selectedClient.imagePath ? (
              <img src={selectedClient.imagePath} alt={`${selectedClient.firstName} ${selectedClient.lastName}`} className="w-24 h-24 object-cover rounded-full shadow-md" />
            ) : (
              <div className="w-24 h-24 flex items-center justify-center bg-gray-200 rounded-full text-3xl font-semibold shadow-md">
                {`${selectedClient.firstName[0]}${selectedClient.lastName[0]}`}
              </div>
            )}
            <div className="mt-4 w-full space-y-2">
              <p className="text-gray-600 text-sm">
                <strong>📍 Location:</strong> {`${selectedClient.address.city}, ${selectedClient.address.state}, ${selectedClient.address.country}`}
              </p>
              <p className="text-gray-600 text-sm"><strong>📧 Email:</strong> {selectedClient.email}</p>
              {selectedClient.registrationDate && (
                <p className="text-gray-600 text-sm">
                  <strong>📅 Registered:</strong> {new Date(selectedClient.registrationDate).toLocaleDateString()}
                </p>
              )}
            </div>
            <Button
              type="link"
              className="mt-4 text-blue-600 hover:underline text-sm"
              onClick={() =>
                navigate("/dashboard/add-client", {
                  state: { customerId: selectedClient._id },
                })
              }
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
          <Form.Item label="Email" name="email" rules={[{ type: "email", message: "Enter a valid email" }]}>
            <Input placeholder="Enter email" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Clients;
