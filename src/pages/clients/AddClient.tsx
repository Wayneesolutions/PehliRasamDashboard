import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MembershipForm from "./Form";

const AddClient = () => {
    const location = useLocation();
    const showMembershipForm = location.pathname === "/dashboard/add-client";
    const customerId = location.state?.clientId;
    
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
                    {showMembershipForm ? <MembershipForm /> : <Outlet />}
                </div>
            </div>
        </div>
    );
};

export default AddClient;
