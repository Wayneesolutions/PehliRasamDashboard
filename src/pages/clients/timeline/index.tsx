import React, { useEffect, useState ,ReactElement} from "react";
import { getCustomerActivityLogs } from "../../../config/apiClient";
import { useOutletContext } from "react-router-dom";
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
  const [latestDate, setLatestDate] = useState<string>("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const result = await getCustomerActivityLogs({ customer: customerId });

      // Prepare timeline data based on the response
      const formatted: TimelineEvent[] = result.data.map((log: any) => ({
        time: "", // You can set a default time or leave it empty
        text: `Activity count: ${log.count}`, // Customize the text as needed
        link: "", // You can set a default link or leave it empty
        icon: log.count > 0 ? (
          <FaRegEdit className="text-pink-500 text-lg" />
        ) : (
          <IoInformationCircleOutline className="text-blue-500 text-lg" />
        ),
        date: moment(log.date).format("YYYY-MM-DD"),
      }));

      setTimelineData(formatted);

      // Prepare chart data
      const chartReady: ChartDataItem[] = result.data.map((log: any) => ({
        date: moment(log.date).format("D MMM"),
        value: log.count,
      }));

      setChartData(chartReady);

      if (formatted.length > 0) {
        const latest = moment(formatted[formatted.length - 1].date).format("MMMM D, YYYY");
        setLatestDate(latest);
      }
    } catch (err) {
      console.error("Error loading activity logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [customerId]); // Add customerId as a dependency to refetch logs when it changes

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      {/* Header Section */}
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-xl font-semibold">Timeline</h2>
        <div className="flex gap-2">
          <button className="px-3 py-1 bg-gray-200 rounded text-gray-600 hover:bg-gray-300">
            {"<"}
          </button>
          <button className="px-3 py-1 bg-gray-200 rounded text-gray-600 hover:bg-gray-300">
            {">"}
          </button>
        </div>
      </div>

      {/* Graph Section */}
      <div className="w-full h-48 mt-4 bg-gray-50 p-4 rounded-lg shadow-md">
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


      {/* Optional Client Badge */}
      <div className="mt-4">
        <span className="bg-gray-200 px-3 py-1 rounded-md text-gray-700 text-sm">
          Client: Manish Prasad
        </span>
      </div>

      {/* Timeline Date */}
      <h3 className="text-lg font-semibold mt-6">
        {latestDate || "No recent activity"}
      </h3>

      {/* Timeline List */}
      {loading ? (
        <p className="text-sm text-gray-500 mt-4">Loading activity logs...</p>
      ) : (
        <div className="mt-4 space-y-4">
          {timelineData.map((event, index) => (
            <div key={index} className="flex items-start gap-4">
              {event.icon}
              <p className="text-gray-700 text-sm">
                {event.text}{" "}
                <span className="text-blue-500 font-medium">
                  {event.link}
                </span>
              </p>
              <span className="text-gray-500 text-xs">{event.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TimelineMain;