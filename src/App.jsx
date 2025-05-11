import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';
import Home from './components/User/Home/Home.jsx';
import Login from './components/Login/Login.jsx';
import Register from './components/Register/Register.jsx';
import Chat from './components/User/Chat/Chat.jsx';
import Feedback from './components/User/Feedback/Feedback.jsx';
import Profile from './components/Profile/Profile.jsx';
import AdminDashboard from './components/Admin/Admin-Dashboard/AdminDashboard.jsx';
import ManageUser from './components/Admin/Manage-User/ManageUser.jsx';
import ViewFeedback from './components/Admin/View-Feedback/ViewFeedback.jsx';
import ViewResources from './components/Admin/View-Resources/ViewResources.jsx';
import AddResources from './components/Admin/Add-resources/AddResources.jsx';
import UpdatePassword from './components/UpdatePassword.jsx';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* User protected routes */}
          <Route path="/chat" element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          } />
          <Route path="/feedback" element={
            <ProtectedRoute>
              <Feedback />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          
          {/* Admin protected routes */}
          <Route path="/admin-dashboard" element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/manage-user" element={
            <ProtectedRoute adminOnly>
              <ManageUser />
            </ProtectedRoute>
          } />
          <Route path="/view-feedback" element={
            <ProtectedRoute adminOnly>
              <ViewFeedback />
            </ProtectedRoute>
          } />
          <Route path="/view-resources" element={
            <ProtectedRoute adminOnly>
              <ViewResources />
            </ProtectedRoute>
          } />
          <Route path="/add-resources" element={
            <ProtectedRoute adminOnly>
              <AddResources />
            </ProtectedRoute>
          } />
          
          <Route path="/update-password" element={<UpdatePassword />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;