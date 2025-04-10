import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MembershipForm from "./Form";
import { useEffect, useMemo } from "react";

const AddClient = () => {
    const location = useLocation();
    const stateClientId = location.state?.clientId;

    useEffect(() => {
        if (stateClientId) {
            localStorage.setItem("clientId", stateClientId);
        }
    }, [stateClientId]);

    // Use from state or fallback to localStorage
    const customerId = useMemo(() => {
        return stateClientId || localStorage.getItem("clientId");
    }, [stateClientId]);

    const showMembershipForm = location.pathname === "/dashboard/add-client";

    useEffect(() => {
        if (!customerId) {
            console.warn("customerId not found in location.state or localStorage");
        }
    }, [customerId]);

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar (Fixed on the left) */}
            <Sidebar customerId={customerId} />

            {/* Main Content Section */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header stays on top of content only */}
                <Header />

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {showMembershipForm ? (
                        <MembershipForm customerId={customerId} />
                    ) : (
                        <Outlet context={{ customerId }} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddClient;
