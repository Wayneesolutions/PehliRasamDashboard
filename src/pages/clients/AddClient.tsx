import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MembershipForm from "./Form";
import { useEffect, useState } from "react";
import { getCustomerBasicDetail } from "../../config/apiClient";

const AddClient = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [customerId, setCustomerId] = useState<string>(""); // initialize as empty string

  const stateCustomerId = location.state?.customerId;
  const queryCustomerId = new URLSearchParams(location.search).get("customerId");


  const [, setEntryName] = useState<string | null>(null);

  useEffect(() => {
    // Get customerId from state, query params, or localStorage (in priority order)
    const finalId = stateCustomerId || queryCustomerId || localStorage.getItem("clientId");

    if (finalId) {
      localStorage.setItem("clientId", finalId);
      setCustomerId(finalId);

      // Fetch entry name and update URL
      const updateUrlWithEntryName = async () => {
        try {
          const res = await getCustomerBasicDetail(finalId);
          if (res.success && res.data) {
            const name = res.data.entryName;
            setEntryName(name || null);
            
            const currentPath = location.pathname;
            const currentSearch = new URLSearchParams(location.search);
            currentSearch.set("customerId", finalId);
            
            // Add entryName to URL if it exists
            if (name && name.trim()) {
              // Encode entryName for URL (keep it readable)
              const encodedEntryName = encodeURIComponent(name.trim());
              currentSearch.set("entryName", encodedEntryName);
            } else {
              // Remove entryName from URL if it doesn't exist
              currentSearch.delete("entryName");
            }
            
            // Update URL with replace to avoid adding to history
            navigate(`${currentPath}?${currentSearch.toString()}`, { replace: true });
          }
        } catch (error) {
          console.error("Error fetching customer details:", error);
          // Still update URL with customerId even if fetch fails
          const currentPath = location.pathname;
          const currentSearch = new URLSearchParams(location.search);
          currentSearch.set("customerId", finalId);
          navigate(`${currentPath}?${currentSearch.toString()}`, { replace: true });
        }
      };

      updateUrlWithEntryName();
    }
  }, [stateCustomerId, queryCustomerId, location.pathname, navigate]);

  const showMembershipForm = location.pathname === "/dashboard/add-client";

  // Update browser tab title based on entryName
  useEffect(() => {
    const updateTabTitle = async () => {
      if (customerId) {
        try {
          const res = await getCustomerBasicDetail(customerId);
          if (res.success && res.data) {
            const name = res.data.entryName;
            setEntryName(name || null);
            if (name && name.trim()) {
              document.title = `${name} - Pehli Rasam`;
            } else {
              // Fallback to firstName + lastName if entryName is not set
              const fullName = `${res.data.firstName || ''} ${res.data.lastName || ''}`.trim();
              document.title = fullName ? `${fullName} - Pehli Rasam` : 'Pehli Rasam';
            }
          } else {
            document.title = 'Pehli Rasam';
          }
        } catch (error) {
          console.error("Error fetching customer details for tab title:", error);
          document.title = 'Pehli Rasam';
        }
      } else {
        document.title = 'Pehli Rasam';
      }
    };

    updateTabTitle();
    
    // Listen for custom event when entryName is updated in Sidebar
    const handleEntryNameUpdate = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const newEntryName = customEvent.detail?.entryName;
      setEntryName(newEntryName);
      
      // Update URL with new entryName
      if (customerId) {
        const currentPath = location.pathname;
        const currentSearch = new URLSearchParams(location.search);
        currentSearch.set("customerId", customerId);
        
        if (newEntryName && newEntryName.trim()) {
          const encodedEntryName = encodeURIComponent(newEntryName.trim());
          currentSearch.set("entryName", encodedEntryName);
        } else {
          currentSearch.delete("entryName");
        }
        
        navigate(`${currentPath}?${currentSearch.toString()}`, { replace: true });
      }
      
      updateTabTitle();
    };
    
    window.addEventListener('entryNameUpdated', handleEntryNameUpdate);
    
    return () => {
      window.removeEventListener('entryNameUpdated', handleEntryNameUpdate);
    };
  }, [customerId, location.pathname, navigate]);

  return (
    <div className="flex h-screen">
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
