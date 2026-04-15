import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../client/components/layout/Sidebar';
import TopBar from '../../client/components/layout/TopBar';

export default function AdminLayout() {
  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 120px)' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TopBar />
        <div style={{ flex: 1, padding: 20, overflowY: 'auto' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
