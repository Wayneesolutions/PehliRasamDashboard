import { useState } from "react";

interface Client {
  name: string;
  status: string;
  sentDate: string;
  viewed: string;
  expiration: string;
}

const initialClients: Client[] = [
  { name: "Elite", status: "Sent", sentDate: "28 Feb 2025", viewed: "No", expiration: "30 Mar 2025" },
  { name: "John", status: "Sent", sentDate: "27 Feb 2025", viewed: "Yes", expiration: "29 Mar 2025" },
  { name: "Dev", status: "Opened", sentDate: "27 Feb 2025", viewed: "Yes", expiration: "28 Mar 2025" },
  { name: "GS", status: "Updated", sentDate: "26 Feb 2025", viewed: "No", expiration: "27 Mar 2025" },
  { name: "SK", status: "Completed", sentDate: "26 Feb 2025", viewed: "Yes", expiration: "26 Mar 2025" },
];

const ProfileUpdate = () => {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  const handleDelete = (name: string) => {
    setClients(clients.filter(client => client.name !== name));
  };

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedStatus ? client.status === selectedStatus : true)
  );

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">Profile Updates</h2>

      {/* Search & Filter Section */}
      <div className="flex items-center gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by name"
          className="w-full p-2 border rounded-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="p-2 border rounded-md"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="Sent">Sent</option>
          <option value="Opened">Opened</option>
          <option value="Updated">Updated</option>
          <option value="Completed">Completed</option>
          <option value="Expired">Expired</option>
        </select>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto">
        <table className="w-full border rounded-lg overflow-hidden shadow-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Client</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Sent Date</th>
              <th className="p-3 text-left">Viewed</th>
              <th className="p-3 text-left">Expiration</th>
              <th className="p-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length > 0 ? (
              filteredClients.map((client, index) => (
                <tr key={index} className="border-t hover:bg-gray-50">
                  <td className="p-3">{client.name}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-md text-sm font-medium ${client.status === "Sent"
                        ? "bg-blue-100 text-blue-600"
                        : client.status === "Opened"
                          ? "bg-yellow-100 text-yellow-600"
                          : client.status === "Updated"
                            ? "bg-green-100 text-green-600"
                            : client.status === "Completed"
                              ? "bg-gray-100 text-gray-600"
                              : "bg-red-100 text-red-600"
                        }`}
                    >
                      {client.status}
                    </span>
                  </td>
                  <td className="p-3">{client.sentDate}</td>
                  <td className="p-3">{client.viewed}</td>
                  <td className="p-3">{client.expiration}</td>
                  <td className="p-3">
                    <button
                      className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                      onClick={() => handleDelete(client.name)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-3 text-center text-gray-500">
                  No results found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProfileUpdate;