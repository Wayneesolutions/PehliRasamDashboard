import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MembershipForm from "./Form";
import { useEffect, useMemo } from "react";

const AddClient = () => {
    const location = useLocation();
    const stateCustomerId = location.state?.customerId;

    useEffect(() => {
        if (stateCustomerId) {
            localStorage.setItem("clientId", stateCustomerId);
        }
    }, [stateCustomerId]);

    const customerId = useMemo(() => {
        return stateCustomerId || localStorage.getItem("clientId");
    }, [stateCustomerId]);

    const showMembershipForm = location.pathname === "/dashboard/add-client";

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar customerId={customerId} />
            <div className="flex-1 flex flex-col overflow-y-auto overflow-hidden p-6 pt-0">
                <Header />
                <div className="flex-1 pt-7">
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
