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
  TrendingUp,
  Edit,
  Trash2,
  Plus,
  Archive,
  X,
  BarChart3,
  Activity,
  Calendar,
  Heart,
  Users,
  Activity as ActivityIcon,
  Users as UsersIcon,
  Heart as HeartIcon,
  Star,
  ArrowLeft,
  LineChart,
  TrendingDown,
  Brain
} from 'lucide-react';

const QualityOfLifeDashboard = ({ onBack, params = {} }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [checkIns, setCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(params.showAddForm || false);
  const [editingCheckIn, setEditingCheckIn] = useState(null);
  const [filter, setFilter] = useState('all'); // all, recent, archived

  // Update showAddForm when params change
  useEffect(() => {
    if (params.showAddForm) {
      setShowAddForm(true);
    }
  }, [params.showAddForm]);

  const dimensions = [
    { id: 'physical', name: 'Physical', icon: Activity, color: 'text-blue-600' },
    { id: 'mental', name: 'Mental', icon: Brain, color: 'text-purple-600' },
    { id: 'financial', name: 'Financial', icon: TrendingUp, color: 'text-green-600' },
    { id: 'friends', name: 'Friends & Community', icon: Users, color: 'text-indigo-600' },
    { id: 'marriage', name: 'Marriage', icon: Heart, color: 'text-purple-600' },
    { id: 'sex', name: 'Sex', icon: Heart, color: 'text-red-600' }
  ];

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    physical: 5,
    mental: 5,
    financial: 5,
    friends: 5,
    marriage: 5,
    sex: 5,
    notes: ''
  });

  useEffect(() => {
    if (!user?.uid) return;

    console.log('QualityOfLifeDashboard: Setting up Firestore listener for user:', user.uid);

    const q = query(
      collection(db, 'qualityOfLife'),
      where('userId', '==', user.uid)
      // Removed orderBy to avoid index requirement
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('QualityOfLifeDashboard: Firestore snapshot received, docs:', snapshot.docs.length);
      
      if (snapshot.docs.length > 0) {
        console.log('QualityOfLifeDashboard: First check-in data:', snapshot.docs[0].data());
      } else {
        console.log('QualityOfLifeDashboard: No check-ins found - this is normal for new users');
      }
      
      const checkInsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort by date in JavaScript instead of Firestore
      checkInsData.sort((a, b) => {
        if (a.date && b.date) {
          return new Date(b.date) - new Date(a.date);
        }
        return 0;
      });

      console.log('QualityOfLifeDashboard: Processed check-ins data:', checkInsData);
      setCheckIns(checkInsData);
      setLoading(false);
    }, (error) => {
      console.error('QualityOfLifeDashboard: Error fetching quality of life data:', error);
      console.error('QualityOfLifeDashboard: Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      // Only show error for actual errors, not empty data
      if (error.code !== 'permission-denied' && error.code !== 'unavailable') {
        showError('Error Loading Data', 'Failed to load quality of life data. Please try again.');
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.uid, showError]);

  // Test function to check if we can write to the collection
  const testWriteAccess = async () => {
    try {
      console.log('QualityOfLifeDashboard: Testing write access to qualityOfLife collection');
      const testDoc = await addDoc(collection(db, 'qualityOfLife'), {
        userId: user.uid,
        date: new Date().toISOString().split('T')[0],
        physical: 5,
        mental: 5,
        spiritual: 5,
        friends: 5,
        marriage: 5,
        sex: 5,
        notes: 'Test entry',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('QualityOfLifeDashboard: Write test successful, doc ID:', testDoc.id);
      
      // Delete the test document
      await deleteDoc(doc(db, 'qualityOfLife', testDoc.id));
      console.log('QualityOfLifeDashboard: Test document deleted');
      
      showSuccess('Write Access Tested', 'Write access to qualityOfLife collection is working.');
    } catch (error) {
      console.error('QualityOfLifeDashboard: Write test failed:', error);
      showError('Write Access Failed', `Failed to write to qualityOfLife collection: ${error.message}. Please check your Firebase security rules.`);
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      physical: 5,
      mental: 5,
      financial: 5,
      friends: 5,
      marriage: 5,
      sex: 5,
      notes: ''
    });
    setEditingCheckIn(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('QualityOfLifeDashboard: Submitting form with data:', formData);

    try {
      const checkInData = {
        userId: user.uid,
        date: formData.date,
        physical: formData.physical,
        mental: formData.mental,
        financial: formData.financial,
        friends: formData.friends,
        marriage: formData.marriage,
        sex: formData.sex,
        notes: formData.notes,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('QualityOfLifeDashboard: Processed check-in data:', checkInData);

      if (editingCheckIn) {
        console.log('QualityOfLifeDashboard: Updating existing check-in:', editingCheckIn.id);
        await updateDoc(doc(db, 'qualityOfLife', editingCheckIn.id), {
          ...checkInData,
          updatedAt: serverTimestamp()
        });
        console.log('QualityOfLifeDashboard: Check-in updated successfully');
        showSuccess('Check-in Updated', 'Your quality of life check-in has been updated successfully!');
      } else {
        console.log('QualityOfLifeDashboard: Adding new check-in to Firestore');
        const docRef = await addDoc(collection(db, 'qualityOfLife'), checkInData);
        console.log('QualityOfLifeDashboard: Check-in added successfully with ID:', docRef.id);
        showSuccess('Check-in Saved', 'Your quality of life check-in has been saved successfully!');
      }

      setShowAddForm(false);
      resetForm();
    } catch (error) {
      console.error('QualityOfLifeDashboard: Error saving check-in:', error);
      console.error('QualityOfLifeDashboard: Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      showError('Save Failed', `Failed to save check-in: ${error.message}. Please try again.`);
    }
  };

  const handleEdit = (checkIn) => {
    setEditingCheckIn(checkIn);
    setFormData({
      date: checkIn.date,
      physical: checkIn.physical,
      mental: checkIn.mental,
      financial: checkIn.financial,
      friends: checkIn.friends,
      marriage: checkIn.marriage,
      sex: checkIn.sex,
      notes: checkIn.notes || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (checkInId) => {
    if (window.confirm('Are you sure you want to delete this check-in?')) {
      try {
        await deleteDoc(doc(db, 'qualityOfLife', checkInId));
        showSuccess('Check-in Deleted', 'The check-in has been deleted successfully.');
      } catch (error) {
        console.error('Error deleting check-in:', error);
        showError('Delete Failed', 'Failed to delete check-in. Please try again.');
      }
    }
  };

  const handleArchive = async (checkIn) => {
    try {
      await updateDoc(doc(db, 'qualityOfLife', checkIn.id), {
        status: 'archived',
        updatedAt: serverTimestamp()
      });
      showSuccess('Check-in Archived', 'The check-in has been archived successfully.');
    } catch (error) {
      console.error('Error archiving check-in:', error);
      showError('Archive Failed', 'Failed to archive check-in. Please try again.');
    }
  };

  const getAverageScore = (checkIn) => {
    const scores = [checkIn.physical, checkIn.mental, checkIn.financial, checkIn.friends, checkIn.marriage, checkIn.sex];
    return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    if (score >= 4) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 8) return 'bg-green-100';
    if (score >= 6) return 'bg-yellow-100';
    if (score >= 4) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const renderLineGraph = () => {
    console.log('QualityOfLifeDashboard: Rendering line graph with checkIns:', checkIns.length);
    
    if (checkIns.length === 0) {
      console.log('QualityOfLifeDashboard: No check-ins to display in graph');
      return (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <LineChart className="w-5 h-5 mr-2 text-purple-500" />
            Quality of Life Trends
          </h3>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <LineChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No data to display yet</p>
              <p className="text-sm text-gray-400">Complete your first check-in to see trends</p>
            </div>
          </div>
        </div>
      );
    }

    const sortedCheckIns = [...checkIns].sort((a, b) => new Date(a.date) - new Date(b.date));
    const recentCheckIns = sortedCheckIns.slice(-10); // Last 10 check-ins
    
    console.log('QualityOfLifeDashboard: Recent check-ins for graph:', recentCheckIns.length);

    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <LineChart className="w-5 h-5 mr-2 text-purple-500" />
          Quality of Life Trends
        </h3>
        
        {/* Line Chart */}
        <div className="h-64 relative">
          <svg className="w-full h-full" viewBox="0 0 1000 200" preserveAspectRatio="none">
            {/* Grid lines */}
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((tick) => (
              <g key={tick}>
                <line
                  x1="0"
                  y1={200 - (tick * 20)}
                  x2="1000"
                  y2={200 - (tick * 20)}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
                <text
                  x="0"
                  y={200 - (tick * 20) + 15}
                  fontSize="12"
                  fill="#6b7280"
                  textAnchor="end"
                >
                  {tick}
                </text>
              </g>
            ))}

            {/* Draw lines for each dimension */}
            {dimensions.map((dimension, dimIndex) => {
              const points = recentCheckIns.map((checkIn, index) => {
                const x = recentCheckIns.length === 1 ? 500 : (index / (recentCheckIns.length - 1)) * 900 + 50;
                const y = 200 - (checkIn[dimension.id] * 20);
                return `${x},${y}`;
              }).join(' ');

              const colors = ['#3b82f6', '#8b5cf6', '#eab308', '#22c55e', '#ec4899', '#ef4444'];
              
              console.log(`QualityOfLifeDashboard: Drawing line for ${dimension.name} with points:`, points);
              
              return (
                <g key={dimension.id}>
                  <polyline
                    fill="none"
                    stroke={colors[dimIndex]}
                    strokeWidth="3"
                    points={points}
                  />
                  {/* Data points */}
                  {recentCheckIns.map((checkIn, index) => {
                    const x = recentCheckIns.length === 1 ? 500 : (index / (recentCheckIns.length - 1)) * 900 + 50;
                    const y = 200 - (checkIn[dimension.id] * 20);
                    return (
                      <circle
                        key={`${dimension.id}-${index}`}
                        cx={x}
                        cy={y}
                        r="4"
                        fill={colors[dimIndex]}
                        stroke="white"
                        strokeWidth="2"
                      />
                    );
                  })}
                </g>
              );
            })}

            {/* X-axis labels */}
            {recentCheckIns.map((checkIn, index) => {
              const x = recentCheckIns.length === 1 ? 500 : (index / (recentCheckIns.length - 1)) * 900 + 50;
              return (
                <g key={`label-${index}`}>
                  <text
                    x={x}
                    y="220"
                    fontSize="10"
                    fill="#6b7280"
                    textAnchor="middle"
                  >
                    {new Date(checkIn.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center mt-4 space-x-4">
          {dimensions.map((dimension, index) => {
            const colors = ['#3b82f6', '#8b5cf6', '#eab308', '#22c55e', '#ec4899', '#ef4444'];
            return (
              <div key={dimension.id} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: colors[index] }}
                ></div>
                <span className="text-xs text-gray-600">{dimension.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const filteredCheckIns = checkIns.filter(checkIn => {
    if (filter === 'all') return checkIn.status !== 'archived';
    if (filter === 'recent') return checkIn.status !== 'archived' && new Date(checkIn.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (filter === 'archived') return checkIn.status === 'archived';
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quality of life…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Quality of Life Dashboard</h1>
              <p className="text-gray-600">Track your well-being across all dimensions</p>
            </div>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowAddForm(true);
            }}
            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-600 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Check-in</span>
          </button>
        </div>

        {/* Line Graph */}
        {renderLineGraph()}

        {/* Filter Tabs */}
        <div className="flex space-x-1 mb-6">
          {[
            { key: 'all', label: 'All Check-ins', count: checkIns.filter(c => c.status !== 'archived').length },
            { key: 'recent', label: 'Recent (30 days)', count: checkIns.filter(c => c.status !== 'archived' && new Date(c.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length },
            { key: 'archived', label: 'Archived', count: checkIns.filter(c => c.status === 'archived').length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                filter === tab.key
                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Check-ins List */}
        <div className="space-y-4">
          {console.log('QualityOfLifeDashboard: Rendering check-ins list, filteredCheckIns:', filteredCheckIns.length)}
          {filteredCheckIns.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {filter === 'all' ? 'No check-ins yet' : `No ${filter} check-ins`}
              </h3>
              <p className="text-gray-500 mb-6">
                {filter === 'all'
                  ? 'Start tracking your quality of life across all dimensions!'
                  : `No check-ins in the ${filter} category.`
                }
              </p>
              {filter === 'all' && (
                <button
                  onClick={() => {
                    resetForm();
                    setShowAddForm(true);
                  }}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-600 hover:to-purple-700 transition-all duration-200"
                >
                  Start Your First Check-in
                </button>
              )}
            </div>
          ) : (
            filteredCheckIns.map((checkIn) => {
              console.log('QualityOfLifeDashboard: Rendering check-in:', checkIn);
              return (
                <div key={checkIn.id} className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {new Date(checkIn.date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreBgColor(getAverageScore(checkIn))} ${getScoreColor(getAverageScore(checkIn))}`}>
                          Avg: {getAverageScore(checkIn)}
                        </span>
                      </div>

                      {/* Dimension Scores */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                        {dimensions.map((dimension) => (
                          <div key={dimension.id} className="flex items-center space-x-3">
                            <div className={`${dimension.bgColor} p-2 rounded-full`}>
                              <dimension.icon className={`w-4 h-4 ${dimension.color}`} />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-700">{dimension.name}</p>
                              <p className={`text-lg font-bold ${getScoreColor(checkIn[dimension.id])}`}>
                                {checkIn[dimension.id]}/10
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {checkIn.notes && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                          <p className="text-sm text-gray-700">{checkIn.notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEdit(checkIn)}
                        className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Edit Check-in"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {checkIn.status !== 'archived' && (
                        <button
                          onClick={() => handleArchive(checkIn)}
                          className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Archive Check-in"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(checkIn.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Check-in"
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
                  {editingCheckIn ? 'Edit Check-in' : 'New Quality of Life Check-in'}
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

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Dimension Ratings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Rate Each Dimension (1-10)</h3>
                  {dimensions.map((dimension) => (
                    <div key={dimension.id} className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <div className={`${dimension.bgColor} p-2 rounded-full`}>
                          <dimension.icon className={`w-4 h-4 ${dimension.color}`} />
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700">
                            {dimension.name}
                          </label>
                          <p className="text-xs text-gray-500">{dimension.description}</p>
                        </div>
                        <span className={`text-lg font-bold ${getScoreColor(formData[dimension.id])}`}>
                          {formData[dimension.id]}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={formData[dimension.id]}
                        onChange={(e) => setFormData({ ...formData, [dimension.id]: parseInt(e.target.value) })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>1 - Poor</span>
                        <span>5 - Average</span>
                        <span>10 - Excellent</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Add any notes about your quality of life..."
                    rows={3}
                  />
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
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-purple-700 transition-all duration-200"
                  >
                    {editingCheckIn ? 'Update Check-in' : 'Save Check-in'}
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

export default QualityOfLifeDashboard;
