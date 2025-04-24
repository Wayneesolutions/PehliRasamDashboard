import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { clientSubm } from "../../config/apiClient";

const ClientSubmissions = () => {
  const [chartData, setChartData] = useState<{ date: string; value: number }[]>([]);

  useEffect(() => {
    const clientSubmission = async () => {
      try {
        const res = await clientSubm();
        console.log("API Response:", res);

        if (res.success && Array.isArray(res.data)) {
          const formatted = res.data.map((entry: { date: string; count: number }) => ({
            date: new Date(entry.date).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            }),
            value: entry.count,
          }));
          console.log("Formatted Data:", formatted);

          setChartData(formatted);
        }
      } catch (err) {
        console.error("Failed to fetch client submission data", err);
      }
    };
    clientSubmission();
  }, []);


  const maxValue = Math.max(...chartData.map(data => data.value), 0); 
  const ticks = maxValue > 0 ? Array.from({ length: maxValue + 1 }, (_, i) => i) : [0]; 

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">Client Submissions</h2>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <XAxis dataKey="date" />
          <YAxis 
            ticks={ticks} 
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip />
          <defs>
            <linearGradient id="colorGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="green" stopOpacity={0.8} />
              <stop offset="95%" stopColor="green" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke="green"
            fillOpacity={1}
            fill="url(#colorGreen)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ClientSubmissions;