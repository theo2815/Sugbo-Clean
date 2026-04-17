import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminContainer from '../../client/components/layout/AdminContainer';
import Sidebar from '../../client/components/layout/Sidebar';
import TopBar from '../../client/components/layout/TopBar';
import { COLORS } from '../../utils/constants';

export default function AdminLayout() {
  return (
    <AdminContainer>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
        <TopBar />
        <main style={{
          flex: 1,
          minHeight: 0,
          padding: 24,
          overflowY: 'auto',
          background: COLORS.bg.page,
        }}>
          <Outlet />
        </main>
      </div>
    </AdminContainer>
  );
}
