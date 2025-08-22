import { useEffect, useMemo, useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import api from '../api/axios';

type Payment = {
  _id: string;
  tenantId: string;
  propertyId: string;
  amount: number;
  dueDate: string;
  status: 'Pending' | 'Paid';
};

type Tenant = {
  _id: string;
  name: string;
};

type Property = {
  _id: string;
  name: string;
};

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [form, setForm] = useState({ tenantId: '', propertyId: '', amount: '', dueDate: '' });
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/payments').then((r) => setPayments(r.data as Payment[])).catch(() => setPayments([])),
      api.get('/tenants').then((r) => setTenants(r.data as Tenant[])).catch(() => setTenants([])),
      api.get('/properties').then((r) => setProperties(r.data as Property[])).catch(() => setProperties([]))
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = payments;
    
    // Apply status filter
    if (statusFilter === 'pending') {
      result = result.filter(payment => payment.status === 'Pending');
    } else if (statusFilter === 'paid') {
      result = result.filter(payment => payment.status === 'Paid');
    }
    
    // Apply search filter
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(payment => {
        const tenant = tenantMap[payment.tenantId] || '';
        const property = propertyMap[payment.propertyId] || '';
        return (
          tenant.toLowerCase().includes(term) ||
          property.toLowerCase().includes(term) ||
          payment.amount.toString().includes(term)
        );
      });
    }
    
    setFilteredPayments(result);
  }, [payments, statusFilter, searchTerm]);

  const addPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, amount: Number(form.amount) } as Omit<Payment, '_id'>;
    const { data } = await api.post('/payments', payload);
    setPayments((prev) => [data as Payment, ...prev]);
    setForm({ tenantId: '', propertyId: '', amount: '', dueDate: '' });
    setShowForm(false);
  };

  const markPaid = async (id: string) => {
    const { data } = await api.put(`/payments/${id}`, { status: 'Paid' });
    setPayments((prev) => prev.map((p) => (p._id === id ? data as Payment : p)));
  };

  const remove = async (id: string) => {
    await api.delete(`/payments/${id}`);
    setPayments((prev) => prev.filter((p) => p._id !== id));
  };

  const tenantMap = useMemo(() => Object.fromEntries(tenants.map((t: Tenant) => [t._id, t.name])), [tenants]);
  const propertyMap = useMemo(() => Object.fromEntries(properties.map((p: Property) => [p._id, p.name])), [properties]);

  const isPastDue = (date: string) => {
    return new Date(date) < new Date(new Date().setHours(0, 0, 0, 0));
  };

  const totalPending = useMemo(() => {
    return payments
      .filter(p => p.status === 'Pending')
      .reduce((sum, payment) => sum + payment.amount, 0);
  }, [payments]);

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Payments</h1>
          <p className="text-gray-500 mt-1">Manage tenant payments and track dues</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200"
          >
            Add Payment
          </button>
        </div>
      </div>

      {showForm && (
        <div className="mb-6 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="font-semibold text-gray-800">Add New Payment</h2>
            <button 
              onClick={() => setShowForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          <form onSubmit={addPayment} className="p-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="tenant" className="block text-sm font-medium text-gray-700 mb-1">Tenant *</label>
              <select 
                id="tenant"
                value={form.tenantId} 
                onChange={(e)=>setForm({...form, tenantId: e.target.value})} 
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                required
              >
                <option value="">Select Tenant</option>
                {tenants.map((t: Tenant)=> <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="property" className="block text-sm font-medium text-gray-700 mb-1">Property *</label>
              <select 
                id="property"
                value={form.propertyId} 
                onChange={(e)=>setForm({...form, propertyId: e.target.value})} 
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                required
              >
                <option value="">Select Property</option>
                {properties.map((p: Property)=> <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
              <input 
                id="amount"
                type="number"
                value={form.amount} 
                onChange={(e)=>setForm({...form, amount: e.target.value})} 
                placeholder="Amount" 
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                required 
              />
            </div>
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
              <input 
                id="dueDate"
                type="date" 
                value={form.dueDate} 
                onChange={(e)=>setForm({...form, dueDate: e.target.value})} 
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                required 
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
              <button 
                type="button" 
                onClick={() => setShowForm(false)} 
                className="mr-3 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Save Payment
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <FaSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search payments..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full"
          />
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 text-sm font-medium ${statusFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} border border-gray-300 rounded-l-md`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-2 text-sm font-medium ${statusFilter === 'pending' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} border-t border-b border-r border-gray-300`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter('paid')}
              className={`px-4 py-2 text-sm font-medium ${statusFilter === 'paid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} border border-gray-300 rounded-r-md`}
            >
              Paid
            </button>
          </div>
          
          {statusFilter === 'pending' && (
            <div className="text-sm font-medium">
              Total pending: <span className="text-red-600 font-bold">₹{totalPending.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {filteredPayments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchTerm ? 'No payments match your search' : 'No payments found. Add a new payment to get started!'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <tr key={payment._id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{tenantMap[payment.tenantId] || payment.tenantId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{propertyMap[payment.propertyId] || payment.propertyId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">₹{payment.amount.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          {new Date(payment.dueDate).toLocaleDateString()}
                          {isPastDue(payment.dueDate) && payment.status === 'Pending' && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Overdue
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${payment.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {payment.status === 'Pending' && (
                          <button 
                            onClick={() => markPaid(payment._id)} 
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            Mark Paid
                          </button>
                        )}
                        <button 
                          onClick={() => remove(payment._id)} 
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


