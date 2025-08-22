import { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import KanbanBoard from '../components/KanbanBoard';
import { FaPlus, FaSearch } from 'react-icons/fa';

type Lead = {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  status: 'New' | 'Contacted' | 'Site Visit' | 'Closed';
  assignedTo?: string;
  propertyId?: string;
};

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [properties, setProperties] = useState<Array<{ _id: string; name: string }>>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/leads'),
      api.get('/properties')
    ])
      .then(([leadsRes, propertiesRes]) => {
        setLeads(leadsRes.data as Lead[]);
        setFilteredLeads(leadsRes.data as Lead[]);
        setProperties((propertiesRes.data as Array<{ _id: string; name: string }>) || []);
        setLoading(false);
      })
      .catch(() => {
        setLeads([]);
        setFilteredLeads([]);
        setProperties([]);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredLeads(leads);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredLeads(
        leads.filter(
          (lead) =>
            lead.name.toLowerCase().includes(term) ||
            (lead.email && lead.email.toLowerCase().includes(term)) ||
            (lead.phone && lead.phone.includes(term))
        )
      );
    }
  }, [searchTerm, leads]);

  const onMove = async (id: string, status: Lead['status']) => {
    try {
      const { data } = await api.put(`/leads/${id}`, { status });
      setLeads((prev) => prev.map((l) => (l._id === id ? data as Lead : l)));
    } catch (error) {
      console.error('Failed to update lead status', error);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/leads', { name, email, phone, propertyId });
      setLeads((prev) => [data as Lead, ...prev]);
      setName(''); setEmail(''); setPhone(''); setPropertyId('');
      setShowForm(false);
    } catch (error) {
      console.error('Failed to add lead', error);
    }
  };

  const propertyOptions = useMemo(() => properties.map((p) => ({ id: p._id, name: p.name })), [properties]);

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Leads Management</h1>
          <p className="text-gray-500 mt-1">Track and manage your sales pipeline</p>
        </div>
        
        <div className="flex gap-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search leads..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
            />
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200"
          >
            <FaPlus />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {showForm && (
        <div className="mb-6 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="font-semibold text-gray-800">Add New Lead</h2>
            <button 
              onClick={() => setShowForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          <form onSubmit={handleAdd} className="p-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input 
                id="name"
                value={name} 
                onChange={(e)=>setName(e.target.value)} 
                placeholder="Lead name" 
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                required 
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                id="email"
                type="email"
                value={email} 
                onChange={(e)=>setEmail(e.target.value)} 
                placeholder="Email address" 
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input 
                id="phone"
                value={phone} 
                onChange={(e)=>setPhone(e.target.value)} 
                placeholder="Phone number" 
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              />
            </div>
            <div>
              <label htmlFor="property" className="block text-sm font-medium text-gray-700 mb-1">Property</label>
              <select 
                id="property"
                value={propertyId} 
                onChange={(e)=>setPropertyId(e.target.value)} 
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select property</option>
                {propertyOptions.map((p)=> <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
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
                Save Lead
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <KanbanBoard leads={filteredLeads} onMove={onMove} />
      )}
    </div>
  );
}


