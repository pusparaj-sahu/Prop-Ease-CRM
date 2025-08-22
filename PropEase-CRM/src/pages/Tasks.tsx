import { useEffect, useState } from 'react';
import api from '../api/axios';
import { FaPlus, FaCheck, FaUndo, FaTrash, FaCalendarAlt, FaSearch } from 'react-icons/fa';

type Task = {
  _id: string;
  title: string;
  status: 'Pending' | 'Completed';
  dueDate?: string;
  assignedTo?: string;
};

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/tasks')
      .then((r) => {
        setTasks(r.data);
        setFilteredTasks(r.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let result = tasks;
    
    // Apply status filter
    if (filter === 'pending') {
      result = result.filter(task => task.status === 'Pending');
    } else if (filter === 'completed') {
      result = result.filter(task => task.status === 'Completed');
    }
    
    // Apply search filter
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(task => task.title.toLowerCase().includes(term));
    }
    
    setFilteredTasks(result);
  }, [tasks, filter, searchTerm]);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/tasks', { title, dueDate: dueDate || undefined });
      setTasks((prev) => [data, ...prev]);
      setTitle(''); 
      setDueDate('');
      setShowForm(false);
    } catch (error) {
      console.error('Failed to add task', error);
    }
  };

  const toggleStatus = async (id: string, status: Task['status']) => {
    try {
      const { data } = await api.put(`/tasks/${id}`, { status });
      setTasks((prev) => prev.map((t) => (t._id === id ? data : t)));
    } catch (error) {
      console.error('Failed to update task status', error);
    }
  };

  const remove = async (id: string) => {
    try {
      await api.delete(`/tasks/${id}`);
      setTasks((prev) => prev.filter((t) => t._id !== id));
    } catch (error) {
      console.error('Failed to delete task', error);
    }
  };

  const isPastDue = (date?: string) => {
    if (!date) return false;
    return new Date(date) < new Date(new Date().setHours(0, 0, 0, 0));
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Tasks</h1>
          <p className="text-gray-500 mt-1">Manage your daily tasks and activities</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200"
          >
            <FaPlus />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {showForm && (
        <div className="mb-6 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="font-semibold text-gray-800">Add New Task</h2>
            <button 
              onClick={() => setShowForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          <form onSubmit={addTask} className="p-6">
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Task Title *</label>
              <input 
                id="title"
                value={title} 
                onChange={(e)=>setTitle(e.target.value)} 
                placeholder="What needs to be done?" 
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                required 
              />
            </div>
            <div className="mb-4">
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <FaCalendarAlt className="text-gray-400" />
                </div>
                <input 
                  id="dueDate"
                  type="date" 
                  value={dueDate} 
                  onChange={(e)=>setDueDate(e.target.value)} 
                  className="pl-10 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                />
              </div>
            </div>
            <div className="flex justify-end">
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
                Save Task
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
            placeholder="Search tasks..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full"
          />
        </div>
        
        <div className="flex rounded-md shadow-sm w-full sm:w-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-medium ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} border border-gray-300 rounded-l-md`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 text-sm font-medium ${filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} border-t border-b border-r border-gray-300`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 text-sm font-medium ${filter === 'completed' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} border border-gray-300 rounded-r-md`}
          >
            Completed
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchTerm ? 'No tasks match your search' : 'No tasks found. Add a new task to get started!'}
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredTasks.map((task) => (
                <li key={task._id} className="p-4 hover:bg-gray-50 transition-colors duration-150">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <button
                        onClick={() => toggleStatus(task._id, task.status === 'Completed' ? 'Pending' : 'Completed')}
                        className={`mt-0.5 flex-shrink-0 h-5 w-5 rounded-full border ${task.status === 'Completed' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'} flex items-center justify-center`}
                      >
                        {task.status === 'Completed' && <FaCheck className="h-3 w-3" />}
                      </button>
                      <div>
                        <div className={`font-medium ${task.status === 'Completed' ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                          {task.title}
                        </div>
                        {task.dueDate && (
                          <div className={`text-sm mt-1 flex items-center ${isPastDue(task.dueDate) && task.status !== 'Completed' ? 'text-red-600' : 'text-gray-500'}`}>
                            <FaCalendarAlt className="mr-1 h-3 w-3" />
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                            {isPastDue(task.dueDate) && task.status !== 'Completed' && (
                              <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">Overdue</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {task.status === 'Completed' ? (
                        <button 
                          onClick={() => toggleStatus(task._id, 'Pending')} 
                          className="text-gray-500 hover:text-gray-700 p-1"
                          title="Mark as pending"
                        >
                          <FaUndo className="h-4 w-4" />
                        </button>
                      ) : (
                        <button 
                          onClick={() => toggleStatus(task._id, 'Completed')} 
                          className="text-green-600 hover:text-green-800 p-1"
                          title="Mark as completed"
                        >
                          <FaCheck className="h-4 w-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => remove(task._id)} 
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Delete task"
                      >
                        <FaTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}


