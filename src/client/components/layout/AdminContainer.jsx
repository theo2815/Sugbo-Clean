import React from "react";
import { COLORS } from "../../../utils/constants";

const AdminContainer = ({ children }) => {
  return (
    <div style={{
      display: "flex",
      // Grow with content so the browser's own scrollbar handles overflow
      // (matches the resident page shell). 80px accounts for the sticky Navbar.
      minHeight: "calc(100vh - 80px)",
      background: COLORS.bg.page,
      alignItems: "stretch",
    }}>
      {children}
    </div>
  );
};

export default AdminContainer;