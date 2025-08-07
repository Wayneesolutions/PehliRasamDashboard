import React, { useEffect, useState, ReactElement } from "react";
import {
  getActivityLogs,
  getCustomerActivityLogs,
} from "../../config/apiClient";
import { FaRegEdit } from "react-icons/fa";
import { IoInformationCircleOutline } from "react-icons/io5";
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
        const isIntroAction = log.action.toLowerCase().includes("intro");
        const customerId = isIntroAction ? extractCustomerIdFromUrl(log.changeSummary) : null;
        
        // Debug log to check detection
        if (isIntroAction) {
          console.log('Intro action detected:', {
            action: log.action,
            changeSummary: log.changeSummary,
            customerId
          });
        }
        
        return {
          time: moment(log.createdAt).format("hh:mm A"),
          text: log.changeSummary,
          link: `${log.customerData?.firstName || "Unknown"} ${log.customerData?.lastName || ""}`,
          icon: log.action.toLowerCase().includes("update") ? (
            <FaRegEdit className="text-pink-500 text-lg" />
          ) : (
            <IoInformationCircleOutline className="text-blue-500 text-lg" />
          ),
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
      
      // For intro actions, create a special formatted message
      const customerName = event.link.trim();
      
      return (
        <p className="text-gray-700 text-sm">
          Intro generated for{" "}
          <a 
            href={`/dashboard/client-intro/${paddedId}`}
            className="text-blue-500 font-medium hover:underline cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              console.log('Navigating to:', `/dashboard/client-intro/${paddedId}`);
              // You can use your router navigation here instead
              window.location.href = `/dashboard/client-intro/${paddedId}`;
            }}
          >
            {customerName} ({paddedId})
          </a>
          {" "}by Admin user
        </p>
      );
    } else {
      return (
        <p className="text-gray-700 text-sm">
          {event.text}{" "}
          <span className="text-blue-500 font-medium">{event.link}</span>
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
          <div key={date}>
            <h4 className="text-md font-semibold text-gray-800 mt-4 mb-2">
              {moment(date).format("D MMMM")}
            </h4>
            {logs.map((event, index) => (
              <div key={index} className="flex items-start gap-4 mb-2">
                {event.icon}
                {renderEventText(event)}
                <span className="text-gray-500 text-xs">{event.time}</span>
              </div>
            ))}
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