import { Outlet } from 'react-router-dom';


export const AdminLayout = () => (
    <div>
      <h2>Admin Panel</h2>
      <Outlet />
    </div>
  );