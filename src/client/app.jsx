import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

import { AuthProvider, useAuth } from '../context/AuthContext';
import { ChatProvider } from '../context/ChatContext';
import { setUnauthorizedHandler } from '../services/api';
import PrivateRoute from './components/shared/PrivateRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatWidget from './components/resident/ChatWidget';

import HomePage from '../pages/HomePage';

import SchedulePage from '../pages/SchedulePage';
import ReportPage from '../pages/ReportPage';
import TrackPage from '../pages/TrackPage';
import WasteGuidePage from '../pages/WasteGuidePage';


import LoginPage from '../pages/admin/LoginPage';
import OAuthCallback from '../pages/admin/OAuthCallback';
import AdminLayout from '../pages/admin/AdminLayout';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminAnalyticsPage from '../pages/admin/AdminAnalyticsPage';
import DuplicateReportsPage from '../pages/admin/DuplicateReportsPage';

import HaulerManager from './components/admin/HaulerManager';
import BarangayManager from './components/admin/BarangayManager';
import WasteItemManager from './components/admin/WasteItemManager';
import RouteBuilder from './components/admin/RouteBuilder';

// leaflet.css is loaded via <link> in index.html — JS-importing it 404s because
// the NowSDK bundler strips path separators from the generated asset URL.
import './app.css';

function Shell() {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAdmin, logout } = useAuth();
    const isAdminRoute = location.pathname.startsWith('/admin');

    const togglePortal = () => {
        if (isAdminRoute) navigate('/');
        else navigate('/admin/login');
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.shiftKey && (e.key === 'L' || e.key === 'l')) {
                e.preventDefault();
                navigate('/admin/login');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [navigate]);

    // Any 401 from an authenticated API call ends the admin session. Flash is
    // read once by LoginPage and cleared.
    useEffect(() => {
        setUnauthorizedHandler(() => {
            if (!isAdmin) return;
            logout();
            sessionStorage.setItem('sc_flash', 'Your session expired. Please sign in again.');
            navigate('/admin/login');
        });
        return () => setUnauthorizedHandler(null);
    }, [isAdmin, logout, navigate]);

    return (
        <div
            className="sugboclean-shell"
            style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
        >
            <Navbar isAdmin={isAdminRoute} onTogglePortal={togglePortal} />

            <main className="main-canvas" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <Routes>
                    {/* Resident routes */}
                    <Route path="/" element={<HomePage />} />

                    <Route path="/schedule" element={<SchedulePage />} />
                    <Route path="/report" element={<ReportPage />} />
                    <Route path="/track" element={<TrackPage />} />
                    <Route path="/waste-guide" element={<WasteGuidePage />} />


                    {/* Admin login (public) */}
                    <Route path="/admin/login" element={<LoginPage />} />
                    <Route path="/admin/oauth/callback" element={<OAuthCallback />} />

                    {/* Admin routes (protected, nested under shared layout) */}
                    <Route path="/admin" element={<PrivateRoute><AdminLayout /></PrivateRoute>}>
                        <Route path="dashboard" element={<AdminDashboardPage />} />
                        <Route path="duplicate-reports" element={<DuplicateReportsPage />} />
                        <Route path="schedules" element={<RouteBuilder />} />
                        <Route path="route-stops" element={<Navigate to="/admin/schedules" replace />} />
                        <Route path="haulers" element={<HaulerManager />} />
                        <Route path="barangays" element={<BarangayManager />} />
                        <Route path="waste-items" element={<WasteItemManager />} />
                        <Route path="analytics" element={<AdminAnalyticsPage />} />
                    </Route>

                    {/* Fallback */}
                    <Route path="*" element={<HomePage />} />
                </Routes>
            </main>

            {!isAdminRoute && <Footer />}
            {!isAdminRoute && <ChatWidget />}
        </div>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <ChatProvider>
                <HashRouter>
                    <Shell />
                </HashRouter>
            </ChatProvider>
        </AuthProvider>
    );
}
