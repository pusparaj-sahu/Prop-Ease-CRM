import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Building2, DollarSign, CheckSquare } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import Card from '../components/ui/Card';
import api from '../api/axios';

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('6months');
  const [monthlyDataState, setMonthlyDataState] = useState<Array<{
    month: string;
    occupancy: number;
    revenue: number;
    tasks: number;
    maintenance: number;
  }>>([]);
  const [propertyPerformanceState, setPropertyPerformanceState] = useState<Array<{
    property: string;
    occupancy: number;
    revenue: number;
    rating: number;
  }>>([]);
  const [revenueBreakdownState, setRevenueBreakdownState] = useState<Array<{
    category: string;
    amount: number;
    percentage: number;
  }>>([]);
  const [metrics, setMetrics] = useState({
    averageOccupancy: 0,
    monthlyRevenue: 0,
    taskCompletion: 0,
    propertyCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        const [propertiesRes, tenantsRes, tasksRes, transactionsRes] = await Promise.all([
          api.get('/properties'),
          api.get('/tenants'),
          api.get('/tasks'),
          api.get('/transactions')
        ]);

        const propertiesData = propertiesRes.data as Array<{ _id: string; name: string; status: string; rent: number; createdAt: string }>;
        const tenantsData = tenantsRes.data as Array<{ _id: string; name: string; propertyId: string; rentAmount: number; createdAt: string }>;
        const tasksData = tasksRes.data as Array<{ _id: string; status: string; priority: string; category: string; createdAt: string }>;
        const transactionsData = transactionsRes.data as Array<{ _id: string; amount: number; type: string; category?: string; date: string; propertyId: string }>;

        // Calculate metrics
        const totalProperties = propertiesData.length;
        const rentedProperties = propertiesData.filter((p) => p.status === 'Rented').length;
        const averageOccupancy = totalProperties > 0 ? Math.round((rentedProperties / totalProperties) * 100) : 0;
        
        const monthlyRevenue = transactionsData
          .filter((t) => t.type === 'Income')
          .reduce((sum: number, t) => sum + t.amount, 0);
        
        const completedTasks = tasksData.filter((t) => t.status === 'Completed').length;
        const taskCompletion = tasksData.length > 0 ? Math.round((completedTasks / tasksData.length) * 100) : 0;

        setMetrics({
          averageOccupancy,
          monthlyRevenue,
          taskCompletion,
          propertyCount: totalProperties
        });

        // Generate monthly data
        const generateMonthlyData = () => {
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
          const currentMonth = new Date().getMonth();
          
          return months.slice(0, currentMonth + 1).map((month, index) => {
            const monthProperties = propertiesData.filter((p) => {
              const propertyDate = new Date(p.createdAt);
              return propertyDate.getMonth() === index;
            });
            
            const monthTenants = tenantsData.filter((t) => {
              const tenantDate = new Date(t.createdAt);
              return tenantDate.getMonth() === index;
            });
            
            const monthTasks = tasksData.filter((t) => {
              const taskDate = new Date(t.createdAt);
              return taskDate.getMonth() === index;
            });
            
            const monthTransactions = transactionsData.filter((t) => {
              const transactionDate = new Date(t.date);
              return transactionDate.getMonth() === index;
            });
            
            const monthRevenue = monthTransactions
              .filter((t) => t.type === 'Income')
              .reduce((sum: number, t) => sum + t.amount, 0);
            
            return {
              month,
              occupancy: monthProperties.length > 0 ? Math.round((monthTenants.length / monthProperties.length) * 100) : 0,
              revenue: monthRevenue,
              tasks: monthTasks.length,
              maintenance: monthTasks.filter((t) => t.category === 'Maintenance').length
            };
          });
        };

        // Generate property performance data
        const generatePropertyPerformance = () => {
          return propertiesData.map((property) => {
            const propertyTenants = tenantsData.filter((t) => t.propertyId === property._id);
            const occupancy = propertyTenants.length > 0 ? 100 : 0;
            const revenue = transactionsData
              .filter((t) => t.propertyId === property._id && t.type === 'Income')
              .reduce((sum: number, t) => sum + t.amount, 0);
            
            return {
              property: property.name || 'Unknown',
              occupancy,
              revenue,
              rating: 4.0 + Math.random() * 1.0 // Mock rating for now
            };
          });
        };

        // Generate revenue breakdown
        const generateRevenueBreakdown = () => {
          const categoryTotals: { [key: string]: number } = {};
          transactionsData
            .filter((t) => t.type === 'Income')
            .forEach((transaction) => {
              const category = transaction.category || 'Other';
              categoryTotals[category] = (categoryTotals[category] || 0) + transaction.amount;
            });
          
          const totalRevenue = Object.values(categoryTotals).reduce((sum: number, amount: number) => sum + amount, 0);
          
          return Object.entries(categoryTotals).map(([category, amount]) => ({
            category,
            amount,
            percentage: totalRevenue > 0 ? Math.round((amount / totalRevenue) * 100) : 0
          }));
        };

        setMonthlyDataState(generateMonthlyData());
        setPropertyPerformanceState(generatePropertyPerformance());
        setRevenueBreakdownState(generateRevenueBreakdown());
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch analytics data:', error);
        setMetrics({
          averageOccupancy: 0,
          monthlyRevenue: 0,
          taskCompletion: 0,
          propertyCount: 0
        });
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-600">Comprehensive insights into your property management performance</p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics - Responsive Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Average Occupancy', value: `${metrics.averageOccupancy}%`, icon: Users, trend: '+2.5%' },
          { label: 'Monthly Revenue', value: `$${metrics.monthlyRevenue.toLocaleString()}`, icon: DollarSign, trend: '+8.2%' },
          { label: 'Task Completion', value: `${metrics.taskCompletion}%`, icon: CheckSquare, trend: '+5.1%' },
          { label: 'Properties', value: metrics.propertyCount.toString(), icon: Building2, trend: '+0%' },
        ].map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">{metric.label}</p>
                    <p className="text-2xl font-bold text-slate-900">{metric.value}</p>
                    <p className="text-sm text-green-600 flex items-center mt-1">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      {metric.trend}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row 1 - Occupancy Trend */}
      <div className="mt-8">
        <Card title="Occupancy Rate Trend">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyDataState}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" stroke="#64748B" />
              <YAxis stroke="#64748B" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line type="monotone" dataKey="occupancy" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Charts Row 2 - Property Performance */}
      <div className="mt-8">
        <Card title="Property Performance Comparison">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={propertyPerformanceState}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="property" stroke="#64748B" />
              <YAxis stroke="#64748B" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="occupancy" fill="#3B82F6" name="Occupancy %" />
              <Bar dataKey="rating" fill="#10B981" name="Rating" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Charts Row 3 - Responsive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Maintenance vs Tasks */}
        <Card title="Maintenance vs Task Completion">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyDataState}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" stroke="#64748B" />
              <YAxis stroke="#64748B" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="tasks" fill="#8B5CF6" name="Tasks Completed" />
              <Bar dataKey="maintenance" fill="#F59E0B" name="Maintenance Issues" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Revenue Breakdown - Dedicated Card */}
        <Card title="Revenue Breakdown">
          <div className="space-y-4">
            {revenueBreakdownState.map((item) => (
              <div key={item.category} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                  <span className="text-sm font-medium text-slate-700">{item.category}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-slate-600">${item.amount.toLocaleString()}</span>
                  <span className="text-sm text-slate-500">{item.percentage}%</span>
                </div>
              </div>
            ))}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">Total Revenue</span>
                <span className="font-semibold text-slate-900">${revenueBreakdownState.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Key Insights - Dedicated Card */}
      <Card title="Key Insights">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-slate-900 mb-3">Positive Trends</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Occupancy rate increased by 2.5% this quarter
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Revenue growth of 8.2% compared to last quarter
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Task completion rate improved to 87%
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-3">Areas for Improvement</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                City Center property has lower occupancy (78%)
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                Maintenance response time could be improved
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                Consider increasing rent for high-demand properties
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
