import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Building2, DollarSign, Users, Eye, Edit, Trash, Search, Download } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { TextInput, SelectInput } from '../components/ui/FormInput';
import Table from '../components/ui/Table';
import api from '../api/axios';

interface Property {
  _id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  type: 'Apartment' | 'House' | 'Commercial' | 'Land' | 'Office' | 'Retail';
  status: 'Available' | 'Rented' | 'Under Maintenance' | 'Sold' | 'Reserved';
  rent: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  ownerId: string;
  owner?: {
    name: string;
    email: string;
    phone: string;
  };
  tenantId?: string;
  tenant?: {
    name: string;
    email: string;
    phone: string;
  };
}

interface Owner {
  _id: string;
  name: string;
  email: string;
}

export default function Properties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    type: '',
    rent: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    ownerId: '',
    description: '',
    purchasePrice: '',
    yearBuilt: '',
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    fetchProperties();
    fetchOwners();
  }, []);

  useEffect(() => {
    filterProperties();
  }, [properties, searchTerm, statusFilter, typeFilter]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await api.get('/properties');
      // Handle both array and paginated response formats
      const responseData = response.data as any;
      const propertiesData = Array.isArray(responseData) 
        ? responseData 
        : responseData.properties || [];
      setProperties(propertiesData as Property[]);
    } catch (error) {
      console.error('Failed to fetch properties:', error);
      setProperties([]); // Ensure properties remains an array even on error
    } finally {
      setLoading(false);
    }
  };

  const fetchOwners = async () => {
    try {
      const response = await api.get('/owners');
      // Handle both array and paginated response formats
      const responseData = response.data as any;
      const ownersData = Array.isArray(responseData) 
        ? responseData 
        : responseData.owners || [];
      setOwners(ownersData as Owner[]);
    } catch (error) {
      console.error('Failed to fetch owners:', error);
      setOwners([]); // Ensure owners remains an array even on error
    }
  };

  const filterProperties = () => {
    let filtered = properties;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(property => property.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(property => property.type === typeFilter);
    }

    // Apply search filter
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(property =>
        property.name.toLowerCase().includes(term) ||
        property.address.toLowerCase().includes(term) ||
        property.city.toLowerCase().includes(term) ||
        property.state.toLowerCase().includes(term)
      );
    }

    setFilteredProperties(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        rent: Number(formData.rent),
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        area: Number(formData.area),
        purchasePrice: Number(formData.purchasePrice),
        yearBuilt: Number(formData.yearBuilt),
        status: 'Available',
      };

      if (selectedProperty) {
        // Update existing property
        await api.put(`/properties/${selectedProperty._id}`, payload);
      } else {
        // Create new property
        await api.post('/properties', payload);
      }

      fetchProperties();
      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedProperty(null);
      resetForm();
    } catch (error) {
      console.error('Failed to save property:', error);
    }
  };

  const handleEdit = (property: Property) => {
    setSelectedProperty(property);
    setFormData({
      name: property.name,
      address: property.address,
      city: property.city,
      state: property.state,
      type: property.type,
      rent: property.rent.toString(),
      bedrooms: property.bedrooms.toString(),
      bathrooms: property.bathrooms.toString(),
      area: property.area.toString(),
      ownerId: property.ownerId,
      description: '',
      purchasePrice: '',
      yearBuilt: '',
    });
    setShowEditModal(true);
  };

  const handleView = (property: Property) => {
    setSelectedProperty(property);
    setShowViewModal(true);
  };

  const handleDelete = async (property: Property) => {
    if (window.confirm(`Are you sure you want to delete ${property.name}?`)) {
      try {
        await api.delete(`/properties/${property._id}`);
        fetchProperties();
      } catch (error) {
        console.error('Failed to delete property:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      state: '',
      type: '',
      rent: '',
      bedrooms: '',
      bathrooms: '',
      area: '',
      ownerId: '',
      description: '',
      purchasePrice: '',
      yearBuilt: '',
    });
  };

  const handleExport = () => {
    const csvContent = [
      ['Name', 'Address', 'City', 'State', 'Type', 'Status', 'Rent', 'Bedrooms', 'Bathrooms', 'Area'],
      ...filteredProperties.map(p => [
        p.name,
        p.address,
        p.city,
        p.state,
        p.type,
        p.status,
        p.rent.toString(),
        p.bedrooms.toString(),
        p.bathrooms.toString(),
        p.area.toString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'properties.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const columns = [
    { key: 'name', header: 'Property Name', sortable: true },
    { key: 'address', header: 'Address', sortable: true },
    { key: 'city', header: 'City', sortable: true },
    { key: 'type', header: 'Type', sortable: true },
    { key: 'status', header: 'Status', sortable: true, render: (property: Property) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        property.status === 'Available' ? 'bg-green-100 text-green-800' :
        property.status === 'Rented' ? 'bg-blue-100 text-blue-800' :
        property.status === 'Under Maintenance' ? 'bg-yellow-100 text-yellow-800' :
        property.status === 'Sold' ? 'bg-gray-100 text-gray-800' :
        'bg-purple-100 text-purple-800'
      }`}>
        {property.status}
      </span>
    )},
    { key: 'rent', header: 'Rent', sortable: true, render: (property: Property) => `$${property.rent.toLocaleString()}` },
    { key: 'bedrooms', header: 'Bedrooms', sortable: true },
    { key: 'bathrooms', header: 'Bathrooms', sortable: true },
    { key: 'area', header: 'Area (sq ft)', sortable: true, render: (property: Property) => property.area.toLocaleString() },
    { key: 'actions', header: 'Actions', sortable: false, render: (property: Property) => (
      <div className="flex space-x-2">
        <button 
          onClick={() => handleView(property)}
          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
          title="View Details"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button 
          onClick={() => handleEdit(property)}
          className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
          title="Edit Property"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button 
          onClick={() => handleDelete(property)}
          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
          title="Delete Property"
        >
          <Trash className="w-4 h-4" />
        </button>
      </div>
    )},
  ];

  const propertyTypes = [
    { value: 'Apartment', label: 'Apartment' },
    { value: 'House', label: 'House' },
    { value: 'Commercial', label: 'Commercial' },
    { value: 'Land', label: 'Land' },
    { value: 'Office', label: 'Office' },
    { value: 'Retail', label: 'Retail' },
  ];

  const states = [
  { value: 'AP', label: 'Andhra Pradesh' },
  { value: 'AR', label: 'Arunachal Pradesh' },
  { value: 'AS', label: 'Assam' },
  { value: 'BR', label: 'Bihar' },
  { value: 'CG', label: 'Chhattisgarh' },
  { value: 'GA', label: 'Goa' },
  { value: 'GJ', label: 'Gujarat' },
  { value: 'HR', label: 'Haryana' },
  { value: 'HP', label: 'Himachal Pradesh' },
  { value: 'JH', label: 'Jharkhand' },
  { value: 'KA', label: 'Karnataka' },
  { value: 'KL', label: 'Kerala' },
  { value: 'MP', label: 'Madhya Pradesh' },
  { value: 'MH', label: 'Maharashtra' },
  { value: 'MN', label: 'Manipur' },
  { value: 'ML', label: 'Meghalaya' },
  { value: 'MZ', label: 'Mizoram' },
  { value: 'NL', label: 'Nagaland' },
  { value: 'OD', label: 'Odisha' },
  { value: 'PB', label: 'Punjab' },
  { value: 'RJ', label: 'Rajasthan' },
  { value: 'SK', label: 'Sikkim' },
  { value: 'TN', label: 'Tamil Nadu' },
  { value: 'TG', label: 'Telangana' },
  { value: 'TR', label: 'Tripura' },
  { value: 'UP', label: 'Uttar Pradesh' },
  { value: 'UT', label: 'Uttarakhand' },
  { value: 'WB', label: 'West Bengal' }
];

  const stats = [
    { label: 'Total Properties', value: properties.length, icon: Building2, color: 'blue' },
    { label: 'Available', value: properties.filter(p => p.status === 'Available').length, icon: Building2, color: 'green' },
    { label: 'Rented', value: properties.filter(p => p.status === 'Rented').length, icon: Users, color: 'blue' },
    { label: 'Total Rent', value: `$${properties.reduce((sum, p) => sum + p.rent, 0).toLocaleString()}`, icon: DollarSign, color: 'purple' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Properties</h1>
          <p className="text-gray-600">Manage your property portfolio</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Property
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

      {/* Search and Filters */}
      <Card>
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search properties..."
              className="pl-10 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
          
          <div className="flex items-center space-x-4 w-full lg:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Rented">Rented</option>
              <option value="Under Maintenance">Under Maintenance</option>
              <option value="Sold">Sold</option>
              <option value="Reserved">Reserved</option>
            </select>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              {propertyTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Properties Table */}
      <Card title="All Properties" actions={
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      }>
        <Table
          data={filteredProperties}
          columns={columns}
          searchable={false}
          pagination
          itemsPerPage={10}
        />
      </Card>

      {/* Add Property Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title="Add New Property"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInput
              label="Property Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <SelectInput
              label="Property Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              options={propertyTypes}
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
            <SelectInput
              label="State"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              options={states}
              required
            />
            <TextInput
              label="Monthly Rent ($)"
              type="number"
              value={formData.rent}
              onChange={(e) => setFormData({ ...formData, rent: e.target.value })}
              required
            />
            <TextInput
              label="Bedrooms"
              type="number"
              value={formData.bedrooms}
              onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
            />
            <TextInput
              label="Bathrooms"
              type="number"
              value={formData.bathrooms}
              onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
            />
            <TextInput
              label="Area (sq ft)"
              type="number"
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
            />
            <SelectInput
              label="Owner"
              value={formData.ownerId}
              onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
              options={owners.map(owner => ({ value: owner._id, label: owner.name }))}
              required
            />
            <TextInput
              label="Purchase Price ($)"
              type="number"
              value={formData.purchasePrice}
              onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
            />
            <TextInput
              label="Year Built"
              type="number"
              value={formData.yearBuilt}
              onChange={(e) => setFormData({ ...formData, yearBuilt: e.target.value })}
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              Add Property
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Property Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedProperty(null);
          resetForm();
        }}
        title="Edit Property"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInput
              label="Property Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <SelectInput
              label="Property Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              options={propertyTypes}
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
            <SelectInput
              label="State"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              options={states}
              required
            />
            <TextInput
              label="Monthly Rent ($)"
              type="number"
              value={formData.rent}
              onChange={(e) => setFormData({ ...formData, rent: e.target.value })}
              required
            />
            <TextInput
              label="Bedrooms"
              type="number"
              value={formData.bedrooms}
              onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
            />
            <TextInput
              label="Bathrooms"
              type="number"
              value={formData.bathrooms}
              onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
            />
            <TextInput
              label="Area (sq ft)"
              type="number"
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
            />
            <SelectInput
              label="Owner"
              value={formData.ownerId}
              onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
              options={owners.map(owner => ({ value: owner._id, label: owner.name }))}
              required
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setSelectedProperty(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              Update Property
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Property Modal */}
      {selectedProperty && (
        <Modal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedProperty(null);
          }}
          title="Property Details"
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Property Name</label>
                <p className="mt-1 text-sm text-gray-900">{selectedProperty.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <p className="mt-1 text-sm text-gray-900">{selectedProperty.type}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <p className="mt-1 text-sm text-gray-900">{selectedProperty.address}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <p className="mt-1 text-sm text-gray-900">{selectedProperty.city}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">State</label>
                <p className="mt-1 text-sm text-gray-900">{selectedProperty.state}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`mt-1 inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                  selectedProperty.status === 'Available' ? 'bg-green-100 text-green-800' :
                  selectedProperty.status === 'Rented' ? 'bg-blue-100 text-blue-800' :
                  selectedProperty.status === 'Under Maintenance' ? 'bg-yellow-100 text-yellow-800' :
                  selectedProperty.status === 'Sold' ? 'bg-gray-100 text-gray-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {selectedProperty.status}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Monthly Rent</label>
                <p className="mt-1 text-sm text-gray-900">${selectedProperty.rent.toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bedrooms</label>
                <p className="mt-1 text-sm text-gray-900">{selectedProperty.bedrooms}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bathrooms</label>
                <p className="mt-1 text-sm text-gray-900">{selectedProperty.bathrooms}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Area</label>
                <p className="mt-1 text-sm text-gray-900">{selectedProperty.area.toLocaleString()} sq ft</p>
              </div>
            </div>
            
            {selectedProperty.owner && (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium text-gray-900 mb-2">Owner Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedProperty.owner.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedProperty.owner.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedProperty.owner.phone}</p>
                  </div>
                </div>
              </div>
            )}
            
            {selectedProperty.tenant && (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium text-gray-900 mb-2">Current Tenant</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedProperty.tenant.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedProperty.tenant.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedProperty.tenant.phone}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
