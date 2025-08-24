import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  CheckSquare,
  Edit,
  Trash2,
  CheckCircle,
  Circle,
  Calendar,
  TrendingUp,
  Plus,
  Archive,
  FileText,
  X,
  Paperclip,
  AlertCircle,
  Clock,
  User,
  Priority
} from 'lucide-react';

const TodosManager = ({ onBack, params = {} }) => {
  const { user } = useAuth();
  const { showTodoNotification, showSuccess, showError } = useNotification();
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(params.showAddForm || false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [filter, setFilter] = useState('all'); // all, my-todos, active, completed, archived

  console.log('TodosManager: Component rendered, user:', user?.uid, 'params:', params);

  // Mock users for now - in a real app, you'd fetch this from Firestore
  const availableUsers = [
    { id: user?.uid, name: user?.displayName || 'You', email: user?.email },
    { id: 'partner1', name: 'Partner 1', email: 'partner1@example.com' },
    { id: 'partner2', name: 'Partner 2', email: 'partner2@example.com' }
  ];

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    status: 'new',
    attachments: [],
    assignedTo: user?.uid || ''
  });

  // Update showAddForm when params change
  useEffect(() => {
    if (params.showAddForm) {
      setShowAddForm(true);
    }
  }, [params.showAddForm]);

  useEffect(() => {
    console.log('TodosManager: useEffect triggered, user:', user?.uid);
    
    if (!user?.uid) {
      console.log('TodosManager: No user, skipping query');
      return;
    }

    const q = query(
      collection(db, 'todos'),
      where('userId', '==', user.uid)
    );

    console.log('TodosManager: Setting up Firestore listener for user:', user.uid);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('TodosManager: Firestore snapshot received, docs:', snapshot.docs.length);
      
      if (snapshot.docs.length > 0) {
        console.log('TodosManager: First todo data:', snapshot.docs[0].data());
      }
      
      const todosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by createdAt in JavaScript instead of Firestore
      todosData.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt.toDate() - a.createdAt.toDate();
        }
        return 0;
      });
      
      console.log('TodosManager: Processed todos data:', todosData);
      setTodos(todosData);
      setLoading(false);
    }, (error) => {
      console.error('TodosManager: Firestore error:', error);
      console.error('TodosManager: Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.uid]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      dueDate: '',
      priority: 'medium',
      status: 'new',
      attachments: [],
      assignedTo: user?.uid || ''
    });
    setEditingTodo(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('TodosManager: Form submitted!');
    
    try {
      console.log('TodosManager: Submitting todo data:', formData);
      
      const todoData = {
        userId: user.uid,
        title: formData.title.trim(),
        description: formData.description.trim(),
        dueDate: formData.dueDate,
        priority: formData.priority,
        status: formData.status,
        attachments: formData.attachments,
        assignedTo: formData.assignedTo,
        assignedToName: availableUsers.find(u => u.id === formData.assignedTo)?.name || 'Unknown',
        statusChangedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('TodosManager: Processed todo data:', todoData);

      if (editingTodo) {
        console.log('TodosManager: Updating existing todo:', editingTodo.id);
        await updateDoc(doc(db, 'todos', editingTodo.id), {
          ...todoData,
          updatedAt: serverTimestamp()
        });
        console.log('TodosManager: Todo updated successfully');
        showSuccess('Todo Updated', 'Todo updated successfully');
      } else {
        console.log('TodosManager: Adding new todo to Firestore');
        const docRef = await addDoc(collection(db, 'todos'), todoData);
        console.log('TodosManager: Todo added successfully with ID:', docRef.id);
        
        // Send email notification if todo is assigned to someone else
        if (formData.assignedTo !== user.uid) {
          const assignedUser = availableUsers.find(u => u.id === formData.assignedTo);
          if (assignedUser && assignedUser.email) {
            try {
              showTodoNotification({
                id: docRef.id,
                partnerEmail: assignedUser.email,
                title: formData.title,
                description: formData.description,
                priority: formData.priority,
                dueDate: formData.dueDate
              }, true); // true = send email notification
            } catch (error) {
              console.error('Failed to send todo notification email:', error);
              showError('Email Failed', 'Todo created but email notification failed');
            }
          }
        } else {
          showSuccess('Todo Created', 'Todo created successfully');
        }
      }

      setShowAddForm(false);
      resetForm();
    } catch (error) {
      console.error('TodosManager: Error saving todo:', error);
      console.error('TodosManager: Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      showError('Save Failed', `Error saving todo: ${error.message}`);
    }
  };

  const handleEdit = (todo) => {
    setEditingTodo(todo);
    setFormData({
      title: todo.title,
      description: todo.description,
      dueDate: todo.dueDate,
      priority: todo.priority,
      status: todo.status,
      attachments: todo.attachments || [],
      assignedTo: todo.assignedTo || user?.uid || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (todoId) => {
    if (window.confirm('Are you sure you want to delete this todo?')) {
      try {
        await deleteDoc(doc(db, 'todos', todoId));
      } catch (error) {
        console.error('Error deleting todo:', error);
        alert('Error deleting todo. Please try again.');
      }
    }
  };

  const handleArchive = async (todo) => {
    try {
      await updateDoc(doc(db, 'todos', todo.id), {
        status: 'archived',
        statusChangedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error archiving todo:', error);
      alert('Error archiving todo. Please try again.');
    }
  };

  const handleStatusChange = async (todo, newStatus) => {
    try {
      await updateDoc(doc(db, 'todos', todo.id), {
        status: newStatus,
        statusChangedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status. Please try again.');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'new':
        return <Circle className="w-5 h-5 text-blue-600" />;
      case 'in-progress':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'on-hold':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'archived':
        return <Archive className="w-5 h-5 text-gray-600" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'new':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in-progress':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'on-hold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'archived':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUserName = (userId) => {
    const user = availableUsers.find(u => u.id === userId);
    return user ? user.name : 'Unknown';
  };

  const isMyTodo = (todo) => {
    return todo.assignedTo === user?.uid;
  };

  const getStatusDuration = (todo) => {
    if (!todo.statusChangedAt) return 'Unknown';
    
    const statusChangedAt = todo.statusChangedAt.toDate ? todo.statusChangedAt.toDate() : new Date(todo.statusChangedAt);
    const now = new Date();
    const diffInMs = now - statusChangedAt;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''}`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''}`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
    } else {
      return 'Just now';
    }
  };

  const filteredTodos = todos.filter(todo => {
    if (filter === 'all') return todo.status !== 'archived';
    if (filter === 'my-todos') return todo.status !== 'archived' && isMyTodo(todo);
    if (filter === 'active') return todo.status === 'new' || todo.status === 'in-progress';
    if (filter === 'completed') return todo.status === 'completed';
    if (filter === 'archived') return todo.status === 'archived';
    return true;
  });

  const stats = {
    total: todos.filter(t => t.status !== 'archived').length,
    myTodos: todos.filter(t => t.status !== 'archived' && isMyTodo(t)).length,
    new: todos.filter(t => t.status === 'new').length,
    inProgress: todos.filter(t => t.status === 'in-progress').length,
    onHold: todos.filter(t => t.status === 'on-hold').length,
    completed: todos.filter(t => t.status === 'completed').length,
    archived: todos.filter(t => t.status === 'archived').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading todos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100">
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-2 rounded-lg">
                <CheckSquare className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">To-Dos</h1>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowAddForm(true);
              }}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-200 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Todo</span>
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-1 mb-6">
            {[
              { key: 'all', label: 'All', count: stats.total },
              { key: 'my-todos', label: 'My Todos', count: stats.myTodos },
              { key: 'active', label: 'Active', count: stats.new + stats.inProgress },
              { key: 'completed', label: 'Completed', count: stats.completed },
              { key: 'archived', label: 'Archived', count: stats.archived }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  filter === tab.key
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Stats Grid - one row of icons on desktop */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="bg-green-100 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                <CheckSquare className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.total}</p>
              <p className="text-xs text-gray-600">Total Todos</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                <Circle className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-600">{stats.new}</p>
              <p className="text-xs text-gray-600">New</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-orange-600">{stats.inProgress}</p>
              <p className="text-xs text-gray-600">In Progress</p>
            </div>
            <div className="text-center">
              <div className="bg-yellow-100 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold text-yellow-600">{stats.onHold}</p>
              <p className="text-xs text-gray-600">On Hold</p>
            </div>
            <div className="text-center">
              <div className="bg-gray-100 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                <Archive className="w-6 h-6 text-gray-600" />
              </div>
              <p className="text-2xl font-bold text-gray-600">{stats.archived}</p>
              <p className="text-xs text-gray-600">Archived</p>
            </div>
          </div>
        </div>

        {/* Todos List */}
        <div className="space-y-4">
          {console.log('TodosManager: Rendering todos list, filteredTodos:', filteredTodos.length)}
          {filteredTodos.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <CheckSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {filter === 'all' ? 'No todos yet' : `No ${filter} todos`}
              </h3>
              <p className="text-gray-500 mb-6">
                {filter === 'all' 
                  ? 'Start by adding your first todo!' 
                  : `No todos in the ${filter} category.`
                }
              </p>
              {filter === 'all' && (
                <button
                  onClick={() => {
                    resetForm();
                    setShowAddForm(true);
                  }}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
                >
                  Add Your First Todo
                </button>
              )}
            </div>
          ) : (
            filteredTodos.map((todo) => {
              console.log('TodosManager: Rendering todo:', todo);
              return (
                <div key={todo.id} className="bg-white rounded-2xl shadow-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">{todo.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(todo.status)}`}>
                          {todo.status.replace('-', ' ')}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(todo.priority)}`}>
                          {todo.priority}
                        </span>
                        <div className="flex items-center space-x-2">
                          <User className={`w-4 h-4 ${isMyTodo(todo) ? 'text-green-600' : 'text-gray-500'}`} />
                          <span className={`text-xs font-medium ${isMyTodo(todo) ? 'text-green-600' : 'text-gray-600'}`}>
                            {todo.assignedToName || getUserName(todo.assignedTo)}
                            {isMyTodo(todo) && ' (You)'}
                          </span>
                        </div>
                      </div>
                      {todo.description && (
                        <p className="text-gray-600 mb-3">{todo.description}</p>
                      )}
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        {todo.dueDate && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>Due: {new Date(todo.dueDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>In {todo.status.replace('-', ' ')} for {getStatusDuration(todo)}</span>
                        </div>
                        {todo.attachments && todo.attachments.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <Paperclip className="w-4 h-4" />
                            <span>{todo.attachments.length} attachment(s)</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 ml-4">
                      <button
                        onClick={() => handleEdit(todo)}
                        className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Edit Todo"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {todo.status !== 'archived' && (
                        <button
                          onClick={() => handleArchive(todo)}
                          className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Archive Todo"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(todo.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Todo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingTodo ? 'Edit Todo' : 'Add New Todo'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                  className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Todo Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter todo title..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Describe your todo..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="new">New</option>
                      <option value="in-progress">In Progress</option>
                      <option value="on-hold">On Hold</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign To
                  </label>
                  <select
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {availableUsers.map(user => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attachments
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Paperclip className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Drag and drop files here, or click to browse</p>
                    <p className="text-sm text-gray-500 mt-1">Coming soon...</p>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      resetForm();
                    }}
                    className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
                  >
                    {editingTodo ? 'Update Todo' : 'Add Todo'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodosManager;
