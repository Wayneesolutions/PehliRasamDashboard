import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import Loader from "../components/layout/Loader";
import Layout from "../components/layout/Layout";
import ProtectedRoute from "./ProtectedRoute"; // <- make sure this import is correct

const Submission = lazy(() => import("../pages/clientsForm/index"));
const Suggestions = lazy(() => import("../pages/clientsForm/Suggestions"));
const Login = lazy(() => import("../pages/auth/Login"));

const ProfileInfo = lazy(() => import("../pages/profile-setting"));
const Overview = lazy(() => import("../pages/overview"));
const TimelineMain = lazy(() => import("../pages/overview/TimelineMain"));
const ProfileUpdate = lazy(() => import("../pages/overview/ProfileUpdate"));
const Clients = lazy(() => import("../pages/clients"));
const AddClient = lazy(() => import("../pages/clients/AddClient"));
const Form = lazy(() => import("../pages/clients/Form"));
const Timeline = lazy(() => import("../pages/clients/timeline"));
const Matches = lazy(() => import("../pages/clients/matches"));
const Photos = lazy(() => import("../pages/clients/photos"));
const Events = lazy(() => import("../pages/clients/events"));
const Communication = lazy(() => import("../pages/clients/communication"));

const Inbox = lazy(() => import("../pages/communication/Inbox"));
const Sent = lazy(() => import("../pages/communication/Sent"));

const Fields = lazy(() => import("../pages/settings/client-settings/Fields/Fields"));
const Lists = lazy(() => import('../pages/settings/client-settings/List'));
const Matching = lazy(() => import('../pages/settings/client-settings/matching/Fields'));
const Users = lazy(() => import('../pages/settings/users'));

const AppRoutes = () => {
    return (
        <Suspense fallback={<Loader />}>
            <Routes>
                {/* Public Routes */}
                <Route path="/submission" element={<Submission />} />
                <Route path="/suggestions" element={<Suggestions />} />
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Navigate to="/dashboard/overview" />} />

                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<Layout />}>
                        <Route index element={<Overview />} />
                        <Route path="overview" element={<Overview />} />
                        <Route path="timelinemain" element={<TimelineMain />} />
                        <Route path="profile-update" element={<ProfileUpdate />} />
                        <Route path="clients" element={<Clients />} />

                        <Route path="add-client" element={<AddClient />}>
                            <Route index element={<Form />} />
                            <Route path="form" element={<Form />} />
                            <Route path="timeline" element={<Timeline />} />
                            <Route path="matching" element={<Matches />} />
                            <Route path="photos" element={<Photos />} />
                            <Route path="events" element={<Events />} />
                            <Route path="communication" element={<Communication />} />
                        </Route>

                        <Route path="inbox" element={<Inbox />} />
                        <Route path="sent" element={<Sent />} />
                        <Route path="fields" element={<Fields />} />
                        <Route path="lists" element={<Lists />} />
                        <Route path="matching" element={<Matching />} />
                        <Route path="users" element={<Users />} />
                        <Route path="profile-setting-info" element={<ProfileInfo />} />
                    </Route>
                </Route>
            </Routes>
        </Suspense>
    );
};

export default AppRoutes;
