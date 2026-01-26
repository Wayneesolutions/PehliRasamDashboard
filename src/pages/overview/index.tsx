import { FaRegChartBar, FaUsers, FaMoneyBillAlt } from "react-icons/fa";
import CardComponent from "../../components/layout/CardComponent";
import RecentlyViewedClients from "../../components/layout/RecentlyViewedClients";
import ClientSubmissions from "../../components/layout/ClientSubmissions";
import RecentlySubmittedClients from "../../components/layout/RecentlySubmittedClients";
import { useEffect, useState } from "react";
import { getTodayStatsCount } from "../../config/apiClient";

const Overview = () => {
  const [cardData, setCardData] = useState([
    {
      title: "Clients Added Today",
      value: 0,
      icon: <FaRegChartBar />,
      chartColor: "#4CAF50",
      chartBackgroundColor: "rgba(76, 175, 80, 0.2)",
      gradientColorStart: "rgba(76, 175, 80, 0.6)",
      gradientColorEnd: "rgba(76, 175, 80, 0)",
      data: [{ value: 10 }, { value: 15 }, { value: 12 }, { value: 18 }, { value: 14 }, { value: 20 }],
    },
    {
      title: "Events Today",
      value: 0,
      icon: <FaUsers />,
      chartColor: "#2196F3",
      chartBackgroundColor: "rgba(33, 150, 243, 0.2)",
      gradientColorStart: "rgba(33, 150, 243, 0.6)",
      gradientColorEnd: "rgba(33, 150, 243, 0)",
      data: [{ value: 25 }, { value: 30 }, { value: 28 }, { value: 35 }, { value: 32 }, { value: 40 }],
    },
    {
      title: "Sent Emails Today",
      value: 0,
      icon: <FaMoneyBillAlt />,
      chartColor: "#FFC107",
      chartBackgroundColor: "rgba(255, 193, 7, 0.2)",
      gradientColorStart: "rgba(255, 193, 7, 0.6)",
      gradientColorEnd: "rgba(255, 193, 7, 0)",
      data: [{ value: 50 }, { value: 60 }, { value: 55 }, { value: 70 }, { value: 65 }, { value: 75 }],
    },
  ]);

  useEffect(() => {
    const countData = async () => {
      const res = await getTodayStatsCount();
      if (res?.success && res.data) {
        const { customersAddedToday, mailsSentToday, EventsToday } = res.data;
        setCardData((prevData) => [
          {
            ...prevData[0],
            value: customersAddedToday,
          },
          {
            ...prevData[1],
            value: EventsToday,
          },
          {
            ...prevData[2],
            value: mailsSentToday,
          },
        ]);
      }
    };
    countData();
  }, []);


  return (
    <div className="p-3 min-h-screen">
      {/* Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {cardData.map((card, index) => (
          <CardComponent key={index} {...card} />
        ))}
      </div>

      {/* Recently Viewed Clients */}
      <div className="mt-8">
        <RecentlyViewedClients />
      </div>

      {/* Main Content Section */}
      <div className="mt-8 flex flex-col md:flex-row gap-6 items-stretch">
        <div className="w-full md:w-1/2 p-6 bg-white rounded-lg shadow-md">
          <ClientSubmissions />
        </div>
        <div className="w-full md:w-1/2 p-6 bg-white rounded-lg shadow-md">
          <RecentlySubmittedClients />
        </div>
      </div>
    </div>
  );
};

export default Overview;
