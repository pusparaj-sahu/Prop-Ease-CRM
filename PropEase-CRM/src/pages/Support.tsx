import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Mail, Phone, Building, Eye, Edit, Trash } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import api from '../api/axios';

interface Ticket {
  _id: string;
  title: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  category: 'Maintenance' | 'HVAC' | 'Plumbing' | 'Electrical' | 'Parking' | 'Security' | 'Noise' | 'Other';
  createdAt: string;
  updatedAt: string;
  tenantId?: string;
  propertyId?: string;
}

interface Tenant {
  _id: string;
  name: string;
}

export default function Support() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'Medium' as Ticket['priority'],
    category: '',
    tenantId: '',
    propertyId: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ticketsRes, tenantsRes] = await Promise.all([
          api.get('/support'),
          api.get('/tenants')
        ]);
        
        // Handle both array and paginated response formats
        const ticketsData = Array.isArray(ticketsRes.data) 
          ? ticketsRes.data 
          : (ticketsRes.data as any).tickets || [];
        const tenantsData = Array.isArray(tenantsRes.data) 
          ? tenantsRes.data 
          : (tenantsRes.data as any).tenants || [];
        
        setTickets(ticketsData as Ticket[]);
        setTenants(tenantsData as Tenant[]);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setTickets([]);
        setTenants([]);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [tickets, searchTerm, statusFilter, priorityFilter, categoryFilter]);

  const filterTickets = () => {
    let filtered = tickets;

    if (searchTerm) {
      filtered = filtered.filter(ticket =>
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.category === categoryFilter);
    }

    setFilteredTickets(filtered);
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Prepare the data to send, excluding empty tenantId and propertyId
      const ticketData = {
        title: form.title,
        description: form.description,
        priority: form.priority,
        category: form.category,
        ...(form.tenantId && { tenantId: form.tenantId }),
        ...(form.propertyId && { propertyId: form.propertyId })
      };
      
      const response = await api.post('/support', ticketData);
      setTickets(prev => [response.data as Ticket, ...prev]);
      setForm({
        title: '',
        description: '',
        priority: 'Medium',
        category: '',
        tenantId: '',
        propertyId: ''
      });
      setShowForm(false);
      alert('Ticket created successfully!');
    } catch (error) {
      console.error('Failed to create ticket:', error);
      alert('Failed to create ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    
    setIsSubmitting(true);
    try {
      // Prepare the data to send, excluding empty tenantId and propertyId
      const ticketData = {
        title: form.title,
        description: form.description,
        priority: form.priority,
        category: form.category,
        ...(form.tenantId && { tenantId: form.tenantId }),
        ...(form.propertyId && { propertyId: form.propertyId })
      };
      
      const response = await api.put(`/support/${selectedTicket._id}`, ticketData);
      setTickets(prev => prev.map(ticket => 
        ticket._id === selectedTicket._id ? response.data as Ticket : ticket
      ));
      setShowEditModal(false);
      setSelectedTicket(null);
      setForm({
        title: '',
        description: '',
        priority: 'Medium',
        category: '',
        tenantId: '',
        propertyId: ''
      });
      alert('Ticket updated successfully!');
    } catch (error) {
      console.error('Failed to update ticket:', error);
      alert('Failed to update ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleView = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowViewModal(true);
  };

  const handleEdit = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setForm({
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      category: ticket.category,
      tenantId: ticket.tenantId || '',
      propertyId: ticket.propertyId || ''
    });
    setShowEditModal(true);
  };

  const handleDelete = async (ticket: Ticket) => {
    if (window.confirm(`Are you sure you want to delete this ticket: ${ticket.title}?`)) {
      try {
        await api.delete(`/support/${ticket._id}`);
        setTickets(prev => prev.filter(t => t._id !== ticket._id));
      } catch (error) {
        console.error('Failed to delete ticket:', error);
      }
    }
  };

  const updateTicketStatus = async (id: string, status: Ticket['status']) => {
    try {
      const response = await api.put(`/support/${id}`, { status });
      setTickets(prev => prev.map(ticket => 
        ticket._id === id ? response.data as Ticket : ticket
      ));
    } catch (error) {
      console.error('Failed to update ticket:', error);
    }
  };

  const getStatusColor = (status: Ticket['status']) => {
    switch (status) {
      case 'Open': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Resolved': return 'bg-green-100 text-green-800';
      case 'Closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: Ticket['priority']) => {
    switch (priority) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTenantName = (tenantId: string) => {
    const tenant = tenants.find(t => t._id === tenantId);
    return tenant ? tenant.name : 'Unknown';
  };



  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Support Tickets</h1>
        <p className="text-gray-600">Manage and track support requests from tenants and property managers</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
              <Mail className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{tickets.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600">
              <Filter className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Open Tickets</p>
              <p className="text-2xl font-bold text-gray-900">
                {tickets.filter(t => t.status === 'Open').length}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100 text-green-600">
              <Phone className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">
                {tickets.filter(t => t.status === 'In Progress').length}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-gray-100 text-gray-600">
              <Building className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-gray-900">
                {tickets.filter(t => t.status === 'Resolved').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex gap-4 w-full sm:w-auto">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Ticket
          </button>
        </div>

        <div className="flex gap-4 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Priority</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="Maintenance">Maintenance</option>
            <option value="HVAC">HVAC</option>
            <option value="Plumbing">Plumbing</option>
            <option value="Electrical">Electrical</option>
            <option value="Parking">Parking</option>
            <option value="Security">Security</option>
            <option value="Noise">Noise</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* New Ticket Form */}
      {showForm && (
        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Create New Support Ticket</h2>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as Ticket['priority'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="HVAC">HVAC</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Parking">Parking</option>
                    <option value="Security">Security</option>
                    <option value="Noise">Noise</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tenant (Optional)</label>
                  <select
                    value={form.tenantId}
                    onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Tenant</option>
                    {tenants.map(tenant => (
                      <option key={tenant._id} value={tenant._id}>{tenant.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </Card>
      )}

      {/* Tickets List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTickets.map((ticket) => (
                <tr key={ticket._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{ticket.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{ticket.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{ticket.category}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {ticket.tenantId ? getTenantName(ticket.tenantId) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex space-x-2">
                      {/* Staging Actions */}
                      {ticket.status === 'Open' && (
                        <button
                          onClick={() => updateTicketStatus(ticket._id, 'In Progress')}
                          className="text-blue-600 hover:text-blue-900 text-xs"
                        >
                          Start
                        </button>
                      )}
                      {ticket.status === 'In Progress' && (
                        <button
                          onClick={() => updateTicketStatus(ticket._id, 'Resolved')}
                          className="text-green-600 hover:text-green-900 text-xs"
                        >
                          Resolve
                        </button>
                      )}
                      {ticket.status === 'Resolved' && (
                        <button
                          onClick={() => updateTicketStatus(ticket._id, 'Closed')}
                          className="text-gray-600 hover:text-gray-900 text-xs"
                        >
                          Close
                        </button>
                      )}
                      
                      {/* CRUD Actions */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(ticket)}
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(ticket)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(ticket)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* View Ticket Modal */}
      {selectedTicket && (
        <Modal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedTicket(null);
          }}
          title="Ticket Details"
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <p className="mt-1 text-sm text-gray-900">{selectedTicket.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`mt-1 inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTicket.status)}`}>
                  {selectedTicket.status}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <span className={`mt-1 inline-flex px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                  {selectedTicket.priority}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <p className="mt-1 text-sm text-gray-900">{selectedTicket.category}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <p className="mt-1 text-sm text-gray-900">{selectedTicket.description}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tenant</label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedTicket.tenantId ? getTenantName(selectedTicket.tenantId) : 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Created</label>
                <p className="mt-1 text-sm text-gray-900">{new Date(selectedTicket.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Ticket Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTicket(null);
        }}
        title="Edit Ticket"
        size="lg"
      >
        <form onSubmit={handleUpdateTicket} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as Ticket['priority'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Category</option>
                <option value="Maintenance">Maintenance</option>
                <option value="HVAC">HVAC</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Electrical">Electrical</option>
                <option value="Parking">Parking</option>
                <option value="Security">Security</option>
                <option value="Noise">Noise</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tenant (Optional)</label>
              <select
                value={form.tenantId}
                onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Tenant</option>
                {tenants.map(tenant => (
                  <option key={tenant._id} value={tenant._id}>{tenant.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Ticket'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
