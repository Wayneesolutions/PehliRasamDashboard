import React, { useEffect, useState, ReactElement } from "react";
import {
  getActivityLogs,
  getCustomerActivityLogs,
} from "../../config/apiClient";
import { FaRegEdit } from "react-icons/fa";
import { IoInformationCircleOutline, IoMailOutline } from "react-icons/io5";
import { HiOutlineUserAdd } from "react-icons/hi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import moment from "moment";

type TimelineEvent = {
  time: string;
  text: string;
  link: string;
  icon: ReactElement;
  date: string;
  isIntroAction?: boolean;
  customerId?: string;
};

type ChartDataItem = {
  date: string;
  value: number;
};

const TimelineMain: React.FC = () => {
  const [timelineData, setTimelineData] = useState<TimelineEvent[]>([]);
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = timelineData.slice(startIndex, endIndex);
  const totalPages = Math.ceil(timelineData.length / itemsPerPage);

  // Function to extract customer ID from changeSummary URL
  const extractCustomerIdFromUrl = (changeSummary: string): string | null => {
    const urlMatch = changeSummary.match(/\/client\/(\d+)/);
    return urlMatch ? urlMatch[1] : null;
  };

  const fetchTimelineLogs = async () => {
    setLoading(true);
    try {
      const result = await getActivityLogs({ customer: "all" });

      const sortedLogs = result.data.sort(
        (a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      const formatted: TimelineEvent[] = sortedLogs.map((log: any) => {
        const actionLower = log.action.toLowerCase();
        const isIntroAction = actionLower.includes("intro");
        const isEmailAction = actionLower.includes("mail") || actionLower.includes("email") || log.changeSummary.toLowerCase().includes("→");
        const isUpdateAction = actionLower.includes("update") || actionLower.includes("changed");
        const customerId = isIntroAction ? extractCustomerIdFromUrl(log.changeSummary) : null;
        
        // Determine icon based on action type with specific color codes
        let icon;
        if (isIntroAction) {
          icon = <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F5803E' }}>
            <HiOutlineUserAdd className="text-white text-sm" />
          </div>;
        } else if (isEmailAction) {
          icon = <IoMailOutline className="text-xl" style={{ color: '#2C7BE5' }} />;
        } else if (isUpdateAction) {
          icon = <FaRegEdit className="text-xl" style={{ color: '#E63757' }} />;
        } else {
          icon = <IoInformationCircleOutline className="text-xl" style={{ color: '#27C2FE' }} />;
        }
        
        return {
          time: moment(log.createdAt).format("hh:mm A"),
          text: log.changeSummary,
          link: `${log.customerData?.firstName || "Unknown"} ${log.customerData?.lastName || ""}`,
          icon,
          date: moment(log.createdAt).format("YYYY-MM-DD"),
          isIntroAction,
          customerId,
        };
      });

      setTimelineData(formatted);

    } catch (err) {
      console.error("Error loading activity logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartLogs = async () => {
    try {
      const chartResponse = await getCustomerActivityLogs({ customer: "all" });

      const chartReady: ChartDataItem[] = chartResponse.data.map(
        (item: any) => ({
          date: moment(item.date).format("D MMM"),
          value: item.count,
        })
      );

      setChartData(chartReady);
    } catch (err) {
      console.error("Error loading chart data:", err);
    }
  };

  useEffect(() => {
    fetchTimelineLogs();
    fetchChartLogs();
  }, []);

  // Function to render the timeline event text with clickable link for intro actions
  const renderEventText = (event: TimelineEvent) => {
    if (event.isIntroAction && event.customerId) {
      const paddedId = event.customerId.padStart(5, '0');
      const token = localStorage.getItem('token');
      const fullUrl = token
        ? `${window.location.origin}/dashboard/client-intro/${paddedId}#token=${encodeURIComponent(token)}`
        : `${window.location.origin}/dashboard/client-intro/${paddedId}`;
      
      // Extract intro details from changeSummary
      const introMatch = event.text.match(/sent Intro #(\d+) of (.+?) to (.+)/i);
      const introNumber = introMatch ? introMatch[1] : paddedId;
      const introName = introMatch ? introMatch[2] : event.link.trim();
      const email = introMatch ? introMatch[3] : '';
      
      return (
        <div className="text-sm" style={{ color: '#333333' }}>
          <p className="mb-1">
            <span className="font-medium" style={{ color: '#2C7BE5' }}>Pehli Rasam.com</span> sent Intro #{introNumber} of{" "}
            <a 
              href={fullUrl}
              className="font-medium hover:underline cursor-pointer"
              style={{ color: '#2C7BE5' }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(fullUrl, '_blank', 'noopener,noreferrer');
              }}
            >
              {introName}
            </a>
            {email && ` to ${email}`}
          </p>
        </div>
      );
    } else if (event.text.includes("→") || event.text.toLowerCase().includes("mail")) {
      // Email action
      const emailMatch = event.text.match(/→\s*<(.+?)>/);
      const email = emailMatch ? emailMatch[1] : '';
      const subjectMatch = event.text.match(/Suitable match/);
      
      return (
        <div className="text-sm" style={{ color: '#333333' }}>
          <p className="mb-1">
            <span className="font-medium" style={{ color: '#2C7BE5' }}>Pehli Rasam.com</span> → {email && <span style={{ color: '#2C7BE5' }}>{`<${email}>`}</span>}
          </p>
          {subjectMatch && (
            <p className="text-xs mt-1" style={{ color: '#666666' }}>
              Pehli Rasam : Suitable match ...
            </p>
          )}
        </div>
      );
    } else {
      // Regular update/edit action
      return (
        <p className="text-sm leading-relaxed" style={{ color: '#333333' }}>
          <span className="font-medium" style={{ color: '#2C7BE5' }}>Pehli Rasam.com</span> {event.text}
        </p>
      );
    }
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-xl font-semibold">Timeline</h2>
      </div>

      {/* Graph */}
      <div className="w-full h-48 mt-4 mb-9 bg-gray-50 p-4 rounded-lg shadow-md">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
            <XAxis dataKey="date" stroke="#666" tick={{ fontSize: 12 }} />
            <YAxis stroke="#666" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                borderRadius: "8px",
                border: "1px solid #ddd",
              }}
            />
            <Bar
              dataKey="value"
              fill="#007BFF"
              radius={[6, 6, 0, 0]}
              barSize={30}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {!loading ? (
        Object.entries(
          paginatedData.reduce((acc, log) => {
            if (!acc[log.date]) acc[log.date] = [];
            acc[log.date].push(log);
            return acc;
          }, {} as Record<string, TimelineEvent[]>)
        ).map(([date, logs]) => (
          <div key={date} className="mb-6">
            {/* Date Header - Prominent with color */}
            <div className="mb-4 pb-2 border-b border-gray-200">
              <h3 className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>
                {moment(date).format("MMMM D YYYY")}
              </h3>
            </div>
            
            {/* Timeline Events */}
            <div className="space-y-3">
              {logs.map((event, index) => (
                <div key={index} className="flex items-start gap-4 py-2 hover:bg-gray-50 rounded-md px-2 -mx-2 transition-colors">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {event.icon}
                  </div>
                  
                  {/* Event Text */}
                  <div className="flex-1 min-w-0">
                    {renderEventText(event)}
                  </div>
                  
                  {/* Time */}
                  <div className="flex-shrink-0">
                    <span className="text-sm font-medium whitespace-nowrap" style={{ color: '#666666' }}>
                      {event.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <p className="text-sm text-gray-500 mt-4">Loading activity logs...</p>
      )}

      <div className="mt-6 flex justify-center items-center gap-2">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Prev
        </button>
        <span className="text-sm text-gray-700">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default TimelineMain;