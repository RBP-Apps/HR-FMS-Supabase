import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Indent from "./pages/Indent";
import FindEnquiry from "./pages/FindEnquiry";
import CallTracker from "./pages/CallTracker";
import AfterJoiningWork from "./pages/AfterJoiningWork";
import AfterResignatyionWork from "./pages/AfterResignationWork";
import Employee from "./pages/Employee";
import ProtectedRoute from "./components/ProtectedRoute";
import LeaveManagement from "./pages/LeaveManagement";
import Attendancedaily from "./pages/Attendancedaily";
import Report from "./pages/Report";
import Payroll from "./pages/Payroll";
import Joining from "./pages/Joining";
import ResignationApproval from "./pages/ResignationApproval";
import AddUsers from "./pages/AddUsers";
import Master from "./pages/Master";
import OfferLetter from "./pages/OfferLetter";

import AfterPayment from "./pages/AfterPayment";
import BirthdayWish from "./pages/BirthdayWish";

import AttendancedailyManagement from "./pages/AttendancedailyManagement";


function App() {
  return (
    <div className="gradient-bg min-h-screen">
      <Router>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="indent" element={<Indent />} />
            <Route path="find-enquiry" element={<FindEnquiry />} />
            <Route path="call-tracker" element={<CallTracker />} />
            <Route path="joining" element={<Joining />} />
            <Route path="offer-letter" element={<OfferLetter />} />
            <Route path="after-payment" element={<AfterPayment />} />
            <Route path="birthday-wish" element={<BirthdayWish />} />
            <Route path="after-joining-work" element={<AfterJoiningWork />} />
            <Route path="after-resignation-work" element={<AfterResignatyionWork />} />
            <Route path="employee" element={<Employee />} />
            <Route path="leave-management" element={<LeaveManagement />} />
            <Route path="attendancedaily" element={<Attendancedaily />} />
            <Route path="report" element={<Report />} />
            <Route path="payroll" element={<Payroll />} />
            <Route path="resignation_approval" element={<ResignationApproval />} />
            <Route path="add_users" element={<AddUsers />} />
            <Route path="master_hr" element={<Master />} />
            <Route path="attendancedaily_management" element={<AttendancedailyManagement />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
