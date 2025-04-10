import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Header: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const topTabs = [
        { name: "Timeline", path: "/dashboard/add-client/timeline" },
        { name: "Profile", path: "/dashboard/add-client" },
        { name: "Matching", path: "/dashboard/add-client/matching" },
        { name: "Photos", path: "/dashboard/add-client/photos" },
        { name: "Events", path: "/dashboard/add-client/events" },
        { name: "Communication", path: "/dashboard/add-client/communication" }
    ];

    return (
        <div className="sticky top-0 bg-white shadow-md py-6 px-6 flex flex-col justify-between items-center z-10 border-b border-gray-200">
            {/* Top Row */}
            <div className="flex gap-6 text-gray-700 font-semibold">
                {topTabs.map((tab) => (
                    <div
                        key={tab.name}
                        className={`cursor-pointer transition ${
                            location.pathname === tab.path
                                ? "text-blue-600 underline font-bold"
                                : "hover:text-blue-600"
                        }`}
                        onClick={() =>
                            navigate(tab.path, {
                                state: { clientId: location.state?.clientId },
                            })
                        }
                    >
                        {tab.name}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Header;
