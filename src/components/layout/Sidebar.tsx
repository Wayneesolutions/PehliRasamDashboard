import { useState } from "react";
import { Menu, Layout } from "antd";
import { sidebarLinks } from "../../utils/SidebarLinks";
import { useNavigate } from "react-router-dom";
import { MdSettings } from "react-icons/md";
import "./Sidebar.css"; // ✅ ADD THIS

const { Sider } = Layout;
const { SubMenu } = Menu;

type SidebarProps = {
  collapsed: boolean;
};

const Sidebar = ({ collapsed }: SidebarProps) => {
  const navigate = useNavigate();

  const [openKeys, setOpenKeys] = useState<string[]>([
    "dashboard",
    "communication",
    "settings",
  ]);

  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
  };

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={250}
      className="customSidebar" // ✅ ADD THIS
      style={{
        height: "100vh",
        background: "rgb(238, 242, 250)",
        transition: "width 0.3s ease-in-out",
        position: "fixed",
        left: 0,
        top: 64,
        zIndex: 900,
      }}
    >
      <div className="sidebarScroll"
        style={{
          height: "calc(100vh - 64px)",
          overflowY: "auto",
        }}
      >
        <Menu
          mode="inline"
          openKeys={openKeys}
          onOpenChange={handleOpenChange}
          onClick={(e) => navigate(e.key)}
          className="customMenu" // ✅ ADD THIS
        >
          {sidebarLinks.map((link) =>
            link.children ? (
              <SubMenu
                key={link.key}
                icon={link.icon || <MdSettings />}
                title={link.label}
              >
                {link.children.map((child) =>
                  child.children ? (
                    <SubMenu
                      key={child.key}
                      title={child.label}
                      icon={child.icon}
                    >
                      {child.children.map((subChild) => (
                        <Menu.Item key={subChild.key}>
                          {subChild.label}
                        </Menu.Item>
                      ))}
                    </SubMenu>
                  ) : (
                    <Menu.Item key={child.key}>{child.label}</Menu.Item>
                  )
                )}
              </SubMenu>
            ) : (
              <Menu.Item key={link.key} icon={link.icon}>
                {link.label}
              </Menu.Item>
            )
          )}
        </Menu>
      </div>
    </Sider>
  );
};

export default Sidebar;
