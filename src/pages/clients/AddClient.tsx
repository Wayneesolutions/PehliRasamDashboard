import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MembershipForm from "./Form";
import { useEffect, useMemo } from "react";

const AddClient = () => {
  const location = useLocation();

  // Extract from state (in-app navigation)
  const stateCustomerId = location.state?.customerId;

  // Extract from URL param (new tab or refresh)
  const queryParams = new URLSearchParams(location.search);
  const urlCustomerId = queryParams.get("customerId");

  // Final fallback logic
  const customerId = useMemo(() => {
    return stateCustomerId || urlCustomerId || localStorage.getItem("clientId");
  }, [stateCustomerId, urlCustomerId]);

  useEffect(() => {
    if (customerId) {
      localStorage.setItem("clientId", customerId);
    }
  }, [customerId]);

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
