import { useState } from "react";
import { Button, Input, message, Dropdown, Menu, Space } from "antd";
import {
  RiMenuFoldLine,
  RiMenuUnfoldLine,
  RiSearchLine,
  RiUserLine,
  RiNotification3Line,
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

  const profileMenu = (
    <Menu>
      <Menu.Item key="profile" onClick={() => navigate("/dashboard/profile-setting-info")}>
        Profile Settings
      </Menu.Item>
      <Menu.Item key="logout" onClick={handleLogout}>Logout</Menu.Item>
    </Menu>
  );


  return (
    <div className="fixed top-0 left-0 w-full h-16 bg-white shadow-md flex items-center justify-between px-6 z-50">
      <div className="flex items-center gap-3">
        <Button
          type="text"
          icon={collapsed ? <RiMenuUnfoldLine /> : <RiMenuFoldLine />}
          onClick={onClick}
          className="text-gray-600 text-2xl cursor-pointer"
        />
        <h1 className="text-lg font-medium">Pehli Rasam</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-64">
          <Input
            placeholder="Search..."
            prefix={<RiSearchLine className="text-gray-400" />}
            className="rounded-full w-full"
          />
        </div>

        <div className="relative">
          <RiNotification3Line className="text-xl text-gray-500 cursor-pointer" />
          <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
        </div>

        <Dropdown overlay={profileMenu} trigger={["hover"]}>
          <Space className="cursor-pointer">
            <RiUserLine className="text-xl text-blue-500" />
            <span>{adminName}</span>
          </Space>
        </Dropdown>
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
