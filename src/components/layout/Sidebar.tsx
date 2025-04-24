import { useState } from "react";
import { Menu, Layout } from "antd";
import { sidebarLinks } from "../../utils/SidebarLinks";
import { useNavigate } from "react-router-dom";
import { MdSettings } from "react-icons/md";

const { Sider } = Layout;
const { SubMenu } = Menu;

type SidebarProps = {
  collapsed: boolean;
};

const Sidebar = ({ collapsed }: SidebarProps) => {
  const navigate = useNavigate();
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  // Handle submenu toggle
  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
  };

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={250}
      style={{
        height: "100vh",
        background: "rgb(238, 242, 250)",
        transition: "width 0.3s ease-in-out",
        position: "fixed",
        left: 0,
        top: 64,
        zIndex: 900,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          maxHeight: "calc(100vh - 64px)", // 64px is your header height
        }}
      >

        <Menu
          mode="inline"
          defaultSelectedKeys={["/dashboard"]}
          openKeys={openKeys}
          onOpenChange={handleOpenChange}
          onClick={(e) => navigate(e.key)}
          style={{
            fontSize: "16px",
            fontWeight: 500,
            padding: "12px 0",
            background: "rgb(238, 242, 250)",
            borderInlineEnd: "none",
            borderRight: "none",
          }}
        >
          {sidebarLinks.map((link) =>
            link.children ? (
              <SubMenu
                key={link.key}
                icon={link.icon || <MdSettings />}
                title={link.label}
                className="custom-submenu"
              >
                {link.children.map((child) =>
                  child.children ? (
                    <SubMenu key={child.key} title={child.label} icon={child.icon} className="custom-submenu">
                      {child.children.map((subChild) => (
                        <Menu.Item key={subChild.key}>{subChild.label}</Menu.Item>
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
