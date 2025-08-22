import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, AlertTriangle, CreditCard, Plus, Download, Filter, Eye, Edit, Trash } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { TextInput, SelectInput } from '../components/ui/FormInput';
import Table from '../components/ui/Table';
import api from '../api/axios';

interface Transaction {
  _id: string;
  type: 'Income' | 'Expense';
  category: string;
  amount: number;
  date: string;
  description: string;
  propertyId?: string;
  property?: {
    name: string;
    address: string;
  };
  tenantId?: string;
  tenant?: {
    name: string;
  };
}

interface Property {
  _id: string;
  name: string;
  address: string;
  city: string;
  state: string;
}

interface RentDue {
  _id: string;
  tenant: string;
  property: string;
  amount: number;
  dueDate: string;
  status: 'Paid' | 'Overdue' | 'Pending';
}

export default function Finance() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    type: '',
    category: '',
    amount: '',
    date: '',
    description: '',
    propertyId: '',
  });

  useEffect(() => {
    fetchTransactions();
    fetchProperties();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/transactions');
      const data = response.data as { transactions?: Transaction[] } | Transaction[];
      if ('transactions' in data && data.transactions) {
        setTransactions(data.transactions);
      } else {
        setTransactions(data as Transaction[]);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await api.get('/properties');
      const data = response.data as { properties?: Property[] } | Property[];
      if ('properties' in data && data.properties) {
        setProperties(data.properties);
      } else {
        setProperties(data as Property[]);
      }
    } catch (error) {
      console.error('Failed to fetch properties:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Create a transaction record in the backend
      const transactionData = {
        type: formData.type as 'Income' | 'Expense',
        category: formData.category,
        amount: formData.type === 'Expense' ? -Number(formData.amount) : Number(formData.amount),
        description: formData.description,
        date: formData.date,
        propertyId: formData.propertyId || undefined,
        status: 'Completed',
        paymentMethod: 'Online',
      };

      await api.post('/transactions', transactionData);
      
      // Refresh transactions
      fetchTransactions();
      
      // Reset form and close modal
      setShowAddTransaction(false);
      setFormData({
        type: '',
        category: '',
        amount: '',
        date: '',
        description: '',
        propertyId: '',
      });
    } catch (error) {
      console.error('Failed to add transaction:', error);
    }
  };

  const handleViewTransaction = (transaction: Transaction) => {
    // You can implement a view modal here
    console.log('View transaction:', transaction);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    // You can implement an edit modal here
    console.log('Edit transaction:', transaction);
  };

  const handleDeleteTransaction = async (transaction: Transaction) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await api.delete(`/transactions/${transaction._id}`);
        fetchTransactions();
      } catch (error) {
        console.error('Failed to delete transaction:', error);
      }
    }
  };

  const transactionColumns = [
    { key: 'date', header: 'Date', sortable: true, render: (transaction: Transaction) => new Date(transaction.date).toLocaleDateString() },
    { key: 'type', header: 'Type', sortable: true, render: (transaction: Transaction) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        transaction.type === 'Income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {transaction.type}
      </span>
    )},
    { key: 'category', header: 'Category', sortable: true },
    { key: 'amount', header: 'Amount', sortable: true, render: (transaction: Transaction) => (
      <span className={transaction.type === 'Income' ? 'text-green-600' : 'text-red-600'}>
        ${Math.abs(transaction.amount).toLocaleString()}
      </span>
    )},
    { key: 'description', header: 'Description', sortable: true },
    { key: 'property', header: 'Property', sortable: true, render: (transaction: Transaction) => 
      transaction.property?.name || 'N/A'
    },
    { key: 'actions', header: 'Actions', sortable: false, render: (transaction: Transaction) => (
      <div className="flex space-x-2">
        <button 
          onClick={() => handleViewTransaction(transaction)}
          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
          title="View Details"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button 
          onClick={() => handleEditTransaction(transaction)}
          className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
          title="Edit Transaction"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button 
          onClick={() => handleDeleteTransaction(transaction)}
          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
          title="Delete Transaction"
        >
          <Trash className="w-4 h-4" />
        </button>
      </div>
    )},
  ];

  const rentDueColumns = [
    { key: 'tenant', header: 'Tenant', sortable: true },
    { key: 'property', header: 'Property', sortable: true },
    { key: 'amount', header: 'Amount', sortable: true, render: (due: RentDue) => `$${due.amount.toLocaleString()}` },
    { key: 'dueDate', header: 'Due Date', sortable: true, render: (due: RentDue) => new Date(due.dueDate).toLocaleDateString() },
    { key: 'status', header: 'Status', sortable: true, render: (due: RentDue) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        due.status === 'Paid' ? 'bg-green-100 text-green-800' :
        due.status === 'Overdue' ? 'bg-red-100 text-red-800' :
        'bg-yellow-100 text-yellow-800'
      }`}>
        {due.status}
      </span>
    )},
  ];

  const categories = [
    { value: 'Rent', label: 'Rent' },
    { value: 'Maintenance', label: 'Maintenance' },
    { value: 'Utilities', label: 'Utilities' },
    { value: 'Insurance', label: 'Insurance' },
    { value: 'Property Tax', label: 'Property Tax' },
    { value: 'Other', label: 'Other' },
  ];

  const propertyOptions = properties.map(property => ({
    value: property._id,
    label: `${property.name} - ${property.address}, ${property.city}, ${property.state}`
  }));

  // Calculate stats from real data
  const totalIncome = transactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
  const netProfit = totalIncome + totalExpenses;
  const overdueAmount = 0; // You can implement this based on your rent due logic

  const stats = [
    { label: 'Total Income', value: `$${totalIncome.toLocaleString()}`, icon: TrendingUp, color: 'green' },
    { label: 'Total Expenses', value: `$${totalExpenses.toLocaleString()}`, icon: CreditCard, color: 'red' },
    { label: 'Net Profit', value: `$${netProfit.toLocaleString()}`, icon: DollarSign, color: 'blue' },
    { label: 'Overdue Rent', value: `$${overdueAmount.toLocaleString()}`, icon: AlertTriangle, color: 'orange' },
  ];

  // Generate monthly data from transactions
  const generateMonthlyData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    return months.slice(0, currentMonth + 1).map((month, index) => {
      const monthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === index;
      });
      
      const monthIncome = monthTransactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
      const monthExpenses = monthTransactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const monthProfit = monthIncome - monthExpenses;
      
      return { month, income: monthIncome, expenses: monthExpenses, profit: monthProfit };
    });
  };

  const monthlyData = generateMonthlyData();

  // Generate expense categories from real transaction data
  const generateExpenseCategories = () => {
    const expenseTransactions = transactions.filter(t => t.type === 'Expense');
    const categoryTotals: { [key: string]: number } = {};
    
    expenseTransactions.forEach(t => {
      const category = t.category;
      categoryTotals[category] = (categoryTotals[category] || 0) + Math.abs(t.amount);
    });
    
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
    
    return Object.entries(categoryTotals).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length]
    }));
  };

  const expenseCategories = generateExpenseCategories();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Finance</h1>
          <p className="text-gray-600">Track income, expenses, and financial performance</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowAddTransaction(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Transaction
          </Button>
        </div>
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card title="Monthly Revenue Trend">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} name="Income" />
              <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} name="Expenses" />
              <Line type="monotone" dataKey="profit" stroke="#3B82F6" strokeWidth={2} name="Profit" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Expense Categories */}
        <Card title="Expense Categories">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={expenseCategories}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {expenseCategories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Rent Dues */}
      <Card title="Rent Collection Status" actions={
        <Button variant="outline" size="sm">View All</Button>
      }>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <Table
            data={[]} // You can implement rent dues logic here
            columns={rentDueColumns}
            searchable
            pagination
            itemsPerPage={10}
          />
        )}
      </Card>

      {/* Recent Transactions */}
      <Card title="Recent Transactions" actions={
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">View All</Button>
        </div>
      }>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <Table
            data={transactions}
            columns={transactionColumns}
            searchable
            pagination
            itemsPerPage={10}
          />
        )}
      </Card>

      {/* Add Transaction Modal */}
      <Modal
        isOpen={showAddTransaction}
        onClose={() => setShowAddTransaction(false)}
        title="Add New Transaction"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectInput
              label="Transaction Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              options={[
                { value: 'Income', label: 'Income' },
                { value: 'Expense', label: 'Expense' },
              ]}
              required
            />
            <SelectInput
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={categories}
              required
            />
            <TextInput
              label="Amount ($)"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
            <TextInput
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
            <TextInput
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
            <SelectInput
              label="Property (Optional)"
              value={formData.propertyId}
              onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
              options={propertyOptions}
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddTransaction(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Add Transaction
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
