import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';

// Import pages
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import Tenants from './pages/Tenants';
import Owners from './pages/Owners';
import Finance from './pages/Finance';
import Tasks from './pages/Tasks';
import Support from './pages/Support';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
// import Leads from './pages/Leads'; // Commented out for future use

function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/tenants" element={<Tenants />} />
        <Route path="/owners" element={<Owners />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/support" element={<Support />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Settings />} />
        {/* <Route path="/leads" element={<Leads />} /> */}
      </Routes>
    </AppLayout>
  );
}

export default App;
