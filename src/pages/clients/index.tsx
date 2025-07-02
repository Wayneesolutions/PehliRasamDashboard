import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Button, Modal, Form } from "antd";
import { SearchOutlined, UserAddOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { addCustomerByAdmin, allActiveCustomer } from "../../config/apiClient";
import { ActiveClientDetails } from "../../schema/customernew";


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

      const newClient = res.data;

      // ✅ Prepend new client to activeclients list
      setActiveClients((prevClients) => [newClient, ...prevClients]);

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


  useEffect(() => {
    const fetchingCustomers = async () => {
      const res = await allActiveCustomer();
      if (res.success) {
        const sorted = [...res.data].sort((a, b) => {
          return new Date(parseInt(b._id.substring(0, 8), 16) * 1000).getTime() -
            new Date(parseInt(a._id.substring(0, 8), 16) * 1000).getTime();
        });
        setActiveClients(sorted);
      } else {
        setActiveClients([]);
      }
    };
    fetchingCustomers();
  }, []);




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




      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 mt-8">
        {filteredClients.map((client, index) => {
          const initials = `${client.firstName[0]}${client.lastName[0]}`;
          const bgColor = bgColors[index % bgColors.length]; // cycle through colors

          return (
            <div key={client._id} className="flex flex-col items-center text-center group relative">
              {client.imagePath ? (
                <img
                  src={client.imagePath}
                  alt={`${client.firstName} ${client.lastName}`}
                  className="w-24 h-36 object-cover rounded-md shadow-md"
                />
              ) : (
                <div className={`w-24 h-36 flex items-center justify-center ${bgColor} rounded-md text-3xl font-bold text-white shadow-md`}>
                  {initials}
                </div>
              )}

              <h3 className="!mt-3 text-sm font-semibold text-blue-600 truncate w-full">
                {`${client.firstName} ${client.lastName}`}
              </h3>



              {/* Info Icon (hover) */}
              <div className="absolute bottom-2 right-6  transition">
                <button
                  onClick={() => openClientModal(client)}
                  className="!text-gray-500 hover:text-blue-500"
                >
                  <InfoCircleOutlined />
                </button>
              </div>
            </div>
          );
        })}
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
