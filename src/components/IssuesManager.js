import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
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
  AlertTriangle,
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
  Priority,
  MessageSquare
} from 'lucide-react';

const IssuesManager = ({ onBack, params = {} }) => {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(params.showAddForm || false);
  const [editingIssue, setEditingIssue] = useState(null);
  const [filter, setFilter] = useState('all'); // all, my-issues, active, resolved, archived

  console.log('IssuesManager: Component rendered, user:', user?.uid, 'params:', params);

  // Mock users for now - in a real app, you'd fetch this from Firestore
  const availableUsers = [
    { id: user?.uid, name: user?.displayName || 'You', email: user?.email },
    { id: 'partner1', name: 'Partner 1', email: 'partner1@example.com' },
    { id: 'partner2', name: 'Partner 2', email: 'partner2@example.com' }
  ];

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priority: 'medium',
    status: 'open',
    attachments: [],
    enteredBy: user?.uid || ''
  });

  // Update showAddForm when params change
  useEffect(() => {
    if (params.showAddForm) {
      setShowAddForm(true);
    }
  }, [params.showAddForm]);

  useEffect(() => {
    console.log('IssuesManager: useEffect triggered, user:', user?.uid);
    
    if (!user?.uid) {
      console.log('IssuesManager: No user, skipping query');
      return;
    }

    const q = query(
      collection(db, 'issues'),
      where('userId', '==', user.uid)
    );

    console.log('IssuesManager: Setting up Firestore listener for user:', user.uid);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('IssuesManager: Firestore snapshot received, docs:', snapshot.docs.length);
      
      if (snapshot.docs.length > 0) {
        console.log('IssuesManager: First issue data:', snapshot.docs[0].data());
      }
      
      const issuesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by createdAt in JavaScript instead of Firestore
      issuesData.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt.toDate() - a.createdAt.toDate();
        }
        return 0;
      });
      
      console.log('IssuesManager: Processed issues data:', issuesData);
      setIssues(issuesData);
      setLoading(false);
    }, (error) => {
      console.error('IssuesManager: Firestore error:', error);
      console.error('IssuesManager: Error details:', {
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
      name: '',
      description: '',
      priority: 'medium',
      status: 'open',
      attachments: [],
      enteredBy: user?.uid || ''
    });
    setEditingIssue(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('IssuesManager: Form submitted!');
    
    try {
      console.log('IssuesManager: Submitting issue data:', formData);
      
      const issueData = {
        userId: user.uid,
        name: formData.name.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        status: formData.status,
        attachments: formData.attachments,
        enteredBy: formData.enteredBy,
        enteredByName: availableUsers.find(u => u.id === formData.enteredBy)?.name || 'Unknown',
        statusChangedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('IssuesManager: Processed issue data:', issueData);

      if (editingIssue) {
        console.log('IssuesManager: Updating existing issue:', editingIssue.id);
        await updateDoc(doc(db, 'issues', editingIssue.id), {
          ...issueData,
          updatedAt: serverTimestamp()
        });
        console.log('IssuesManager: Issue updated successfully');
      } else {
        console.log('IssuesManager: Adding new issue to Firestore');
        const docRef = await addDoc(collection(db, 'issues'), issueData);
        console.log('IssuesManager: Issue added successfully with ID:', docRef.id);
      }

      setShowAddForm(false);
      resetForm();
    } catch (error) {
      console.error('IssuesManager: Error saving issue:', error);
      console.error('IssuesManager: Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      alert(`Error saving issue: ${error.message}. Please check your Firebase configuration.`);
    }
  };

  const handleEdit = (issue) => {
    setEditingIssue(issue);
    setFormData({
      name: issue.name,
      description: issue.description,
      priority: issue.priority,
      status: issue.status,
      attachments: issue.attachments || [],
      enteredBy: issue.enteredBy || user?.uid || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (issueId) => {
    if (window.confirm('Are you sure you want to delete this issue?')) {
      try {
        await deleteDoc(doc(db, 'issues', issueId));
      } catch (error) {
        console.error('Error deleting issue:', error);
        alert('Error deleting issue. Please try again.');
      }
    }
  };

  const handleArchive = async (issue) => {
    try {
      await updateDoc(doc(db, 'issues', issue.id), {
        status: 'archived',
        statusChangedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error archiving issue:', error);
      alert('Error archiving issue. Please try again.');
    }
  };

  const handleStatusChange = async (issue, newStatus) => {
    try {
      await updateDoc(doc(db, 'issues', issue.id), {
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
      case 'resolved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'open':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'in-progress':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'on-hold':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'archived':
        return <Archive className="w-5 h-5 text-gray-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'open':
        return 'bg-red-100 text-red-800 border-red-200';
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

  const isMyIssue = (issue) => {
    return issue.enteredBy === user?.uid;
  };

  const getStatusDuration = (issue) => {
    if (!issue.statusChangedAt) return 'Unknown';
    
    const statusChangedAt = issue.statusChangedAt.toDate ? issue.statusChangedAt.toDate() : new Date(issue.statusChangedAt);
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

  const filteredIssues = issues.filter(issue => {
    if (filter === 'all') return issue.status !== 'archived';
    if (filter === 'my-issues') return issue.status !== 'archived' && isMyIssue(issue);
    if (filter === 'active') return issue.status === 'open' || issue.status === 'in-progress';
    if (filter === 'resolved') return issue.status === 'resolved';
    if (filter === 'archived') return issue.status === 'archived';
    return true;
  });

  const stats = {
    total: issues.filter(i => i.status !== 'archived').length,
    myIssues: issues.filter(i => i.status !== 'archived' && isMyIssue(i)).length,
    open: issues.filter(i => i.status === 'open').length,
    inProgress: issues.filter(i => i.status === 'in-progress').length,
    onHold: issues.filter(i => i.status === 'on-hold').length,
    resolved: issues.filter(i => i.status === 'resolved').length,
    archived: issues.filter(i => i.status === 'archived').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading issues...</p>
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
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Issues (IDS)</h1>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowAddForm(true);
              }}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Issue</span>
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-1 mb-6">
            {[
              { key: 'all', label: 'All', count: stats.total },
              { key: 'my-issues', label: 'My Issues', count: stats.myIssues },
              { key: 'active', label: 'Active', count: stats.open + stats.inProgress },
              { key: 'resolved', label: 'Resolved', count: stats.resolved },
              { key: 'archived', label: 'Archived', count: stats.archived }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  filter === tab.key
                    ? 'bg-orange-100 text-orange-700 border border-orange-200'
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
              <div className="bg-orange-100 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-orange-600">{stats.total}</p>
              <p className="text-xs text-gray-600">Total Issues</p>
            </div>
            <div className="text-center">
              <div className="bg-red-100 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-600">{stats.open}</p>
              <p className="text-xs text-gray-600">Open</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-orange-600">{stats.inProgress}</p>
              <p className="text-xs text-gray-600">In Progress</p>
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

        {/* Issues List */}
        <div className="space-y-4">
          {console.log('IssuesManager: Rendering issues list, filteredIssues:', filteredIssues.length)}
          {filteredIssues.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {filter === 'all' ? 'No issues yet' : `No ${filter} issues`}
              </h3>
              <p className="text-gray-500 mb-6">
                {filter === 'all' 
                  ? 'Start by adding your first issue!' 
                  : `No issues in the ${filter} category.`
                }
              </p>
              {filter === 'all' && (
                <button
                  onClick={() => {
                    resetForm();
                    setShowAddForm(true);
                  }}
                  className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200"
                >
                  Add Your First Issue
                </button>
              )}
            </div>
          ) : (
            filteredIssues.map((issue) => {
              console.log('IssuesManager: Rendering issue:', issue);
              return (
                <div key={issue.id} className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-800">{issue.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(issue.status)}`}>
                          {issue.status.replace('-', ' ')}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(issue.priority)}`}>
                          {issue.priority}
                        </span>
                        <div className="flex items-center space-x-2">
                          <User className={`w-4 h-4 ${isMyIssue(issue) ? 'text-orange-600' : 'text-gray-500'}`} />
                          <span className={`text-xs font-medium ${isMyIssue(issue) ? 'text-orange-600' : 'text-gray-600'}`}>
                            {issue.enteredByName || getUserName(issue.enteredBy)}
                            {isMyIssue(issue) && ' (You)'}
                          </span>
                        </div>
                      </div>
                      
                      {issue.description && (
                        <p className="text-gray-600 mb-4">{issue.description}</p>
                      )}

                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>In {issue.status.replace('-', ' ')} for {getStatusDuration(issue)}</span>
                        </div>
                        {issue.attachments && issue.attachments.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <Paperclip className="w-4 h-4" />
                            <span>{issue.attachments.length} attachment(s)</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {/* Status Quick Actions */}
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleStatusChange(issue, 'open')}
                          className={`p-1 rounded ${issue.status === 'open' ? 'bg-red-100' : 'hover:bg-gray-100'}`}
                          title="Mark as Open"
                        >
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        </button>
                        <button
                          onClick={() => handleStatusChange(issue, 'in-progress')}
                          className={`p-1 rounded ${issue.status === 'in-progress' ? 'bg-orange-100' : 'hover:bg-gray-100'}`}
                          title="Mark as In Progress"
                        >
                          <AlertCircle className="w-4 h-4 text-orange-600" />
                        </button>
                        <button
                          onClick={() => handleStatusChange(issue, 'on-hold')}
                          className={`p-1 rounded ${issue.status === 'on-hold' ? 'bg-yellow-100' : 'hover:bg-gray-100'}`}
                          title="Mark as On Hold"
                        >
                          <Clock className="w-4 h-4 text-yellow-600" />
                        </button>
                        <button
                          onClick={() => handleStatusChange(issue, 'resolved')}
                          className={`p-1 rounded ${issue.status === 'resolved' ? 'bg-green-100' : 'hover:bg-gray-100'}`}
                          title="Mark as Resolved"
                        >
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </button>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleEdit(issue)}
                          className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Edit Issue"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {issue.status !== 'archived' && (
                          <button
                            onClick={() => handleArchive(issue)}
                            className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Archive Issue"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(issue.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Issue"
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
                  {editingIssue ? 'Edit Issue' : 'Add New Issue'}
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
                    Issue Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter issue name..."
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Describe the issue..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="on-hold">On Hold</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Entered By
                  </label>
                  <select
                    value={formData.enteredBy}
                    onChange={(e) => setFormData({ ...formData, enteredBy: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200"
                  >
                    {editingIssue ? 'Update Issue' : 'Add Issue'}
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

export default IssuesManager;
