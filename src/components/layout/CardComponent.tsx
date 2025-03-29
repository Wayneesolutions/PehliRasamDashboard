import React from "react";
import { Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

interface CardData {
  title: string;
  value: number;
  icon: React.ReactNode;
  chartColor: string;
  chartBackgroundColor: string;
  gradientColorStart: string;
  gradientColorEnd: string;
  data: { value: number }[];
}


const CardComponent: React.FC<CardData> = ({
  title,
  value,
  icon,
  chartColor,
  chartBackgroundColor,
  gradientColorStart,
  gradientColorEnd,
  data,
}) => {
  const gradientId = `colorGradient-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div
      className="p-6 transition-transform transform bg-white rounded-lg shadow-md hover:scale-105"
      style={{
        boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div className="flex items-center justify-between">
        {/* Icon & Title */}
        <div className="flex items-center">
          <div
            className="flex items-center justify-center w-12 h-12 text-xl font-bold text-white rounded-full"
            style={{
              backgroundColor: chartBackgroundColor,
              color: chartColor,
            }}
          >
            {icon}
          </div>
          <div className="ml-4">
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-black">{value}</p>
          </div>
        </div>

        {/* Chart */}
        <div className="w-24 h-16">
          <ResponsiveContainer>
            <AreaChart data={data}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={gradientColorStart} stopOpacity={0.8} />
                  <stop offset="100%" stopColor={gradientColorEnd} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
              />
              <Tooltip />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default CardComponent;
