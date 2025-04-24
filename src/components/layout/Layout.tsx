import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Layout } from "antd";
import Sidebar from "./Sidebar";
import NavHeader from "./Header";
import useIsMobile from "../../hooks/IsMobile";

const { Content } = Layout;

const App: React.FC = () => {
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(isMobile);

  useEffect(() => {
    setCollapsed(isMobile);
  }, [isMobile]);

  return (
    <Layout style={{ height: "100vh", overflow: "hidden" }}>
      {/* Fixed Header */}
      <NavHeader onClick={() => setCollapsed(!collapsed)} collapsed={collapsed} />

      <Layout style={{ paddingTop: "64px", display: "flex" }}>
        {/* Sidebar */}
        <Sidebar collapsed={collapsed} />

        {/* Scrollable Content */}
        <Layout
          style={{
            marginLeft: collapsed ? 70 : 250, // Decreased Sidebar Width
            transition: "margin-left 0.3s ease-in-out",
            height: "calc(100vh - 64px)",
            overflowY: "auto",
            padding: "24px",
            background:"rgb(238, 242, 250)"
          }}
        >
          <Content>
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default App;
