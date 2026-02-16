import { useEffect, useState } from "react";
import { mailLogs, type MailLogsResponse } from "../../config/apiClient";
import { Input, Spin, Pagination, Empty } from "antd";

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
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });

  const fetchEmails = async (page = 1, pageSize = 20, search?: string) => {
    setLoading(true);
    try {
      const response: MailLogsResponse = await mailLogs({ 
        search: search || undefined,
        page,
        limit: pageSize
      });
      setEmails(response?.logs || []);
      
      if (response?.pagination) {
        setPagination({
          current: response.pagination.page,
          pageSize: response.pagination.limit,
          total: response.pagination.total
        });
      } else {
        // Fallback for old API response
        setPagination(prev => ({
          ...prev,
          current: page,
          pageSize: pageSize,
          total: response?.count || 0
        }));
      }
    } catch (error) {
      console.error("Error fetching emails:", error);
      setEmails([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails(1, pagination.pageSize); // fetch emails initially
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchTerm !== undefined) {
        fetchEmails(1, pagination.pageSize, searchTerm);
      }
    }, 500); // debounce
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  // Handle pagination change
  const handlePaginationChange = (page: number, pageSize: number) => {
    fetchEmails(page, pageSize, searchTerm);
  };

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
        <Spin spinning={loading}>
          {emails.length > 0 ? (
            <>
              <div className="space-y-0 border border-gray-200 rounded-lg overflow-hidden">
                {emails.map((email, idx) => (
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
                ))}
              </div>
              
              {/* Pagination */}
              <div className="mt-6 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Showing {((pagination.current - 1) * pagination.pageSize) + 1} to{' '}
                  {Math.min(pagination.current * pagination.pageSize, pagination.total)} of{' '}
                  {pagination.total} emails
                </div>
                <Pagination
                  current={pagination.current}
                  pageSize={pagination.pageSize}
                  total={pagination.total}
                  onChange={handlePaginationChange}
                  onShowSizeChange={handlePaginationChange}
                  showSizeChanger
                  showQuickJumper
                  showTotal={(total, range) => `${range[0]}-${range[1]} of ${total}`}
                  pageSizeOptions={['10', '20', '50', '100']}
                />
              </div>
            </>
          ) : (
            !loading && (
              <Empty
                description={
                  <div>
                    <p className="text-lg font-medium text-gray-500">No emails found</p>
                    <p className="text-sm text-gray-400 mt-2">
                      {searchTerm ? 'Try a different search term' : 'No sent emails yet'}
                    </p>
                  </div>
                }
              />
            )
          )}
        </Spin>
      </div>
    </div>
  );
};

export default Sent;
