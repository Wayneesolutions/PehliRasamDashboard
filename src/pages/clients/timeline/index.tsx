import React, { useEffect, useState, ReactElement } from "react";
import {
  getActivityLogsCustomer,
  getCustomerActivityLogsID,
} from "../../../config/apiClient";
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
import { useOutletContext } from "react-router-dom";

type TimelineEvent = {
  time: string;
  text: string;
  link: string;
  icon: ReactElement;
  date: string;
  isIntroAction?: boolean;
  introId?: string;
};

type ChartDataItem = {
  date: string;
  value: number;
};

const TimelineMain: React.FC = () => {
  const { customerId } = useOutletContext<{ customerId: string }>();
  const [timelineData, setTimelineData] = useState<TimelineEvent[]>([]);
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = timelineData.slice(startIndex, endIndex);
  const totalPages = Math.ceil(timelineData.length / itemsPerPage);

  // Function to extract intro ID from changeSummary URL
  const extractIntroIdFromUrl = (changeSummary: string): string | null => {
    if (!changeSummary) return null;
    
    // Try to match /client/ followed by digits (could be in a URL like http://... or just /client/12345)
    const urlMatch = changeSummary.match(/\/client\/(\d+)/);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1];
    }
    
    // Also try to match just digits if the format is different
    const digitMatch = changeSummary.match(/\b(\d{5})\b/);
    if (digitMatch && digitMatch[1]) {
      return digitMatch[1];
    }
    
    return null;
  };

  const fetchTimelineLogs = async () => {
    setLoading(true);
    try {
      const result = await getActivityLogsCustomer({ customer: customerId });

      const sortedLogs = result.data.sort(
        (a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      const formatted: TimelineEvent[] = sortedLogs.map((log: any) => {
        const isIntroAction = log.action.toLowerCase().includes("intro");
        const introIdFromUrl = isIntroAction ? extractIntroIdFromUrl(log.changeSummary) : null;
        
        // Debug logging for intro actions
        if (isIntroAction) {
          console.log('Intro action detected:', {
            action: log.action,
            changeSummary: log.changeSummary,
            introId: introIdFromUrl
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
          introId: introIdFromUrl,
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
      const chartResponse = await getCustomerActivityLogsID({ customer: customerId });

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

  // Function to render the timeline event text with clickable link for intro actions
  const renderEventText = (event: TimelineEvent) => {
    if (event.isIntroAction && event.introId) {
      // Ensure intro ID is padded to 5 digits
      const paddedId = event.introId.padStart(5, '0');
      const targetPath = `/dashboard/client-intro/${paddedId}`;
      // Get token from localStorage to pass in URL (for new tab authentication)
      const token = localStorage.getItem('token');
      const fullUrl = token 
        ? `${window.location.origin}${targetPath}#token=${encodeURIComponent(token)}`
        : `${window.location.origin}${targetPath}`;
      
      return (
        <p className="text-gray-700 text-sm">
          <span
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Opening intro page in new browser tab:', fullUrl);
              window.open(fullUrl, '_blank', 'noopener,noreferrer');
            }}
            className="text-blue-500 font-medium hover:underline cursor-pointer"
          >
            Intro
          </span>
          {" "}generated for {event.link.trim()}
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

  useEffect(() => {
    fetchTimelineLogs();
    fetchChartLogs();
  }, [customerId]);

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
        ).map(([date, logs]) => {
          const dateObj = moment(date);
          const isToday = dateObj.isSame(moment(), 'day');
          const isYesterday = dateObj.isSame(moment().subtract(1, 'day'), 'day');
          
          return (
          <div key={date} className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`px-4 py-2 rounded-lg ${
                isToday 
                  ? 'bg-blue-500 text-white' 
                  : isYesterday 
                    ? 'bg-gray-200 text-gray-700'
                    : 'bg-gray-100 text-gray-700'
              }`}>
                <div className="text-xs font-medium uppercase tracking-wide mb-0.5">
                  {isToday ? 'Today' : isYesterday ? 'Yesterday' : dateObj.format('dddd')}
                </div>
                <div className={`text-lg font-bold ${
                  isToday ? 'text-white' : 'text-gray-900'
                }`}>
                  {dateObj.format("D")}
                </div>
                <div className={`text-xs font-medium ${
                  isToday ? 'text-blue-100' : 'text-gray-600'
                }`}>
                  {dateObj.format("MMMM YYYY")}
                </div>
              </div>
            </div>
            {logs.map((event, index) => {
              const isIntroRow = event.isIntroAction && event.introId;
              const paddedId = isIntroRow ? event.introId!.padStart(5, '0') : null;
              const targetPath = isIntroRow ? `/dashboard/client-intro/${paddedId}` : null;
              // Get token from localStorage to pass in URL (for new tab authentication)
              const token = localStorage.getItem('token');
              const fullUrl = isIntroRow && targetPath
                ? token
                  ? `${window.location.origin}${targetPath}#token=${encodeURIComponent(token)}`
                  : `${window.location.origin}${targetPath}`
                : null;
              
              const handleRowClick = (e: React.MouseEvent) => {
                if (isIntroRow && fullUrl) {
                  // Only handle if clicking on the row itself, not on the Intro link
                  if ((e.target as HTMLElement).tagName !== 'SPAN' || !(e.target as HTMLElement).classList.contains('text-blue-500')) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Opening intro page in new browser tab from row click:', fullUrl);
                    window.open(fullUrl, '_blank', 'noopener,noreferrer');
                  }
                }
              };
              
              return (
                <div
                  key={index}
                  onClick={handleRowClick}
                  className={`flex items-start gap-4 mb-2 ${
                    isIntroRow
                      ? 'cursor-pointer hover:bg-gray-50 rounded-md p-2 -m-2 transition-colors'
                      : ''
                  }`}
                  role={isIntroRow ? 'button' : undefined}
                  tabIndex={isIntroRow ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (isIntroRow && (e.key === 'Enter' || e.key === ' ') && fullUrl) {
                      e.preventDefault();
                      window.open(fullUrl, '_blank', 'noopener,noreferrer');
                    }
                  }}
                >
                  {event.icon}
                  <div className="flex-1">
                    {renderEventText(event)}
                  </div>
                  <span className="text-gray-600 text-sm font-medium whitespace-nowrap ml-2">
                    {event.time}
                  </span>
                </div>
              );
            })}
          </div>
          );
        })
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