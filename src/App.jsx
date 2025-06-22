import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import Home from "./components/Home/Home.jsx";
import Login from "./components/Login/Login.jsx";
import Register from "./components/User/Register/Register.jsx";
import Chat from "./components/User/Chat/Chat.jsx";
import Feedback from "./components/User/Feedback/Feedback.jsx";
import Profile from "./components/User/Profile/Profile.jsx";
import CompleteProfile from "./components/Common/CompleteProfile/CompleteProfile.jsx";
import AdminDashboard from "./components/Admin/AdminDashboard/AdminDashboard.jsx";
import ManageUser from "./components/Admin/ManageUser/ManageUser.jsx";
import ViewFeedback from "./components/Admin/ViewFeedback/ViewFeedback.jsx";
import ViewResources from "./components/Admin/ViewResources/ViewResources.jsx";
import UpdatePassword from "./components/Common/UpdatePassword.jsx";
import InviteAdmin from "./components/Admin/InviteAdmin/inviteAdmin.jsx";
import ServerDown from "./components/Common/ErrorPage/ServerDownPage.jsx";
import NotFound from "./components/Common/ErrorPage/NotFoundPage.jsx";
import UnauthorizedPage from "./components/Common/ErrorPage/UnauthorizedAccessPage.jsx";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/update-password" element={<UpdatePassword />} />

          {/* Student routes */}
          <Route
            path="/chat"
            element={
              <ProtectedRoute studentOnly>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/feedback"
            element={
              <ProtectedRoute studentOnly>
                <Feedback />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute studentOnly>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/invite-admin"
            element={
              <ProtectedRoute adminOnly>
                <InviteAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/complete-profile"
            element={
              <ProtectedRoute adminOnly>
                <CompleteProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-user"
            element={
              <ProtectedRoute adminOnly>
                <ManageUser />
              </ProtectedRoute>
            }
          />
          <Route
            path="/view-feedback"
            element={
              <ProtectedRoute adminOnly>
                <ViewFeedback />
              </ProtectedRoute>
            }
          />
          <Route
            path="/view-resources"
            element={
              <ProtectedRoute>
                <ViewResources />
              </ProtectedRoute>
            }
          />
          <Route path="/503-server-down" element={<ServerDown />} />
          <Route path="/401-unauthorized" element={<UnauthorizedPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
