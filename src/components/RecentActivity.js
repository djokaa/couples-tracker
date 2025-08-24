import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  Activity,
  ArrowLeft,
  Calendar,
  Target,
  CheckSquare,
  AlertTriangle,
  TrendingUp,
  Heart,
  Users,
  Clock,
  Filter,
  Search
} from 'lucide-react';

const RecentActivity = ({ onBack }) => {
  const { user } = useAuth();
  const { showError } = useNotification();
  const [allActivity, setAllActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, rocks, todos, issues, meetings, quality-of-life
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user?.uid) return;

    console.log('RecentActivity: Setting up Firestore listeners for user:', user.uid);

    const activity = [];

    // Fetch rocks activity
    const rocksQuery = query(
      collection(db, 'rocks'),
      where('userId', '==', user.uid)
    );

    const unsubscribeRocks = onSnapshot(rocksQuery, (snapshot) => {
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        activity.push({
          id: doc.id,
          type: 'rocks',
          title: data.title,
          status: data.status,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          icon: Target,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          description: `Annual Rock: ${data.title}`,
          action: data.status === 'completed' ? 'Completed' : data.status === 'archived' ? 'Archived' : 'Created',
          assignedTo: data.assignedTo || user.uid,
          userName: data.assignedTo === user.uid ? 'You' : 'Partner'
        });
      });
    });

    // Fetch todos activity
    const todosQuery = query(
      collection(db, 'todos'),
      where('userId', '==', user.uid)
    );

    const unsubscribeTodos = onSnapshot(todosQuery, (snapshot) => {
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        activity.push({
          id: doc.id,
          type: 'todos',
          title: data.title,
          status: data.status,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          icon: CheckSquare,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          description: `To-Do: ${data.title}`,
          action: data.status === 'completed' ? 'Completed' : data.status === 'archived' ? 'Archived' : 'Created',
          assignedTo: data.assignedTo || user.uid,
          userName: data.assignedTo === user.uid ? 'You' : 'Partner'
        });
      });
    });

    // Fetch issues activity
    const issuesQuery = query(
      collection(db, 'issues'),
      where('userId', '==', user.uid)
    );

    const unsubscribeIssues = onSnapshot(issuesQuery, (snapshot) => {
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        activity.push({
          id: doc.id,
          type: 'issues',
          title: data.name,
          status: data.status,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          icon: AlertTriangle,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          description: `Issue: ${data.name}`,
          action: data.status === 'resolved' ? 'Resolved' : data.status === 'archived' ? 'Archived' : 'Created',
          enteredBy: data.enteredBy || user.uid,
          userName: data.enteredBy === user.uid ? 'You' : 'Partner'
        });
      });
    });

    // Fetch meetings activity
    const meetingsQuery = query(
      collection(db, 'meetings'),
      where('userId', '==', user.uid)
    );

    const unsubscribeMeetings = onSnapshot(meetingsQuery, (snapshot) => {
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        activity.push({
          id: doc.id,
          type: 'meetings',
          title: data.title || 'Weekly Meeting',
          status: data.status,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          icon: Calendar,
          color: 'text-pink-600',
          bgColor: 'bg-pink-50',
          description: `Meeting: ${data.title || 'Weekly Meeting'}`,
          action: data.status === 'completed' ? 'Completed' : 'Created',
          userName: 'Both Partners'
        });
      });
    });

    // Fetch quality of life activity
    const qualityOfLifeQuery = query(
      collection(db, 'qualityOfLife'),
      where('userId', '==', user.uid)
    );

    const unsubscribeQualityOfLife = onSnapshot(qualityOfLifeQuery, (snapshot) => {
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const avgScore = (data.physical + data.mental + data.spiritual + data.friends + data.marriage + data.sex) / 6;
        activity.push({
          id: doc.id,
          type: 'quality-of-life',
          title: `Quality of Life Check-in`,
          status: 'completed',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          icon: TrendingUp,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          description: `Quality of Life Check-in (Avg: ${avgScore.toFixed(1)}/10)`,
          action: 'Completed',
          date: data.date,
          userName: 'Both Partners'
        });
      });
    });

    // Sort all activity by creation date
    const sortAndSetActivity = () => {
      const sortedActivity = [...activity].sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt.toDate() - a.createdAt.toDate();
        }
        return 0;
      });
      setAllActivity(sortedActivity);
      setLoading(false);
    };

    // Set up interval to sort activity periodically
    const interval = setInterval(sortAndSetActivity, 1000);

    return () => {
      unsubscribeRocks();
      unsubscribeTodos();
      unsubscribeIssues();
      unsubscribeMeetings();
      unsubscribeQualityOfLife();
      clearInterval(interval);
    };
  }, [user.uid]);

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Recently';
    const now = new Date();
    const time = timestamp.toDate();
    const diffInHours = (now - time) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return `${Math.floor(diffInHours / 168)}w ago`;
  };

  const filteredActivity = allActivity.filter(item => {
    const matchesFilter = filter === 'all' || item.type === filter;
    const matchesSearch = searchTerm === '' || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filterOptions = [
    { key: 'all', label: 'All Activity', count: allActivity.length },
    { key: 'rocks', label: 'Rocks', count: allActivity.filter(a => a.type === 'rocks').length },
    { key: 'todos', label: 'To-Dos', count: allActivity.filter(a => a.type === 'todos').length },
    { key: 'issues', label: 'Issues', count: allActivity.filter(a => a.type === 'issues').length },
    { key: 'meetings', label: 'Meetings', count: allActivity.filter(a => a.type === 'meetings').length },
    { key: 'quality-of-life', label: 'Quality of Life', count: allActivity.filter(a => a.type === 'quality-of-life').length }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading activity...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Recent Activity</h1>
              <p className="text-gray-600">Complete audit trail of all app activity</p>
            </div>
          </div>
          
          {/* Search - Top Right */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search activity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => setFilter(option.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filter === option.key
                    ? 'bg-pink-100 text-pink-700 border border-pink-200'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                {option.label} ({option.count})
              </button>
            ))}
          </div>
        </div>

        {/* Activity List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-pink-500" />
            Activity Feed
          </h3>

          <div className="space-y-2">
            {filteredActivity.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  {searchTerm ? 'No matching activity found' : 'No activity yet'}
                </h3>
                <p className="text-gray-500">
                  {searchTerm ? 'Try adjusting your search terms.' : 'Start using the app to see activity here!'}
                </p>
              </div>
            ) : (
              filteredActivity.map((item, index) => (
                <div key={`${item.type}-${item.id}-${index}`} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
                  <div className={`${item.bgColor} p-2 rounded-full flex-shrink-0`}>
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-800 truncate">
                          {item.title}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.action === 'Completed' ? 'bg-green-100 text-green-700' :
                          item.action === 'Created' ? 'bg-blue-100 text-blue-700' :
                          item.action === 'Archived' ? 'bg-gray-100 text-gray-700' :
                          item.action === 'Resolved' ? 'bg-green-100 text-green-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {item.action}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                        <span className="text-gray-600 font-medium">{item.userName}</span>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeAgo(item.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 truncate">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentActivity;
