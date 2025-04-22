import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';
import Home from './components/User/Home/Home.jsx';
import Login from './components/User/Login/Login.jsx';
import Register from './components/User/Register/Register.jsx';
import Chat from './components/User/Chat/Chat.jsx';
import Feedback from './components/User/Feedback/Feedback.jsx';
import Profile from './components/Profile/Profile.jsx';
import AdminDashboard from './components/Admin/Admin-Dashboard/AdminDashboard.jsx';
import ManageUser from './components/Admin/Manage-User/ManageUser.jsx';
import ViewFeedback from './components/Admin/View-Feedback/ViewFeedback.jsx';
import ViewResources from './components/Admin/View-Resources/ViewResources.jsx';
import AddResources from './components/Admin/Add-resources/AddResources.jsx';
// Import other components...

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/feedback" element={ <Feedback /> } />
          <Route path="/profile" element={ <Profile /> } />
          <Route path="/admin-dashboard" element={ <AdminDashboard /> } />
          <Route path="/manage-user" element={ <ManageUser /> } />
          <Route path="/view-feedback" element={ <ViewFeedback /> } />
          <Route path="/view-resources" element={ <ViewResources /> } />
          <Route path="/add-resources" element={ <AddResources /> } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;