import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

/**
 * Authenticated application shell: fixed sidebar, top navbar and the routed page.
 */
const AppShell = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-main">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="app-content">
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>Student–College HTTP Communication &amp; Examination System</span>
          <span>Academic mini project · React · Express · MongoDB</span>
        </footer>
      </div>
    </div>
  );
};

export default AppShell;
