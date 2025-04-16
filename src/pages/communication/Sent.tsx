import { useEffect, useState } from "react";
import { mailLogs } from "../../config/apiClient";

interface Email {
  to: string;
  customerName: string;
  from: string;
  subject: string;
  body: string;
  time: string;
  status: string;
}

const Sent = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEmails = async (search?: string) => {
    setLoading(true);
    const response = await mailLogs(search ? { search } : undefined);
    setEmails(response?.logs || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchEmails(); // fetch all emails initially
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchEmails(searchTerm);
    }, 500); // debounce
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">Sent Emails</h2>

      {/* Search Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center w-full border rounded-md overflow-hidden">
          <input
            type="text"
            placeholder="Type to Search"
            className="w-full p-2 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="px-4 py-2 bg-gray-200 hover:bg-gray-300">Advanced Search</button>
        </div>
      </div>

      {/* Emails List */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="text-center text-gray-500 p-4">Loading...</div>
        ) : (
          <table className="w-full border rounded-lg overflow-hidden">
            <tbody>
              {emails.length > 0 ? (
                emails.map((email, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="p-3 flex items-center">
                      <span className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-white font-semibold">
                        {email.from?.[0] || "?"}

                      </span>
                      <span className="ml-2 text-gray-800">
                        {email.from} ➝ <span className="text-blue-600">{email.customerName || email.to}</span>
                      </span>
                    </td>
                    <td className="p-3 text-gray-600">{email.subject}</td>
                    <td className="p-3 text-gray-500 truncate">{email.body}</td>
                    <td className="p-3 text-gray-500 text-right">
                      {new Date(email.time).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-500">
                    No emails found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Sent;
