import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MembershipForm from "./Form";
import { useEffect, useState } from "react";

const AddClient = () => {
  const location = useLocation();
  const [customerId, setCustomerId] = useState<string>(""); // initialize as empty string

  const stateCustomerId = location.state?.customerId;
  const queryCustomerId = new URLSearchParams(location.search).get("customerId");


  useEffect(() => {

    const finalId = stateCustomerId || queryCustomerId || localStorage.getItem("clientId");

    if (finalId) {
      localStorage.setItem("clientId", finalId);
      setCustomerId(finalId); // ⬅️ use state to prevent fallback loops
    }
  }, [stateCustomerId, queryCustomerId]);

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
