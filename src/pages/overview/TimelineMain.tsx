import React, { useEffect, useState ,ReactElement} from "react";
import { getActivityLogs } from "../../config/apiClient";
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
  const [timelineData, setTimelineData] = useState<TimelineEvent[]>([]);
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [latestDate, setLatestDate] = useState<string>("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const result = await getActivityLogs({ customer: "all" });

      const formatted: TimelineEvent[] = result.data.map((log: any) => ({
        time: moment(log.createdAt).format("hh:mm A"),
        text: log.changeSummary,
        link: `${log.customerData.firstName} ${log.customerData.lastName}`,
        icon: log.action.includes("Update") ? (
          <FaRegEdit className="text-pink-500 text-lg" />
        ) : (
          <IoInformationCircleOutline className="text-blue-500 text-lg" />
        ),
        date: moment(log.createdAt).format("YYYY-MM-DD"),
      }));

      setTimelineData(formatted);

      // Group by date and count occurrences
      const grouped: Record<string, number> = formatted.reduce(
        (acc: Record<string, number>, curr: TimelineEvent) => {
          acc[curr.date] = (acc[curr.date] || 0) + 1;
          return acc;
        },
        {}
      );

      const chartReady: ChartDataItem[] = Object.entries(grouped).map(
        ([date, count]) => ({
          date: moment(date).format("D MMM"),
          value: count,
        })
      );

      setChartData(chartReady);

      if (formatted.length > 0) {
        const latest = moment(formatted[0].date).format("MMMM D, YYYY");
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
  }, []);

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

      {/* Search Bar */}
      <div className="flex gap-2 mt-4">
        <input
          type="text"
          placeholder="Type to Search"
          className="w-full px-4 py-2 border rounded-md focus:ring focus:ring-blue-300"
        />
        <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
          Advanced Search
        </button>
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
