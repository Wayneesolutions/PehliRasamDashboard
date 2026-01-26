import { useEffect, useState } from "react";
import { Modal } from "antd";
import { recentlySubmittedClients } from "../../config/apiClient";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

interface Client {
  name: string;
  location: string;
  time: string;
  initials: string;
  avatar?: string;
  createdAt?: string;
}
const bgColors = [
  "bg-amber-300",     // soft gold
  "bg-rose-300",      // elegant rose
  "bg-sky-300",       // light blue
  "bg-emerald-300",   // fresh green
  "bg-violet-300",    // modern purple
  "bg-orange-300",    // warm orange
  "bg-indigo-300",    // deep blue
  "bg-teal-300",      // minty teal
];


const RecentlySubmittedClients = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await recentlySubmittedClients();
        if (res.success && Array.isArray(res.data)) {
          // Sort by createdAt in descending order (newest first) before formatting
          const sortedData = [...res.data].sort((a: any, b: any) => {
            const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
            const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
            return dateB - dateA; // Descending order (newest first)
          });

          const formattedClients: Client[] = sortedData.map((item: any) => {
            const fullName = [item.firstName, item.middelName, item.lastName].filter(Boolean).join(" ");
            const location = item.address?.city || "Not specified";
            const time = dayjs(item.createdAt || item.created_at).fromNow(true); // e.g. "3 days ago" -> "3 days"
            const initials = fullName
              .split(" ")
              .map((part: string) => part.charAt(0))
              .join("")
              .slice(0, 2)
              .toUpperCase();
            return {
              name: fullName,
              location,
              time,
              initials,
              avatar: item.imagePath || undefined,
              createdAt: item.createdAt || item.created_at, // Keep original date for sorting
            };
          });
          setClients(formattedClients);
        }
      } catch (error) {
        console.error("Error fetching clients", error);
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Recently Submitted Clients</h2>
        <a href="#" className="text-blue-500 text-sm">View All &gt;</a>
      </div>
      <div className="grid grid-cols-2 gap-4 overflow-y-auto max-h-72">
        {clients.map((client, index) => (
          <div key={index} className="flex items-center gap-4">
            {client.avatar ? (
              <img src={client.avatar} alt={client.name} className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className={`w-12 h-12 flex items-center justify-center rounded-full text-white text-lg font-bold shadow-md ${bgColors[index % bgColors.length]}`}>
                {client.initials}
              </div>
            )}

            <div>
              <p className="text-md font-medium">
                {client.name}
                <button className="ml-1 text-gray-500" onClick={() => showModal(client)}>ℹ</button>
              </p>
              <p className="text-xs text-gray-500">{client.location}</p>
              <p className="text-xs text-gray-400">{client.time} ago</p>
            </div>
          </div>
        ))}
      </div>

      <Modal title="Client Information" open={isModalVisible} onCancel={handleCancel} footer={null}>
        {selectedClient && (
          <div>
            <p><strong>Name:</strong> {selectedClient.name}</p>
            <p><strong>Location:</strong> {selectedClient.location}</p>
            <p><strong>Submitted:</strong> {selectedClient.time} ago</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RecentlySubmittedClients;
