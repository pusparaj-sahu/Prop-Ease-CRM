import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, UserCheck, Building2, DollarSign, Eye, Edit, Trash } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { TextInput } from '../components/ui/FormInput';
import Table from '../components/ui/Table';
import api from '../api/axios';

interface Owner {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  status: 'Active' | 'Inactive' | 'Pending' | 'Suspended';
  totalProperties?: number;
  totalPortfolioValue?: number;
  totalMonthlyIncome?: number;
}

export default function Owners() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [filteredOwners, setFilteredOwners] = useState<Owner[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOwners();
  }, []);

  useEffect(() => {
    filterOwners();
  }, [owners, searchTerm]);

  const fetchOwners = async () => {
    try {
      const response = await api.get('/owners');
      const data = response.data as { owners?: Owner[] } | Owner[];
      if ('owners' in data && data.owners) {
        setOwners(data.owners);
      } else {
        setOwners(data as Owner[]);
      }
    } catch (error) {
      console.error('Failed to fetch owners:', error);
      setOwners([]); // Ensure owners remains an array even on error
    }
  };

  const filterOwners = () => {
    let filtered = owners;

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(owner =>
        owner.name.toLowerCase().includes(term) ||
        owner.email.toLowerCase().includes(term) ||
        owner.phone.toLowerCase().includes(term) ||
        owner.city.toLowerCase().includes(term) ||
        owner.state.toLowerCase().includes(term)
      );
    }

    setFilteredOwners(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedOwner) {
        // Update existing owner
        await api.put(`/owners/${selectedOwner._id}`, formData);
      } else {
        // Create new owner
        await api.post('/owners', formData);
      }

      fetchOwners();
      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedOwner(null);
      resetForm();
    } catch (error) {
      console.error('Failed to save owner:', error);
    }
  };

  const handleEdit = (owner: Owner) => {
    setSelectedOwner(owner);
    setFormData({
      name: owner.name,
      email: owner.email,
      phone: owner.phone,
      address: owner.address,
      city: owner.city,
      state: owner.state,
      zipCode: owner.zipCode,
    });
    setShowEditModal(true);
  };

  const handleView = (owner: Owner) => {
    setSelectedOwner(owner);
  };

  const handleDelete = async (owner: Owner) => {
    if (window.confirm(`Are you sure you want to delete ${owner.name}?`)) {
      try {
        await api.delete(`/owners/${owner._id}`);
        fetchOwners();
      } catch (error) {
        console.error('Failed to delete owner:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
    });
  };

  const columns = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'email', header: 'Email', sortable: true },
    { key: 'phone', header: 'Phone', sortable: true },
    { key: 'city', header: 'City', sortable: true },
    { key: 'state', header: 'State', sortable: true },
    { key: 'status', header: 'Status', sortable: true, render: (owner: Owner) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        owner.status === 'Active' ? 'bg-green-100 text-green-800' : 
        owner.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
        'bg-red-100 text-red-800'
      }`}>
        {owner.status}
      </span>
    )},
    { key: 'actions', header: 'Actions', sortable: false, render: (owner: Owner) => (
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleView(owner)}
        >
          <Eye className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleEdit(owner)}
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleDelete(owner)}
          className="text-red-600 hover:text-red-700"
        >
          <Trash className="w-4 h-4" />
        </Button>
      </div>
    )},
  ];

  const stats = [
    { label: 'Total Owners', value: owners.length, icon: UserCheck, color: 'blue' },
    { label: 'Active Owners', value: owners.filter(o => o.status === 'Active').length, icon: UserCheck, color: 'green' },
    { label: 'Total Properties', value: owners.reduce((sum, o) => sum + (o.totalProperties || 0), 0), icon: Building2, color: 'purple' },
    { label: 'Total Portfolio Value', value: `$${owners.reduce((sum, o) => sum + (o.totalPortfolioValue || 0), 0).toLocaleString()}`, icon: DollarSign, color: 'orange' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Property Owners</h1>
          <p className="text-gray-600">Manage property owner information and portfolios</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Owner
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg bg-${stat.color}-100 text-${stat.color}-600`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Owners Table */}
      <Card title="All Owners">
        <div className="mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <TextInput
                placeholder="Search owners..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
        <Table
          data={filteredOwners}
          columns={columns}
          searchable
          pagination
          itemsPerPage={10}
          onRowClick={(owner) => setSelectedOwner(owner)}
        />
      </Card>

      {/* Owner Detail Modal */}
      {selectedOwner && (
        <Modal
          isOpen={!!selectedOwner}
          onClose={() => setSelectedOwner(null)}
          title="Owner Details"
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="mt-1 text-sm text-gray-900">{selectedOwner.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{selectedOwner.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <p className="mt-1 text-sm text-gray-900">{selectedOwner.phone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`mt-1 inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                  selectedOwner.status === 'Active' ? 'bg-green-100 text-green-800' : 
                  selectedOwner.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {selectedOwner.status}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <p className="mt-1 text-sm text-gray-900">{selectedOwner.address}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <p className="mt-1 text-sm text-gray-900">{selectedOwner.city}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">State</label>
                <p className="mt-1 text-sm text-gray-900">{selectedOwner.state}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
                <p className="mt-1 text-sm text-gray-900">{selectedOwner.zipCode}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700">Total Properties</label>
                <p className="mt-1 text-lg font-semibold text-gray-900">{selectedOwner.totalProperties || 0}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Portfolio Value</label>
                <p className="mt-1 text-lg font-semibold text-gray-900">${(selectedOwner.totalPortfolioValue || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Owner Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Owner"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInput
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextInput
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <TextInput
              label="Phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
            <TextInput
              label="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
            <TextInput
              label="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              required
            />
            <TextInput
              label="State"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              required
            />
            <TextInput
              label="ZIP Code"
              value={formData.zipCode}
              onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
              required
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Add Owner
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Owner Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Owner"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInput
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextInput
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <TextInput
              label="Phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
            <TextInput
              label="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
            <TextInput
              label="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              required
            />
            <TextInput
              label="State"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              required
            />
            <TextInput
              label="ZIP Code"
              value={formData.zipCode}
              onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
              required
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowEditModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Update Owner
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
