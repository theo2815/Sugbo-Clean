import React from "react";

const AdminContainer = ({ children }) => {
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {children}
    </div>
  );
};

export default AdminContainer;