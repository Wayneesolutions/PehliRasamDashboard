import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Dropdown, Menu } from "antd";
import SendMessage from "./SendMessage";
import SendIntro from "./SendIntro";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const topTabs = [
    { name: "Timeline", path: "/dashboard/add-client/timeline" },
    { name: "Profile", path: "/dashboard/add-client" },
    { name: "Matching", path: "/dashboard/add-client/matching" },
    { name: "Photos", path: "/dashboard/add-client/photos" },
  ];

  const [modalVisible, setModalVisible] = useState(false);

  const handleSendMessageClick = () => setModalVisible(true);
  const handleCloseModal = () => setModalVisible(false);

  const [modalVisibleIntro, setModalVisibleIntro] = useState(false);

  const handleSendIntroClick = () => setModalVisibleIntro(true);
  const handleCloseModalIntro = () => setModalVisibleIntro(false);

  const menu = (
    <Menu>
      <Menu.Item key="sendMessage" onClick={handleSendMessageClick}>
        Send Message
      </Menu.Item>
      <Menu.Item key="sendIntro" onClick={handleSendIntroClick}>
        Send Intro
      </Menu.Item>
    </Menu>
  );

  // Get customerId from location state
  const customerId = location.state?.customerId;

  if (!customerId) {
    console.log("No customerId found in location state");
  }

  return (
    <div className="sticky top-0 bg-white shadow-md py-6 px-6 z-10 border-b border-gray-200">
      <div className="relative flex items-center justify-center">
        {/* Centered Tabs */}
        <div className="absolute left-1/2 transform -translate-x-1/2 flex gap-6 text-gray-700 font-semibold">
          {topTabs.map((tab) => (
            <div
              key={tab.name}
              className={`cursor-pointer transition ${location.pathname === tab.path
                ? "text-blue-600 underline font-bold"
                : "hover:text-blue-600"
                }`}
              onClick={() =>
                navigate(tab.path, {
                  state: { customerId: customerId }, // Pass customerId when navigating
                })
              }
            >
              {tab.name}
            </div>
          ))}
        </div>

        {/* Right Corner Dropdown */}
        <div className="ml-auto">
          <Dropdown overlay={menu} trigger={['click']}>
            <a
              onClick={(e) => e.preventDefault()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold cursor-pointer hover:bg-blue-700 border border-blue-700 shadow-sm"
            >
              Actions ▼
            </a>
          </Dropdown>
        </div>
      </div>

      {/* Modal */}
      <SendMessage
        customerId={customerId}
        isOpen={modalVisible}
        onClose={handleCloseModal}
        func={() => { }}
        val={null}
      />

      <SendIntro
        customerId={customerId}
        isOpen={modalVisibleIntro}
        onClose={handleCloseModalIntro}
        func={() => { }}
        val={null}
      />
    </div>
  );
};

export default Header;
