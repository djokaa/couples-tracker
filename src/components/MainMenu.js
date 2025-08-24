import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { 
  Target, 
  CheckSquare, 
  AlertTriangle, 
  Calendar,
  Users,
  TrendingUp,
  Play,
  Plus,
  Clock,
  Star,
  Activity,
  BarChart3,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  CalendarDays,
  Target as TargetIcon,
  CheckSquare as CheckSquareIcon,
  AlertTriangle as AlertTriangleIcon,
  LineChart
} from 'lucide-react';
import { collection, query, where, onSnapshot, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { 
  QuickAddRockModal, 
  QuickAddTodoModal, 
  QuickAddIssueModal, 
  QuickQualityOfLifeModal 
} from './QuickActionModals';

const MainMenu = ({ onNavigate }) => {
  const { user } = useAuth();
  const { showSuccess } = useNotification();
  const [stats, setStats] = useState({
    rocks: 0,
    todos: 0,
    meetings: 0,
    issues: 0,
    completedTodos: 0,
    completedRocks: 0,
    resolvedIssues: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [qualityOfLifeData, setQualityOfLifeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [partnerInfo, setPartnerInfo] = useState(null);
  const [couple, setCouple] = useState(null);
  const [nextMeetings, setNextMeetings] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Modal states
  const [showRockModal, setShowRockModal] = useState(false);
  const [showTodoModal, setShowTodoModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showQualityOfLifeModal, setShowQualityOfLifeModal] = useState(false);

  // Fetch real statistics and recent activity
  useEffect(() => {
    if (!user?.uid) return;

    // Fetch rocks count
    const rocksQuery = query(
      collection(db, 'rocks'),
      where('userId', '==', user.uid)
    );

    const unsubscribeRocks = onSnapshot(rocksQuery, (snapshot) => {
      const activeRocks = snapshot.docs.filter(doc => {
        const data = doc.data();
        return data.status !== 'archived';
      }).length;

      const completedRocks = snapshot.docs.filter(doc => {
        const data = doc.data();
        return data.status === 'completed';
      }).length;

      setStats(prev => ({
        ...prev,
        rocks: activeRocks,
        completedRocks
      }));
    });

    // Fetch todos count
    const todosQuery = query(
      collection(db, 'todos'),
      where('userId', '==', user.uid)
    );

    const unsubscribeTodos = onSnapshot(todosQuery, (snapshot) => {
      const activeTodos = snapshot.docs.filter(doc => {
        const data = doc.data();
        return data.status !== 'completed' && data.status !== 'archived';
      }).length;

      const completedTodos = snapshot.docs.filter(doc => {
        const data = doc.data();
        return data.status === 'completed';
      }).length;

      setStats(prev => ({
        ...prev,
        todos: activeTodos,
        completedTodos
      }));
    });

    // Fetch meetings count
    const meetingsQuery = query(
      collection(db, 'meetings'),
      where('userId', '==', user.uid)
    );

    const unsubscribeMeetings = onSnapshot(meetingsQuery, (snapshot) => {
      setStats(prev => ({
        ...prev,
        meetings: snapshot.docs.length
      }));
    });

    // Fetch issues count
    const issuesQuery = query(
      collection(db, 'issues'),
      where('userId', '==', user.uid)
    );

    const unsubscribeIssues = onSnapshot(issuesQuery, (snapshot) => {
      const activeIssues = snapshot.docs.filter(doc => {
        const data = doc.data();
        return data.status !== 'archived';
      }).length;

      const resolvedIssues = snapshot.docs.filter(doc => {
        const data = doc.data();
        return data.status === 'resolved';
      }).length;

      setStats(prev => ({
        ...prev,
        issues: activeIssues,
        resolvedIssues
      }));
    });

    // Fetch quality of life data for mini graph
    const qualityOfLifeQuery = query(
      collection(db, 'qualityOfLife'),
      where('userId', '==', user.uid)
    );

    const unsubscribeQualityOfLife = onSnapshot(qualityOfLifeQuery, (snapshot) => {
      const qualityData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-5); // Last 5 check-ins

      setQualityOfLifeData(qualityData);
    });

    // Fetch recent activity
    const fetchRecentActivity = async () => {
      try {
        console.log('MainMenu: Starting to fetch recent activity for user:', user.uid);
        const activity = [];
        
        // Recent rocks
        const recentRocksQuery = query(
          collection(db, 'rocks'),
          where('userId', '==', user.uid)
          // Removed orderBy to avoid composite index requirement
        );
        
        try {
          const rocksSnapshot = await getDocs(recentRocksQuery);
          console.log('MainMenu: Fetched rocks, count:', rocksSnapshot.docs.length);
          rocksSnapshot.docs.forEach(doc => {
            const data = doc.data();
            activity.push({
              id: doc.id,
              type: 'rocks',
              title: data.title,
              status: data.status,
              createdAt: data.createdAt,
              icon: TargetIcon,
              color: 'text-blue-600',
              bgColor: 'bg-blue-50',
              userName: data.assignedTo === user.uid ? 'You' : 'Partner'
            });
          });
        } catch (error) {
          console.error('MainMenu: Error fetching rocks:', error);
        }

        // Recent todos
        const recentTodosQuery = query(
          collection(db, 'todos'),
          where('userId', '==', user.uid)
          // Removed orderBy to avoid composite index requirement
        );
        
        try {
          const todosSnapshot = await getDocs(recentTodosQuery);
          console.log('MainMenu: Fetched todos, count:', todosSnapshot.docs.length);
          todosSnapshot.docs.forEach(doc => {
            const data = doc.data();
            activity.push({
              id: doc.id,
              type: 'todos',
              title: data.title,
              status: data.status,
              createdAt: data.createdAt,
              icon: CheckSquareIcon,
              color: 'text-green-600',
              bgColor: 'bg-green-50',
              userName: data.assignedTo === user.uid ? 'You' : 'Partner'
            });
          });
        } catch (error) {
          console.error('MainMenu: Error fetching todos:', error);
        }

        // Recent issues
        const recentIssuesQuery = query(
          collection(db, 'issues'),
          where('userId', '==', user.uid)
          // Removed orderBy to avoid composite index requirement
        );
        
        try {
          const issuesSnapshot = await getDocs(recentIssuesQuery);
          console.log('MainMenu: Fetched issues, count:', issuesSnapshot.docs.length);
          issuesSnapshot.docs.forEach(doc => {
            const data = doc.data();
            activity.push({
              id: doc.id,
              type: 'issues',
              title: data.name,
              status: data.status,
              createdAt: data.createdAt,
              icon: AlertTriangleIcon,
              color: 'text-orange-600',
              bgColor: 'bg-orange-50',
              userName: data.enteredBy === user.uid ? 'You' : 'Partner'
            });
          });
        } catch (error) {
          console.error('MainMenu: Error fetching issues:', error);
        }

        // Recent meetings
        const recentMeetingsQuery = query(
          collection(db, 'meetings'),
          where('userId', '==', user.uid)
          // Removed orderBy to avoid composite index requirement
        );
        
        try {
          const meetingsSnapshot = await getDocs(recentMeetingsQuery);
          console.log('MainMenu: Fetched meetings, count:', meetingsSnapshot.docs.length);
          meetingsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            activity.push({
              id: doc.id,
              type: 'meetings',
              title: data.title || 'Weekly Meeting',
              status: data.status,
              createdAt: data.createdAt,
              icon: Calendar,
              color: 'text-pink-600',
              bgColor: 'bg-pink-50',
              userName: 'Both Partners'
            });
          });
        } catch (error) {
          console.error('MainMenu: Error fetching meetings:', error);
        }

        // Recent quality of life check-ins
        const recentQoLQuery = query(
          collection(db, 'qualityOfLife'),
          where('userId', '==', user.uid)
          // Removed orderBy to avoid composite index requirement
        );
        
        try {
          const qoLSnapshot = await getDocs(recentQoLQuery);
          console.log('MainMenu: Fetched quality of life, count:', qoLSnapshot.docs.length);
          qoLSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const avgScore = (data.physical + data.mental + data.spiritual + data.friends + data.marriage + data.sex) / 6;
            activity.push({
              id: doc.id,
              type: 'quality-of-life',
              title: `QoL Check-in (${avgScore.toFixed(1)}/10)`,
              status: 'completed',
              createdAt: data.createdAt,
              icon: TrendingUp,
              color: 'text-purple-600',
              bgColor: 'bg-purple-50',
              userName: 'Both Partners'
            });
          });
        } catch (error) {
          console.error('MainMenu: Error fetching quality of life:', error);
        }

        console.log('MainMenu: Total activity items before sorting:', activity.length);

        // Sort by creation date and take top 5
        activity.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return b.createdAt.toDate() - a.createdAt.toDate();
          }
          // If one has createdAt and the other doesn't, prioritize the one with createdAt
          if (a.createdAt && !b.createdAt) return -1;
          if (!a.createdAt && b.createdAt) return 1;
          return 0;
        });

        const top5Activity = activity.slice(0, 5);
        console.log('MainMenu: Final activity items to display:', top5Activity.length);
        console.log('MainMenu: Activity items:', top5Activity.map(item => ({ 
          type: item.type, 
          title: item.title, 
          createdAt: item.createdAt,
          hasCreatedAt: !!item.createdAt
        })));

        setRecentActivity(top5Activity);
        setLoading(false);
      } catch (error) {
        console.error('MainMenu: Error in fetchRecentActivity:', error);
        setLoading(false);
      }
    };

    fetchRecentActivity();

    return () => {
      unsubscribeRocks();
      unsubscribeTodos();
      unsubscribeMeetings();
      unsubscribeIssues();
      unsubscribeQualityOfLife();
    };
  }, [user.uid]);

  // Load partner and couple info
  useEffect(() => {
    const loadPartnerAndCouple = async () => {
      if (!user?.uid) return;
      try {
        const userDoc = await getDoc(doc(db, 'userProfiles', user.uid));
        const loadedNotifications = [];
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.coupleId) {
            const coupleSnap = await getDoc(doc(db, 'couples', userData.coupleId));
            if (coupleSnap.exists()) {
              const coupleData = coupleSnap.data();
              setCouple({ id: coupleSnap.id, ...coupleData });
              const partner = (coupleData.partners || []).find(p => p.uid !== user.uid && !p.isDummy);
              setPartnerInfo(partner || null);
              if (coupleData.invitationStatus === 'pending') {
                loadedNotifications.push({
                  id: 'invite-pending',
                  type: 'invite',
                  message: `Invitation sent to ${coupleData.invitationEmail || 'partner'} – awaiting acceptance.`,
                });
              }
            }
          } else {
            loadedNotifications.push({
              id: 'no-partner',
              type: 'info',
              message: 'No partner linked yet. Invite your partner from Profile → My Partner.',
            });
          }
        }

        // Load next meetings (scheduled)
        try {
          const meetingsQ = query(
            collection(db, 'weeklyMeetings'),
            where('userId', '==', user.uid)
          );
          const meetingsSnap = await getDocs(meetingsQ);
          const meetingsData = meetingsSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(m => m.status === 'scheduled' && !!m.scheduledDate)
            .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))
            .slice(0, 2);
          setNextMeetings(meetingsData);
          if (meetingsData.length > 0) {
            loadedNotifications.push({
              id: 'next-meeting',
              type: 'meeting',
              message: `Next meeting on ${new Date(meetingsData[0].scheduledDate).toLocaleString()}.`,
            });
          }
        } catch (e) {
          // ignore
        }

        setNotifications(loadedNotifications);
      } catch (e) {
        // ignore
      }
    };
    loadPartnerAndCouple();
  }, [user?.uid]);

  const handleStartMeeting = () => {
    // Navigate directly to the new meeting flow
    onNavigate('meeting-flow');
  };

  const handleAddRock = () => {
    // Open rock modal instead of navigating
    setShowRockModal(true);
  };

  const handleAddTodo = () => {
    // Open todo modal instead of navigating
    setShowTodoModal(true);
  };

  const handleQualityOfLifeCheckIn = () => {
    // Open quality of life modal instead of navigating
    setShowQualityOfLifeModal(true);
  };

  const handleAddIssue = () => {
    // Open issue modal instead of navigating
    setShowIssueModal(true);
  };

  const handleNavigateToSection = (section) => {
    onNavigate(section);
  };

  // Success handlers for modals
  const handleRockSuccess = () => {
    // Refresh stats after adding rock
    // The stats will automatically update via the existing useEffect
  };

  const handleTodoSuccess = () => {
    // Refresh stats after adding todo
    // The stats will automatically update via the existing useEffect
  };

  const handleIssueSuccess = () => {
    // Refresh stats after adding issue
    // The stats will automatically update via the existing useEffect
  };

  const handleQualityOfLifeSuccess = () => {
    // Refresh stats after adding quality of life check-in
    // The stats will automatically update via the existing useEffect
  };

  const quickActions = [
    {
      id: 'quality-of-life',
      title: 'Quality of Life',
      description: 'Check-in',
      icon: TrendingUp,
      color: 'from-purple-500 to-indigo-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      action: handleQualityOfLifeCheckIn
    },
    {
      id: 'meetings',
      title: 'Start Meeting',
      description: 'Weekly',
      icon: Play,
      color: 'from-pink-500 to-rose-500',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200',
      action: handleStartMeeting
    },
    {
      id: 'rocks',
      title: 'Add Rock',
      description: 'Annual',
      icon: Plus,
      color: 'from-blue-500 to-indigo-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      action: handleAddRock
    },
    {
      id: 'todos',
      title: 'Add To-Do',
      description: 'Action',
      icon: Plus,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      action: handleAddTodo
    },
    {
      id: 'issues',
      title: 'Add Issue',
      description: 'Problem',
      icon: Plus,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      action: handleAddIssue
    }
  ];

  const overviewCards = [
    {
      id: 'meetings',
      title: 'Meetings',
      count: stats.meetings,
      icon: Calendar,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
      description: 'Weekly relationship meetings',
      action: () => handleNavigateToSection('meetings')
    },
    {
      id: 'rocks',
      title: 'Rocks',
      count: stats.rocks,
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: 'Annual priorities & goals',
      completed: stats.completedRocks,
      action: () => handleNavigateToSection('rocks')
    },
    {
      id: 'todos',
      title: 'To-Dos',
      count: stats.todos,
      icon: CheckSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: 'Action items & tasks',
      completed: stats.completedTodos,
      action: () => handleNavigateToSection('todos')
    },
    {
      id: 'issues',
      title: 'Issues',
      count: stats.issues,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      description: 'Problems to resolve',
      completed: stats.resolvedIssues,
      action: () => handleNavigateToSection('issues')
    }
  ];

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

  const renderMiniQualityOfLifeGraph = () => {
    if (qualityOfLifeData.length === 0) return null;

    const dimensions = [
      { id: 'physical', name: 'Physical', color: '#3b82f6' },
      { id: 'mental', name: 'Mental', color: '#8b5cf6' },
      { id: 'spiritual', name: 'Spiritual', color: '#eab308' },
      { id: 'friends', name: 'Friends', color: '#22c55e' },
      { id: 'marriage', name: 'Marriage', color: '#ec4899' },
      { id: 'sex', name: 'Sex', color: '#ef4444' }
    ];

    return (
      <div className="bg-white rounded-xl shadow-lg p-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
          <LineChart className="w-4 h-4 mr-2 text-purple-500" />
          Quality of Life Trend
        </h3>
        <div className="h-24 relative">
          <svg className="w-full h-full" viewBox="0 0 300 80" preserveAspectRatio="none">
            {/* Grid lines */}
            {[0, 2, 4, 6, 8, 10].map((tick) => (
              <line
                key={tick}
                x1="0"
                y1={80 - (tick * 8)}
                x2="300"
                y2={80 - (tick * 8)}
                stroke="#e5e7eb"
                strokeWidth="0.5"
              />
            ))}

            {/* Draw lines for each dimension */}
            {dimensions.map((dimension, dimIndex) => {
              const points = qualityOfLifeData.map((checkIn, index) => {
                const x = (index / (qualityOfLifeData.length - 1)) * 280 + 10;
                const y = 80 - (checkIn[dimension.id] * 8);
                return `${x},${y}`;
              }).join(' ');

              return (
                <g key={dimension.id}>
                  <polyline
                    fill="none"
                    stroke={dimension.color}
                    strokeWidth="1.5"
                    points={points}
                  />
                  {/* Data points */}
                  {qualityOfLifeData.map((checkIn, index) => {
                    const x = (index / (qualityOfLifeData.length - 1)) * 280 + 10;
                    const y = 80 - (checkIn[dimension.id] * 8);
                    return (
                      <circle
                        key={`${dimension.id}-${index}`}
                        cx={x}
                        cy={y}
                        r="1.5"
                        fill={dimension.color}
                        stroke="white"
                        strokeWidth="0.5"
                      />
                    );
                  })}
                </g>
              );
            })}
          </svg>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>0</span>
          <span>5</span>
          <span>10</span>
        </div>
        {/* Mini legend */}
        <div className="flex flex-wrap justify-center mt-3 gap-1">
          {dimensions.map((dimension) => (
            <div key={dimension.id} className="flex items-center space-x-1">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: dimension.color }}
              ></div>
              <span className="text-xs text-gray-600">{dimension.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Top Info Cards: Partner, Notifications, Next Meetings, Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Partner Card */}
          <div className="bg-white rounded-xl shadow-lg p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
              <Users className="w-4 h-4 mr-2 text-pink-500" />
              Your Partner
            </h3>
            {partnerInfo ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 text-white flex items-center justify-center">
                    <span className="text-sm font-semibold">
                      {(partnerInfo.name || 'P').slice(0,1)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{partnerInfo.name || 'Partner'}</p>
                    <p className="text-xs text-gray-500">{partnerInfo.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('profile')}
                  className="text-xs text-pink-600 hover:text-pink-700 font-medium"
                  title="Go to Partner settings"
                >
                  Open in Profile →
                </button>
              </div>
            ) : (
              <div className="text-sm text-gray-600">
                No partner linked yet.
                <button onClick={() => onNavigate('profile')} className="ml-2 text-xs text-pink-600 hover:text-pink-700 font-medium">Invite from Profile →</button>
              </div>
            )}
          </div>

          {/* Notifications Card */}
          <div className="bg-white rounded-xl shadow-lg p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 text-amber-500" />
              Notifications
            </h3>
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-500">You're all caught up.</p>
            ) : (
              <ul className="space-y-2">
                {notifications.map((n) => (
                  <li key={n.id} className="text-sm text-gray-700 flex items-start">
                    <span className="mt-0.5 mr-2">•</span>
                    <span>{n.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Next Meetings Card */}
          <div className="bg-white rounded-xl shadow-lg p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-blue-600" />
              Next Meetings
            </h3>
            {nextMeetings.length === 0 ? (
              <p className="text-sm text-gray-500">No upcoming meetings scheduled.</p>
            ) : (
              <div className="space-y-2">
                {nextMeetings.map((m) => (
                  <div key={m.id} className="text-sm text-gray-800 flex items-center justify-between">
                    <span className="truncate mr-2">{m.title || 'Weekly Meeting'}</span>
                    <span className="text-xs text-gray-500">{new Date(m.scheduledDate).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stats Card */}
          <div className="bg-white rounded-xl shadow-lg p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
              <BarChart3 className="w-4 h-4 mr-2 text-emerald-600" />
              Stats Snapshot
            </h3>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <p className="text-xl font-bold text-gray-800">{stats.meetings}</p>
                <p className="text-xs text-gray-500">Meetings</p>
              </div>
              <div>
                <p className="text-xl font-bold text-gray-800">{stats.completedTodos}</p>
                <p className="text-xs text-gray-500">To-Dos Done</p>
              </div>
              <div>
                <p className="text-xl font-bold text-gray-800">{stats.completedRocks}</p>
                <p className="text-xs text-gray-500">Rocks Done</p>
              </div>
              <div>
                <p className="text-xl font-bold text-gray-800">{stats.resolvedIssues}</p>
                <p className="text-xs text-gray-500">Issues Resolved</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions - Single Line */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={action.action}
                className={`${action.bgColor} ${action.borderColor} border rounded-lg px-4 py-3 hover:shadow-md transition-all duration-200 group flex items-center space-x-2`}
              >
                <div className={`bg-gradient-to-r ${action.color} p-2 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-800">
                    {action.title}
                  </div>
                  <div className="text-xs text-gray-600">
                    {action.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Overview Stats */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center">
            <BarChart3 className="w-4 h-4 mr-2 text-pink-500" />
            Quick Overview
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {overviewCards.map((card) => (
              <button
                key={card.id}
                onClick={card.action}
                className="text-center p-4 rounded-lg hover:bg-gray-50 transition-all duration-200 group"
              >
                <div className={`${card.bgColor} p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <card.icon className={`w-6 h-6 ${card.color}`} />
                </div>
                <p className="text-2xl font-bold text-gray-800 mb-1">{card.count}</p>
                <p className="text-xs text-gray-600 mb-1">{card.title}</p>
                {card.completed !== undefined && (
                  <p className="text-xs text-green-600">
                    {card.completed} completed
                  </p>
                )}
                <div className="flex items-center justify-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-3 h-3 text-gray-400" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Quality of Life Graph & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mini Quality of Life Graph */}
          {renderMiniQualityOfLifeGraph()}

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center">
                <Activity className="w-4 h-4 mr-2 text-pink-500" />
                Recent Activity
              </h3>
              <button
                onClick={() => onNavigate('recent-activity')}
                className="text-xs text-pink-600 hover:text-pink-700 font-medium"
              >
                View All →
              </button>
            </div>
            <div className="space-y-2">
              {console.log('MainMenu: Rendering Recent Activity widget, loading:', loading, 'recentActivity.length:', recentActivity.length)}
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500 mx-auto"></div>
                  <p className="text-xs text-gray-500 mt-2">Loading activity...</p>
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-4">
                  <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No recent activity</p>
                  <p className="text-xs text-gray-400 mt-1">Create some items to see activity here</p>
                </div>
              ) : (
                recentActivity.map((item, index) => {
                  console.log('MainMenu: Rendering activity item:', item);
                  return (
                    <div key={`${item.type}-${item.id}-${index}`} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className={`${item.bgColor} p-1.5 rounded-full flex-shrink-0`}>
                        <item.icon className={`w-3 h-3 ${item.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-800 truncate">
                            {item.title}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            {item.userName}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(item.createdAt)}
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                            item.status === 'completed' ? 'bg-green-100 text-green-700' :
                            item.status === 'created' ? 'bg-blue-100 text-blue-700' :
                            item.status === 'archived' ? 'bg-gray-100 text-gray-700' :
                            item.status === 'resolved' ? 'bg-green-100 text-green-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
      <QuickAddRockModal
        isOpen={showRockModal}
        onClose={() => setShowRockModal(false)}
        onSuccess={handleRockSuccess}
      />
      <QuickAddTodoModal
        isOpen={showTodoModal}
        onClose={() => setShowTodoModal(false)}
        onSuccess={handleTodoSuccess}
      />
      <QuickAddIssueModal
        isOpen={showIssueModal}
        onClose={() => setShowIssueModal(false)}
        onSuccess={handleIssueSuccess}
      />
      <QuickQualityOfLifeModal
        isOpen={showQualityOfLifeModal}
        onClose={() => setShowQualityOfLifeModal(false)}
        onSuccess={handleQualityOfLifeSuccess}
      />
    </div>
  );
};

export default MainMenu;
