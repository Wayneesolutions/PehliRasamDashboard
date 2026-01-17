import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MembershipForm from "./Form";
import { useEffect, useState } from "react";

const AddClient = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [customerId, setCustomerId] = useState<string>(""); // initialize as empty string

  const stateCustomerId = location.state?.customerId;
  const queryCustomerId = new URLSearchParams(location.search).get("customerId");


  useEffect(() => {
    // Get customerId from state, query params, or localStorage (in priority order)
    const finalId = stateCustomerId || queryCustomerId || localStorage.getItem("clientId");

    if (finalId) {
      localStorage.setItem("clientId", finalId);
      setCustomerId(finalId);

      // Ensure customerId is always in the URL when available
      // Update URL if customerId exists but is not in the query params
      // This ensures the URL always has customerId for sharing/bookmarking
      if (!queryCustomerId && finalId) {
        const currentPath = location.pathname;
        const currentSearch = new URLSearchParams(location.search);
        
        // Only update if customerId is not already in the URL
        if (currentSearch.get("customerId") !== finalId) {
          currentSearch.set("customerId", finalId);
          // Update URL with replace to avoid adding to history
          navigate(`${currentPath}?${currentSearch.toString()}`, { replace: true });
        }
      }
    }
  }, [stateCustomerId, queryCustomerId, location.pathname, navigate]);

  const showMembershipForm = location.pathname === "/dashboard/add-client";

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar customerId={customerId} />
      <div className="flex-1 flex flex-col overflow-y-auto overflow-hidden p-6 pt-0">
        <Header customerId={customerId} />
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
