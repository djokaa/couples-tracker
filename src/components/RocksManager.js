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
  Target,
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
  CheckSquare,
  User
} from 'lucide-react';

const RocksManager = ({ onBack, params = {} }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [rocks, setRocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(params.showAddForm || false);
  const [editingRock, setEditingRock] = useState(null);
  const [filter, setFilter] = useState('all'); // all, my-rocks, active, completed, archived

  console.log('RocksManager: Component rendered, user:', user?.uid, 'params:', params);

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
    status: 'on-track',
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
    console.log('RocksManager: useEffect triggered, user:', user?.uid);

    if (!user?.uid) {
      console.log('RocksManager: No user, skipping query');
      return;
    }

    const q = query(
      collection(db, 'rocks'),
      where('userId', '==', user.uid)
      // Removed orderBy to avoid index requirement
    );

    console.log('RocksManager: Setting up Firestore listener for user:', user.uid);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('RocksManager: Firestore snapshot received, docs:', snapshot.docs.length);

      if (snapshot.docs.length > 0) {
        console.log('RocksManager: First rock data:', snapshot.docs[0].data());
      }

      const rocksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort by createdAt in JavaScript instead of Firestore
      rocksData.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt.toDate() - a.createdAt.toDate();
        }
        return 0;
      });

      console.log('RocksManager: Processed rocks data:', rocksData);
      setRocks(rocksData);
      setLoading(false);
    }, (error) => {
      console.error('RocksManager: Firestore error:', error);
      console.error('RocksManager: Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      setLoading(false);
      showError('Error Loading Rocks', 'Failed to load your rocks. Please try again.');
    });

    return () => unsubscribe();
  }, [user.uid, showError]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      dueDate: '',
      status: 'on-track',
      attachments: [],
      assignedTo: user?.uid || ''
    });
    setEditingRock(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('RocksManager: Form submitted!');

    try {
      console.log('RocksManager: Submitting rock data:', formData);

      const rockData = {
        userId: user.uid,
        title: formData.title.trim(),
        description: formData.description.trim(),
        dueDate: formData.dueDate,
        status: formData.status,
        attachments: formData.attachments,
        assignedTo: formData.assignedTo,
        assignedToName: availableUsers.find(u => u.id === formData.assignedTo)?.name || 'Unknown',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('RocksManager: Processed rock data:', rockData);

      if (editingRock) {
        console.log('RocksManager: Updating existing rock:', editingRock.id);
        await updateDoc(doc(db, 'rocks', editingRock.id), {
          ...rockData,
          updatedAt: serverTimestamp()
        });
        console.log('RocksManager: Rock updated successfully');
        showSuccess('Rock Updated', 'Your rock has been updated successfully!');
      } else {
        console.log('RocksManager: Adding new rock to Firestore');
        const docRef = await addDoc(collection(db, 'rocks'), rockData);
        console.log('RocksManager: Rock added successfully with ID:', docRef.id);
        showSuccess('Rock Added', 'Your new rock has been added successfully!');
      }

      setShowAddForm(false);
      resetForm();
    } catch (error) {
      console.error('RocksManager: Error saving rock:', error);
      console.error('RocksManager: Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      showError('Save Failed', `Failed to save rock: ${error.message}. Please check your Firebase configuration.`);
    }
  };

  const handleEdit = (rock) => {
    setEditingRock(rock);
    setFormData({
      title: rock.title,
      description: rock.description,
      dueDate: rock.dueDate,
      status: rock.status,
      attachments: rock.attachments || [],
      assignedTo: rock.assignedTo || user?.uid || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (rockId) => {
    if (window.confirm('Are you sure you want to delete this rock?')) {
      try {
        await deleteDoc(doc(db, 'rocks', rockId));
        showSuccess('Rock Deleted', 'The rock has been deleted successfully.');
      } catch (error) {
        console.error('Error deleting rock:', error);
        showError('Delete Failed', 'Failed to delete rock. Please try again.');
      }
    }
  };

  const handleArchive = async (rock) => {
    try {
      await updateDoc(doc(db, 'rocks', rock.id), {
        status: 'archived',
        updatedAt: serverTimestamp()
      });
      showSuccess('Rock Archived', 'The rock has been archived successfully.');
    } catch (error) {
      console.error('Error archiving rock:', error);
      showError('Archive Failed', 'Failed to archive rock. Please try again.');
    }
  };

  const handleStatusChange = async (rock, newStatus) => {
    try {
      await updateDoc(doc(db, 'rocks', rock.id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      showSuccess('Status Updated', `Rock status changed to ${newStatus.replace('-', ' ')}.`);
    } catch (error) {
      console.error('Error updating status:', error);
      showError('Update Failed', 'Failed to update status. Please try again.');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'on-track':
        return <Circle className="w-5 h-5 text-blue-600" />;
      case 'off-track':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
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
      case 'on-track':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'off-track':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'archived':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUserName = (userId) => {
    const user = availableUsers.find(u => u.id === userId);
    return user ? user.name : 'Unknown';
  };

  const isMyRock = (rock) => {
    return rock.assignedTo === user?.uid;
  };

  const filteredRocks = rocks.filter(rock => {
    if (filter === 'all') return rock.status !== 'archived';
    if (filter === 'my-rocks') return rock.status !== 'archived' && isMyRock(rock);
    if (filter === 'active') return rock.status === 'on-track' || rock.status === 'off-track';
    if (filter === 'completed') return rock.status === 'completed';
    if (filter === 'archived') return rock.status === 'archived';
    return true;
  });

  const stats = {
    total: rocks.filter(r => r.status !== 'archived').length,
    myRocks: rocks.filter(r => r.status !== 'archived' && isMyRock(r)).length,
    onTrack: rocks.filter(r => r.status === 'on-track').length,
    offTrack: rocks.filter(r => r.status === 'off-track').length,
    completed: rocks.filter(r => r.status === 'completed').length,
    archived: rocks.filter(r => r.status === 'archived').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading rocks...</p>
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
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-2 rounded-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Annual Rocks</h1>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowAddForm(true);
              }}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Rock</span>
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-1 mb-6">
            {[
              { key: 'all', label: 'All', count: stats.total },
              { key: 'my-rocks', label: 'My Rocks', count: stats.myRocks },
              { key: 'active', label: 'Active', count: stats.onTrack + stats.offTrack },
              { key: 'completed', label: 'Completed', count: stats.completed },
              { key: 'archived', label: 'Archived', count: stats.archived }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  filter === tab.key
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="bg-blue-100 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              <p className="text-xs text-gray-600">Total Rocks</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              <p className="text-xs text-gray-600">Completed</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-orange-600">{stats.offTrack}</p>
              <p className="text-xs text-gray-600">Off Track</p>
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

        {/* Rocks List */}
        <div className="space-y-4">
          {console.log('RocksManager: Rendering rocks list, filteredRocks:', filteredRocks.length)}
          {filteredRocks.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {filter === 'all' ? 'No rocks yet' : `No ${filter} rocks`}
              </h3>
              <p className="text-gray-500 mb-6">
                {filter === 'all'
                  ? 'Start by adding your first annual rock!'
                  : `No rocks in the ${filter} category.`
                }
              </p>
              {filter === 'all' && (
                <button
                  onClick={() => {
                    resetForm();
                    setShowAddForm(true);
                  }}
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-indigo-600 transition-all duration-200"
                >
                  Add Your First Rock
                </button>
              )}
            </div>
          ) : (
            filteredRocks.map((rock) => {
              console.log('RocksManager: Rendering rock:', rock);
              return (
                <div key={rock.id} className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-800">{rock.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(rock.status)}`}>
                          {rock.status.replace('-', ' ')}
                        </span>
                        <div className="flex items-center space-x-2">
                          <User className={`w-4 h-4 ${isMyRock(rock) ? 'text-blue-600' : 'text-gray-500'}`} />
                          <span className={`text-xs font-medium ${isMyRock(rock) ? 'text-blue-600' : 'text-gray-600'}`}>
                            {rock.assignedToName || getUserName(rock.assignedTo)}
                            {isMyRock(rock) && ' (You)'}
                          </span>
                        </div>
                      </div>

                      {rock.description && (
                        <p className="text-gray-600 mb-4">{rock.description}</p>
                      )}

                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        {rock.dueDate && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>Due: {new Date(rock.dueDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        {rock.attachments && rock.attachments.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <Paperclip className="w-4 h-4" />
                            <span>{rock.attachments.length} attachment(s)</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {/* Status Quick Actions */}
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleStatusChange(rock, 'on-track')}
                          className={`p-1 rounded ${rock.status === 'on-track' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                          title="Mark as On Track"
                        >
                          <Circle className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleStatusChange(rock, 'off-track')}
                          className={`p-1 rounded ${rock.status === 'off-track' ? 'bg-orange-100' : 'hover:bg-gray-100'}`}
                          title="Mark as Off Track"
                        >
                          <AlertCircle className="w-4 h-4 text-orange-600" />
                        </button>
                        <button
                          onClick={() => handleStatusChange(rock, 'completed')}
                          className={`p-1 rounded ${rock.status === 'completed' ? 'bg-green-100' : 'hover:bg-gray-100'}`}
                          title="Mark as Completed"
                        >
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </button>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleEdit(rock)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Rock"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {rock.status !== 'archived' && (
                          <button
                            onClick={() => handleArchive(rock)}
                            className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Archive Rock"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(rock.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Rock"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
                  {editingRock ? 'Edit Rock' : 'Add New Rock'}
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
                    Rock Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter rock title..."
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe your rock..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="on-track">On Track</option>
                      <option value="off-track">Off Track</option>
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-indigo-600 transition-all duration-200"
                  >
                    {editingRock ? 'Update Rock' : 'Add Rock'}
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

export default RocksManager;
