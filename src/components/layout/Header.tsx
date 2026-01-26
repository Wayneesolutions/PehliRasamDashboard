import { useState } from "react";
import { Button, Input, message, Dropdown, Menu, Space } from "antd";
import {
  RiMenuFoldLine,
  RiMenuUnfoldLine,
  RiSearchLine,
  RiUserLine,
} from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import Modal from "../atoms/Modal";
import { useSetRecoilState } from "recoil";
import { authState } from "../../state/auth";

type Props = {
  onClick: () => void;
  collapsed: boolean;
};

const NavHeader = ({ onClick, collapsed }: Props) => {
  const navigate = useNavigate();
  const setAuthState = useSetRecoilState(authState);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const admin = JSON.parse(localStorage.getItem("admin") || "{}");
  const adminName = admin?.firstName ? `${admin.firstName} ${admin.lastName || ""}` : "Admin";

  const handleLogout = () => setIsModalOpen(true);

  const confirmLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("admin");

    setAuthState({
      accessToken: "",
      isAuthenticated: false,
    });

    message.success("Logged out successfully.");
    navigate("/login");
  };



  return (
    <div
      className="fixed top-0 left-0 w-full h-16 flex items-center justify-between px-6 z-50"
      style={{ background: "rgb(238, 242, 250)" }}
    >
      <div className="flex items-center gap-3">
        <Button
          type="text"
          icon={collapsed ? <RiMenuUnfoldLine /> : <RiMenuFoldLine />}
          onClick={onClick}
          className="text-gray-600 !text-2xl cursor-pointer"
        />
        <h1 className="pt-2 text-3xl font-normal" style={{ fontFamily: '"Inter", "Segoe UI", Roboto, Arial, sans-serif', fontWeight: 400 }}>Pehli Rasam</h1>
      </div>
  
      {/* ✅ RIGHT SIDE */}
      <div className="flex items-center gap-4">
        <Space className="cursor-pointer">
          <RiUserLine className="text-xl text-blue-500" />
          <span className="text-gray-700" style={{ fontFamily: '"Inter", "Segoe UI", Roboto, Arial, sans-serif', fontWeight: 400 }}>{adminName}</span>
        </Space>
  
        <Button
          type="default"
          onClick={() => navigate("/dashboard/profile-setting-info")}
          className="rounded-lg"
          style={{ fontFamily: '"Inter", "Segoe UI", Roboto, Arial, sans-serif', fontWeight: 400 }}
        >
          Profile Settings
        </Button>
  
        <Button
          danger
          type="primary"
          onClick={handleLogout}
          className="rounded-lg"
          style={{ fontFamily: '"Inter", "Segoe UI", Roboto, Arial, sans-serif', fontWeight: 400 }}
        >
          Logout
        </Button>
      </div>
  
      <Modal
        title="Confirm Logout"
        isModalOpen={isModalOpen}
        handleCancel={() => setIsModalOpen(false)}
      >
        <p>Are you sure you want to log out?</p>
        <div className="flex justify-end gap-3 mt-4">
          <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
          <Button type="primary" danger onClick={confirmLogout}>
            Logout
          </Button>
        </div>
      </Modal>
    </div>
  );
  
};

export default NavHeader;
