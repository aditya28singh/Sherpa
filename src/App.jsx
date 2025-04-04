import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/auth/login'; 
import { MentorDashboard } from './components/admin/adminIndex';
import { MentorLayout } from './components/mentor/mentorIndex';
import { StudentLayout } from './components/student/studentIndex';
// import SelectRole from './components/common/SelectRole'; 
import { NotFound } from './components/notfound';

const RequireAuth = ({ children }) => {
  const [auth, setAuth] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const authData = JSON.parse(localStorage.getItem('authData'));
    setAuth(authData);
    setLoading(false);
  }, []);
  
  if (loading) return <div>Loading...</div>;
  if (!auth?.authenticated) return <Navigate to="/login" replace />;
  
  return children;
};

const RoleRoute = ({ allowedRoles, children }) => {
  const auth = JSON.parse(localStorage.getItem('authData'));
  
  if (!auth) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(auth.role)) {
    return auth.role === 'admin' ? <Navigate to="/admin" replace /> :
           auth.role === 'mentor' ? <Navigate to="/mentor" replace /> :
           auth.role === 'student' ? <Navigate to="/student" replace /> :
           <Navigate to="/select-role" replace />;
  }
  
  return children;
};
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/admin" element={
          <RequireAuth>
            <RoleRoute allowedRoles={['admin']}>
              <MentorDashboard />
            </RoleRoute>
          </RequireAuth>
        } />
        
        <Route path="/mentor" element={
          <RequireAuth>
            <RoleRoute allowedRoles={['mentor']}>
              <MentorLayout />
            </RoleRoute>
          </RequireAuth>
        } />
        
        <Route path="/student" element={
          <RequireAuth>
            <RoleRoute allowedRoles={['student']}>
              <StudentLayout />
            </RoleRoute>
          </RequireAuth>
        } />
        
        {/* <Route path="/select-role" element={
          <RequireAuth>
            <SelectRole />
          </RequireAuth>
        } /> */}
        
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
