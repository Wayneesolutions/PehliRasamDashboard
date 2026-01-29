import { useState, useEffect } from "react";
import { 
  Table, 
  Tag, 
  Input, 
  Select, 
  Button, 
  Modal, 
  message, 
  Spin, 
  Badge, 
  Tooltip,
  Popconfirm,
  Avatar,
  Empty
} from "antd";
import { 
  FaInbox, 
  FaEnvelope, 
  FaEnvelopeOpen, 
  FaStar, 
  FaRegStar, 
  FaTrash,
  FaUser,
  FaCalendarAlt,
  FaReply
} from "react-icons/fa";
import { SearchOutlined, ReloadOutlined, FilterOutlined } from '@ant-design/icons';
import { 
  getInboxMessages, 
  getInboxMessage,
  markMessageAsRead,
  markMessageAsUnread,
  deleteInboxMessage,
  toggleStarMessage,
  type InboxMessage as InboxMessageType 
} from "../../config/apiClient";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { Search } = Input;
const { Option } = Select;

const Inbox = () => {
  const [messages, setMessages] = useState<InboxMessageType[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<InboxMessageType | null>(null);
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  
  // Filters
  const [filterStatus, setFilterStatus] = useState<'all' | 'read' | 'unread'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch messages
  const fetchMessages = async (page = 1, isRead?: boolean, search?: string) => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: pagination.pageSize
      };

      if (isRead !== undefined) {
        params.isRead = isRead;
      }

      if (search) {
        params.search = search;
      }

      const res = await getInboxMessages(params);
      
      if (res?.success && res?.data) {
        setMessages(res.data.messages);
        setUnreadCount(res.data.unreadCount);
        setPagination({
          current: res.data.pagination.page,
          pageSize: res.data.pagination.limit,
          total: res.data.pagination.total
        });
      } else {
        message.error(res?.message || 'Failed to fetch inbox messages');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      message.error('Failed to fetch inbox messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  // Handle filter change
  const handleFilterChange = (value: 'all' | 'read' | 'unread') => {
    setFilterStatus(value);
    const isRead = value === 'read' ? true : value === 'unread' ? false : undefined;
    fetchMessages(1, isRead, searchTerm);
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    const isRead = filterStatus === 'read' ? true : filterStatus === 'unread' ? false : undefined;
    fetchMessages(1, isRead, value);
  };

  // Handle pagination change
  const handleTableChange = (newPagination: any) => {
    const isRead = filterStatus === 'read' ? true : filterStatus === 'unread' ? false : undefined;
    fetchMessages(newPagination.current, isRead, searchTerm);
  };

  // View message details
  const handleViewMessage = async (messageId: string) => {
    try {
      const res = await getInboxMessage(messageId);
      if (res?.success && res?.data) {
        setSelectedMessage(res.data);
        setMessageModalVisible(true);
        
        // Mark as read if unread
        if (!res.data.isRead) {
          await markMessageAsRead(messageId);
          fetchMessages(pagination.current, 
            filterStatus === 'read' ? true : filterStatus === 'unread' ? false : undefined, 
            searchTerm
          );
        }
      } else {
        message.error('Failed to load message');
      }
    } catch (error) {
      console.error('Error loading message:', error);
      message.error('Failed to load message');
    }
  };

  // Toggle read status
  const handleToggleRead = async (messageId: string, isRead: boolean) => {
    try {
      const res = isRead 
        ? await markMessageAsUnread(messageId)
        : await markMessageAsRead(messageId);
      
      if (res?.success) {
        message.success(isRead ? 'Marked as unread' : 'Marked as read');
        fetchMessages(pagination.current, 
          filterStatus === 'read' ? true : filterStatus === 'unread' ? false : undefined, 
          searchTerm
        );
      }
    } catch (error) {
      message.error('Failed to update message status');
    }
  };

  // Toggle star
  const handleToggleStar = async (messageId: string) => {
    try {
      const res = await toggleStarMessage(messageId);
      if (res?.success) {
        message.success(res.message);
        fetchMessages(pagination.current, 
          filterStatus === 'read' ? true : filterStatus === 'unread' ? false : undefined, 
          searchTerm
        );
      }
    } catch (error) {
      message.error('Failed to update star status');
    }
  };

  // Delete message
  const handleDeleteMessage = async (messageId: string) => {
    try {
      const res = await deleteInboxMessage(messageId);
      if (res?.success) {
        message.success('Message deleted successfully');
        fetchMessages(pagination.current, 
          filterStatus === 'read' ? true : filterStatus === 'unread' ? false : undefined, 
          searchTerm
        );
      } else {
        message.error('Failed to delete message');
      }
    } catch (error) {
      message.error('Failed to delete message');
    }
  };

  // Strip HTML tags for preview
  const stripHtml = (html: string) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Table columns
  const columns = [
    {
      title: '',
      key: 'star',
      width: 50,
      fixed: 'left' as const,
      render: (_: any, record: InboxMessageType) => (
        <div className="flex items-center justify-center">
          <Button
            type="text"
            size="small"
            icon={record.isStarred ? <FaStar className="text-yellow-500" /> : <FaRegStar className="text-gray-400" />}
            onClick={(e) => {
              e.stopPropagation();
              handleToggleStar(record._id);
            }}
            className="flex items-center justify-center"
          />
        </div>
      ),
    },
    {
      title: '',
      key: 'read',
      width: 50,
      fixed: 'left' as const,
      render: (_: any, record: InboxMessageType) => (
        <div className="flex items-center justify-center">
          <Button
            type="text"
            size="small"
            icon={record.isRead ? <FaEnvelopeOpen className="text-gray-400" /> : <FaEnvelope className="text-blue-600" />}
            onClick={(e) => {
              e.stopPropagation();
              handleToggleRead(record._id, record.isRead);
            }}
            className="flex items-center justify-center"
          />
        </div>
      ),
    },
    {
      title: 'From',
      dataIndex: 'from',
      key: 'from',
      width: 250,
      render: (_: any, record: InboxMessageType) => (
        <div className="flex items-center gap-2">
          {record.customerId ? (
            <>
              {record.customerId.profileImage ? (
                <Avatar src={record.customerId.profileImage} size="small" />
              ) : (
                <Avatar icon={<FaUser />} size="small" className="bg-blue-500" />
              )}
              <div>
                <div className="font-medium">
                  {record.customerId.firstName} {record.customerId.lastName}
                </div>
                <div className="text-xs text-gray-500">{record.from}</div>
              </div>
            </>
          ) : (
            <>
              <Avatar icon={<FaUser />} size="small" className="bg-gray-400" />
              <div>
                <div className="font-medium">{record.fromName || record.from}</div>
                {record.fromName && <div className="text-xs text-gray-500">{record.from}</div>}
              </div>
            </>
          )}
        </div>
      ),
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
      render: (_: any, record: InboxMessageType) => (
        <div>
          <div className={`${!record.isRead ? 'font-semibold' : 'font-normal'}`}>
            {record.subject || '(No Subject)'}
            {record.hasAutoReplied && (
              <Tag color="green" className="ml-2" icon={<FaReply />}>
                Auto-replied
              </Tag>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1 truncate max-w-md">
            {stripHtml(record.textBody || record.body).slice(0, 100)}...
          </div>
        </div>
      ),
    },
    {
      title: 'Received',
      dataIndex: 'receivedAt',
      key: 'receivedAt',
      width: 150,
      render: (receivedAt: string) => (
        <Tooltip title={dayjs(receivedAt).format('MMMM D, YYYY h:mm A')}>
          <span className="text-sm text-gray-600">
            {dayjs(receivedAt).fromNow()}
          </span>
        </Tooltip>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      fixed: 'right' as const,
      render: (_: any, record: InboxMessageType) => (
        <div className="flex items-center justify-center">
          <Popconfirm
            title="Are you sure you want to delete this message?"
            onConfirm={(e) => {
              e?.stopPropagation();
              handleDeleteMessage(record._id);
            }}
            okText="Yes"
            cancelText="No"
            onCancel={(e) => e?.stopPropagation()}
          >
            <Button
              type="text"
              danger
              size="small"
              icon={<FaTrash />}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center"
            />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="p-8 bg-white shadow-lg rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FaInbox className="text-3xl text-blue-600" />
          <h2 className="text-3xl font-bold text-gray-800">Inbox</h2>
          <Badge count={unreadCount} className="mt-1" />
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => fetchMessages(pagination.current, 
            filterStatus === 'read' ? true : filterStatus === 'unread' ? false : undefined, 
            searchTerm
          )}
        >
          Refresh
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex gap-4 mb-6">
        <Search
          placeholder="Search emails by subject, sender, or content..."
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          onSearch={handleSearch}
          onChange={(e) => !e.target.value && handleSearch('')}
          className="flex-1"
        />
        <Select
          value={filterStatus}
          onChange={handleFilterChange}
          size="large"
          style={{ width: 150 }}
          suffixIcon={<FilterOutlined />}
        >
          <Option value="all">All Messages</Option>
          <Option value="unread">Unread</Option>
          <Option value="read">Read</Option>
        </Select>
      </div>

      {/* Table */}
      <Spin spinning={loading}>
        <div className="overflow-x-auto">
          <Table
            columns={columns}
            dataSource={messages}
            rowKey="_id"
            pagination={pagination}
            onChange={handleTableChange}
            scroll={{ x: 'max-content' }}
            onRow={(record) => ({
              onClick: () => handleViewMessage(record._id),
              className: 'cursor-pointer hover:bg-gray-50',
            })}
            locale={{
              emptyText: (
                <Empty
                  image={<FaInbox className="text-6xl text-gray-300 mx-auto mb-4" />}
                  description={
                    <div>
                      <p className="text-xl font-medium text-gray-500">No emails here</p>
                      <p className="text-sm text-gray-400">
                        {filterStatus === 'unread' ? 'No unread messages' :
                         filterStatus === 'read' ? 'No read messages' :
                         'Your inbox is currently empty'}
                      </p>
                    </div>
                  }
                />
              ),
            }}
          />
        </div>
      </Spin>

      {/* Message Detail Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <FaEnvelope className="text-blue-600" />
            <span>{selectedMessage?.subject || '(No Subject)'}</span>
          </div>
        }
        open={messageModalVisible}
        onCancel={() => {
          setMessageModalVisible(false);
          setSelectedMessage(null);
        }}
        width={800}
        footer={[
          <Button key="close" onClick={() => {
            setMessageModalVisible(false);
            setSelectedMessage(null);
          }}>
            Close
          </Button>,
        ]}
      >
        {selectedMessage && (
          <div className="space-y-4">
            {/* From */}
            <div className="flex items-start gap-2 border-b pb-3">
              <FaUser className="text-gray-500 mt-1" />
              <div className="flex-1">
                <div className="text-sm text-gray-500">From:</div>
                <div className="font-medium">
                  {selectedMessage.fromName || selectedMessage.from}
                </div>
                <div className="text-sm text-gray-600">{selectedMessage.from}</div>
                {selectedMessage.customerId && (
                  <Tag color="blue" className="mt-1">
                    Customer: {selectedMessage.customerId.firstName} {selectedMessage.customerId.lastName}
                  </Tag>
                )}
              </div>
            </div>

            {/* Date */}
            <div className="flex items-start gap-2 border-b pb-3">
              <FaCalendarAlt className="text-gray-500 mt-1" />
              <div className="flex-1">
                <div className="text-sm text-gray-500">Received:</div>
                <div className="font-medium">
                  {dayjs(selectedMessage.receivedAt).format('MMMM D, YYYY h:mm A')}
                </div>
                <div className="text-sm text-gray-600">
                  {dayjs(selectedMessage.receivedAt).fromNow()}
                </div>
              </div>
            </div>

            {/* Auto-reply status */}
            {selectedMessage.hasAutoReplied && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-green-700">
                  <FaReply />
                  <span className="font-medium">Auto-reply sent</span>
                </div>
                {selectedMessage.autoRepliedAt && (
                  <div className="text-sm text-green-600 mt-1">
                    Sent: {dayjs(selectedMessage.autoRepliedAt).format('MMMM D, YYYY h:mm A')}
                  </div>
                )}
              </div>
            )}

            {/* Attachments */}
            {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
              <div className="border-b pb-3">
                <div className="text-sm text-gray-500 mb-2">Attachments:</div>
                <div className="flex flex-wrap gap-2">
                  {selectedMessage.attachments.map((att, idx) => (
                    <Tag key={idx}>
                      {att.fileName} ({(att.fileSize / 1024).toFixed(2)} KB)
                    </Tag>
                  ))}
                </div>
              </div>
            )}

            {/* Body */}
            <div>
              <div className="text-sm text-gray-500 mb-2">Message:</div>
              <div 
                className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: selectedMessage.body || selectedMessage.textBody }}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Inbox;
