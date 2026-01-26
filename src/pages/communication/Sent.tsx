import { useEffect, useState } from "react";
import { mailLogs } from "../../config/apiClient";
import { Input, Spin } from "antd";

interface Email {
  to: string;
  customerName: string;
  from: string;
  subject: string;
  body: string;
  time: string;
  status: string;
}

function decodeHTMLEntities(html: string) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

const Sent = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);

  const fetchEmails = async (search?: string) => {
    setLoading(true);
    try {
      const response = await mailLogs(search ? { search } : undefined);
      setEmails(response?.logs || []);
    } catch (error) {
      console.error("Error fetching emails:", error);
      setEmails([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails(); // fetch all emails initially
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchTerm !== undefined) {
        fetchEmails(searchTerm);
      }
    }, 500); // debounce
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  return (
    <div className="p-6 bg-white">
      <h2 className="text-2xl font-semibold mb-6 text-gray-900">Sent Emails</h2>

      {/* Search Bar */}
      <div className="flex items-center gap-3 mb-6">
        <Input
          type="text"
          placeholder="Type to Search"
          className="flex-1"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          allowClear
        />
        <button 
          onClick={() => setIsAdvancedSearchOpen(!isAdvancedSearchOpen)}
          className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors border border-gray-300"
        >
          Advanced Search
        </button>
      </div>

      {/* Advanced Search (if needed in future) */}
      {isAdvancedSearchOpen && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">Advanced search options coming soon...</p>
        </div>
      )}

      {/* Emails List */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Spin size="large" />
            <p className="mt-4 text-gray-500">Loading emails...</p>
          </div>
        ) : (
          <div className="space-y-0 border border-gray-200 rounded-lg overflow-hidden">
            {emails.length > 0 ? (
              emails.map((email, idx) => (
                <div 
                  key={idx} 
                  className="border-b border-gray-200 hover:bg-gray-50 transition-colors last:border-b-0"
                >
                  <div className="p-4 grid grid-cols-12 gap-4 items-start">
                    {/* Avatar and From/To */}
                    <div className="col-span-12 md:col-span-3 flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-semibold flex-shrink-0">
                        {email.from?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-gray-800 truncate">
                          {email.from}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          ➝ {email.customerName || email.to}
                        </div>
                      </div>
                    </div>

                    {/* Subject */}
                    <div className="col-span-12 md:col-span-3">
                      <div className="text-sm font-medium text-gray-900 line-clamp-2">
                        {email.subject || "No subject"}
                      </div>
                    </div>

                    {/* Body Preview */}
                    <div className="col-span-12 md:col-span-4">
                      <div
                        className="text-sm text-gray-600 line-clamp-3"
                        dangerouslySetInnerHTML={{ __html: decodeHTMLEntities(email.body) }}
                      />
                    </div>

                    {/* Date */}
                    <div className="col-span-12 md:col-span-2 text-right">
                      <div className="text-sm text-gray-500">
                        {new Date(email.time).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-gray-500">
                <p className="text-base">No emails found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sent;
