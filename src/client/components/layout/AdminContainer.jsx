import React from "react";
import { COLORS } from "../../../utils/constants";

const AdminContainer = ({ children }) => {
  return (
    <div style={{
      display: "flex",
      height: "100%",
      background: COLORS.bg.page,
      overflow: "hidden",
    }}>
      {children}
    </div>
  );
};

export default AdminContainer;