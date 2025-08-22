import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import KPIcard from '../components/KPIcard';
import { FaUserFriends, FaTasks, FaMoneyBillWave, FaChartLine, FaBuilding, FaUsers, FaHeadset, FaFileAlt } from 'react-icons/fa';

interface Lead {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  status: 'New' | 'Contacted' | 'Site Visit' | 'Closed';
}

interface Task {
  _id: string;
  title: string;
  status: 'Pending' | 'Completed';
  dueDate?: string;
}

interface Payment {
  _id: string;
  status: 'Pending' | 'Paid';
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [leadCount, setLeadCount] = useState(0);
  const [taskCount, setTaskCount] = useState(0);
  const [pendingPayments, setPendingPayments] = useState(0);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/leads'),
      api.get('/tasks'),
      api.get('/payments'),
    ])
      .then(([leads, tasks, payments]) => {
        const leadsData = leads.data as Lead[];
        const tasksData = tasks.data as Task[];
        const paymentsData = payments.data as Payment[];
        
        setLeadCount(leadsData.length);
        setTaskCount(tasksData.length);
        setPendingPayments(paymentsData.filter((p: Payment) => p.status === 'Pending').length);
        
        // Get recent leads and tasks
        setRecentLeads(leadsData.slice(0, 5));
        setRecentTasks(tasksData.slice(0, 5));
        setLoading(false);
      })
      .catch(() => {
        setLeadCount(0);
        setTaskCount(0);
        setPendingPayments(0);
        setRecentLeads([]);
        setRecentTasks([]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome to PropEase CRM. Here's an overview of your business.</p>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <KPIcard 
              title="Total Leads" 
              value={leadCount} 
              icon={<FaUserFriends size={24} />}
              trend="up"
              trendValue="12% from last month"
            />
            <KPIcard 
              title="Tasks" 
              value={taskCount} 
              icon={<FaTasks size={24} />}
              trend="neutral"
              trendValue="Same as last month"
            />
            <KPIcard 
              title="Pending Payments" 
              value={pendingPayments} 
              icon={<FaMoneyBillWave size={24} />}
              trend={pendingPayments > 5 ? "down" : "up"}
              trendValue={pendingPayments > 5 ? "5% more than last month" : "10% less than last month"}
            />
            <KPIcard 
              title="Conversion Rate" 
              value={`${leadCount > 0 ? Math.round((recentLeads.filter(l => l.status === 'Closed').length / leadCount) * 100) : 0}%`} 
              icon={<FaChartLine size={24} />}
              trend="up"
              trendValue="5% from last month"
            />
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
              <button
                onClick={() => navigate('/properties')}
                className="flex flex-col items-center p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:bg-blue-50"
              >
                <FaBuilding className="w-6 h-6 text-blue-600 mb-2" />
                <span className="text-sm font-medium text-gray-700">Properties</span>
              </button>
              
              <button
                onClick={() => navigate('/tenants')}
                className="flex flex-col items-center p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:bg-green-50"
              >
                <FaUsers className="w-6 h-6 text-green-600 mb-2" />
                <span className="text-sm font-medium text-gray-700">Tenants</span>
              </button>
              
              <button
                onClick={() => navigate('/owners')}
                className="flex flex-col items-center p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:bg-purple-50"
              >
                <FaUserFriends className="w-6 h-6 text-purple-600 mb-2" />
                <span className="text-sm font-medium text-gray-700">Owners</span>
              </button>
              
              {/* <button
                onClick={() => navigate('/leads')}
                className="flex flex-col items-center p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:bg-orange-50"
              >
                <FaFileAlt className="w-6 h-6 text-orange-600 mb-2" />
                <span className="text-sm font-medium text-gray-700">Leads</span>
              </button> */}
              
              <button
                onClick={() => navigate('/tasks')}
                className="flex flex-col items-center p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:bg-yellow-50"
              >
                <FaTasks className="w-6 h-6 text-yellow-600 mb-2" />
                <span className="text-sm font-medium text-gray-700">Tasks</span>
              </button>
              
              <button
                onClick={() => navigate('/support')}
                className="flex flex-col items-center p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:bg-red-50"
              >
                <FaHeadset className="w-6 h-6 text-red-600 mb-2" />
                <span className="text-sm font-medium text-gray-700">Support</span>
              </button>
              
              <button
                onClick={() => navigate('/finance')}
                className="flex flex-col items-center p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:bg-emerald-50"
              >
                <FaMoneyBillWave className="w-6 h-6 text-emerald-600 mb-2" />
                <span className="text-sm font-medium text-gray-700">Finance</span>
              </button>
              
              <button
                onClick={() => navigate('/analytics')}
                className="flex flex-col items-center p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:bg-indigo-50"
              >
                <FaChartLine className="w-6 h-6 text-indigo-600 mb-2" />
                <span className="text-sm font-medium text-gray-700">Analytics</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Leads */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="font-semibold text-gray-800">Recent Leads</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {recentLeads.length > 0 ? (
                  recentLeads.map((lead) => (
                    <div key={lead._id} className="px-6 py-4 flex justify-between items-center">
                      <div>
                        <div className="font-medium">{lead.name}</div>
                        <div className="text-sm text-gray-500">{lead.email || lead.phone || 'No contact'}</div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        lead.status === 'New' ? 'bg-blue-100 text-blue-800' :
                        lead.status === 'Contacted' ? 'bg-yellow-100 text-yellow-800' :
                        lead.status === 'Site Visit' ? 'bg-purple-100 text-purple-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {lead.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-4 text-gray-500 text-center">No recent leads</div>
                )}
              </div>
            </div>

            {/* Recent Tasks */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="font-semibold text-gray-800">Recent Tasks</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {recentTasks.length > 0 ? (
                  recentTasks.map((task) => (
                    <div key={task._id} className="px-6 py-4 flex justify-between items-center">
                      <div>
                        <div className="font-medium">{task.title}</div>
                        {task.dueDate && (
                          <div className="text-sm text-gray-500">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        task.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-4 text-gray-500 text-center">No recent tasks</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}


