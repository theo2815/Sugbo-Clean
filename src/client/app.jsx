import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';

import { AuthProvider } from '../context/AuthContext';
import PrivateRoute from './components/shared/PrivateRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

import HomePage from '../pages/HomePage';

import SchedulePage from '../pages/SchedulePage';
import ReportPage from '../pages/ReportPage';
import TrackPage from '../pages/TrackPage';
import WasteGuidePage from '../pages/WasteGuidePage';


import LoginPage from '../pages/admin/LoginPage';
import AdminLayout from '../pages/admin/AdminLayout';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminAnalyticsPage from '../pages/admin/AdminAnalyticsPage';

import ScheduleManager from './components/admin/ScheduleManager';
import HaulerManager from './components/admin/HaulerManager';
import RouteStopManager from './components/admin/RouteStopManager';
import WasteItemManager from './components/admin/WasteItemManager';

import './app.css';

function Shell() {
    const navigate = useNavigate();
    const location = useLocation();
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

    return (
        <div
            className="sugboclean-shell"
            style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
        >
            <Navbar isAdmin={isAdminRoute} onTogglePortal={togglePortal} />

            <main className="main-canvas" style={{ flex: 1 }}>
                <Routes>
                    {/* Resident routes */}
                    <Route path="/" element={<HomePage />} />

                    <Route path="/schedule" element={<SchedulePage />} />
                    <Route path="/report" element={<ReportPage />} />
                    <Route path="/track" element={<TrackPage />} />
                    <Route path="/waste-guide" element={<WasteGuidePage />} />


                    {/* Admin login (public) */}
                    <Route path="/admin/login" element={<LoginPage />} />

                    {/* Admin routes (protected, nested under shared layout) */}
                    <Route path="/admin" element={<PrivateRoute><AdminLayout /></PrivateRoute>}>
                        <Route path="dashboard" element={<AdminDashboardPage />} />
                        <Route path="schedules" element={<ScheduleManager />} />
                        <Route path="haulers" element={<HaulerManager />} />
                        <Route path="route-stops" element={<RouteStopManager />} />
                        <Route path="waste-items" element={<WasteItemManager />} />
                        <Route path="analytics" element={<AdminAnalyticsPage />} />
                    </Route>

                    {/* Fallback */}
                    <Route path="*" element={<HomePage />} />
                </Routes>
            </main>

            <Footer />
        </div>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Shell />
            </BrowserRouter>
        </AuthProvider>
    );
}
