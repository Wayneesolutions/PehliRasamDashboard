import React, { useEffect, useState } from "react";
import { Modal } from "antd";
import { recentlySubmittedClients } from "../../config/apiClient";

interface Client {
  name: string;
  avatar: string;
  initials: string;
  email?: string;
  phone?: string;
}

const RecentlyViewedClients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await recentlySubmittedClients();
        const data = response.data || [];

        const formattedClients = data.map((client: any): Client => {
          const fullName = `${client.firstName || ""} ${client.lastName || ""}`.trim();
          const initials = `${(client.firstName?.[0] || "").toUpperCase()}${(client.lastName?.[0] || "").toUpperCase()}`;
          return {
            name: fullName,
            avatar: client.imagePath ?? "",
            initials: initials || "NA",
            email: client.email,
            phone: client.Number?.toString() || undefined,
          };
        });

        setClients(formattedClients);
      } catch (err) {
        console.error("Failed to fetch clients", err);
      }
    };

    fetchClients();
  }, []);

  const showModal = (client: Client) => {
    setSelectedClient(client);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedClient(null);
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-md w-full">
      <h2 className="text-xl font-semibold mb-4">Recently Submitted Clients</h2>
      <div className="flex gap-6 overflow-x-auto items-center scrollbar-hide p-4 w-full">
        {clients.map((client, index) => (
          <div key={index} className="flex flex-col items-center relative min-w-[80px]">
            {client.avatar ? (
              <img
                src={client.avatar}
                alt={client.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
              />
            ) : (
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gray-900 text-white text-2xl font-bold">
                {client.initials}
              </div>
            )}
            <p className="text-md text-gray-700 mt-2 truncate w-20 text-center font-medium">{client.name}</p>
            <button
              className="absolute -bottom-2 right-0 bg-gray-300 text-gray-700 text-sm px-2 py-1 rounded-full cursor-pointer shadow-md"
              onClick={() => showModal(client)}
            >
              ℹ
            </button>
          </div>
        ))}
      </div>

      <Modal title="Client Information" open={isModalVisible} onCancel={handleCancel} footer={null} width={500}>
        {selectedClient && (
          <div className="p-4">
            <p className="text-lg font-semibold">{selectedClient.name}</p>
            {selectedClient.email && (
              <p className="text-md text-gray-600">
                <strong>Email:</strong> {selectedClient.email}
              </p>
            )}
            {selectedClient.phone && (
              <p className="text-md text-gray-600">
                <strong>Phone:</strong> {selectedClient.phone}
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RecentlyViewedClients;
