import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Save,
  Heart,
  Target,
  CheckSquare,
  AlertTriangle,
  Star,
  Users,
  Activity,
  Brain,
  TrendingUp,
  Calendar,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

const MeetingFlow = ({ onBack, onComplete }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [currentStep, setCurrentStep] = useState(0);
  const [meetingData, setMeetingData] = useState({});
  const [startTime] = useState(Date.now());
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [rocks, setRocks] = useState([]);
  const [todos, setTodos] = useState([]);
  const [issues, setIssues] = useState([]);
  const [previousQoL, setPreviousQoL] = useState(null);
  const [sectionStartTime, setSectionStartTime] = useState(Date.now());
  const [sectionTimers, setSectionTimers] = useState({});
  const [localUser1Word, setLocalUser1Word] = useState(meetingData.checkin?.user1Word || '');
  const [localUser2Word, setLocalUser2Word] = useState(meetingData.checkin?.user2Word || '');

  const timerRef = useRef(null);
  const sectionTimerRef = useRef(null);

  const steps = [
    { id: 'checkin', title: 'One Word Check-in', icon: Heart },
    { id: 'qualityoflife', title: 'Quality of Life', icon: TrendingUp },
    { id: 'rocks', title: 'Rocks Check-in', icon: Target },
    { id: 'todos', title: 'To-Dos Review', icon: CheckSquare },
    { id: 'issues', title: 'Issues (IDS)', icon: AlertTriangle },
    { id: 'close', title: 'Close Meeting', icon: Star }
  ];

  // Timer effect
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimer(Date.now() - startTime);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [startTime]);

  // Section timer effect
  useEffect(() => {
    sectionTimerRef.current = setInterval(() => {
      const currentSection = steps[currentStep].id;
      const sectionElapsed = Date.now() - sectionStartTime;
      setSectionTimers(prev => ({
        ...prev,
        [currentSection]: sectionElapsed
      }));
    }, 1000);

    return () => clearInterval(sectionTimerRef.current);
  }, [currentStep, sectionStartTime]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'ArrowLeft' && currentStep > 0) {
        handlePrevious();
      } else if (event.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentStep, steps]);

  // Update section start time when step changes
  useEffect(() => {
    setSectionStartTime(Date.now());
  }, [currentStep]);

  // Update local text state when meeting data changes
  useEffect(() => {
    setLocalUser1Word(meetingData.checkin?.user1Word || '');
    setLocalUser2Word(meetingData.checkin?.user2Word || '');
  }, [meetingData.checkin]);

  // Fetch data for meeting
  useEffect(() => {
    const fetchMeetingData = async () => {
      try {
        // Fetch rocks
        const rocksQuery = query(collection(db, 'rocks'), where('userId', '==', user.uid));
        const rocksSnapshot = await getDocs(rocksQuery);
        const rocksData = rocksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRocks(rocksData.filter(rock => rock.status !== 'archived'));

        // Fetch todos
        const todosQuery = query(collection(db, 'todos'), where('userId', '==', user.uid));
        const todosSnapshot = await getDocs(todosQuery);
        const todosData = todosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTodos(todosData.filter(todo => todo.status !== 'archived'));

        // Fetch issues
        const issuesQuery = query(collection(db, 'issues'), where('userId', '==', user.uid));
        const issuesSnapshot = await getDocs(issuesQuery);
        const issuesData = issuesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setIssues(issuesData.filter(issue => issue.status !== 'archived'));

        // Fetch previous QoL check-in
        const qoLQuery = query(collection(db, 'qualityOfLife'), where('userId', '==', user.uid));
        const qoLSnapshot = await getDocs(qoLQuery);
        const qoLData = qoLSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (qoLData.length > 0) {
          const sortedQoL = qoLData.sort((a, b) => new Date(b.date) - new Date(a.date));
          setPreviousQoL(sortedQoL[0]);
        }
      } catch (error) {
        console.error('Error fetching meeting data:', error);
        showError('Error Loading Data', 'Failed to load meeting data. Please try again.');
      }
    };

    fetchMeetingData();
  }, [user.uid, showError]);

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    }
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
  };

  const saveStepData = async (stepId, data) => {
    try {
      const stepData = {
        userId: user.uid,
        meetingId: `meeting_${Date.now()}`,
        stepId,
        data,
        timestamp: serverTimestamp()
      };

      await addDoc(collection(db, 'meetingSteps'), stepData);
      setMeetingData(prev => ({ ...prev, [stepId]: data }));
    } catch (error) {
      console.error('Error saving step data:', error);
      showError('Save Failed', 'Failed to save step data. Please try again.');
    }
  };

  // Ensure an issue exists for an off-track rock (shared helper)
  const ensureIssueForOffTrackRock = async (rockId, title = 'Rock', description = '') => {
    try {
      const q = query(collection(db, 'issues'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      const exists = snap.docs.some(d => (d.data().sourceRockId === rockId) && (d.data().status !== 'archived'));
      if (exists) return;

      const docRef = await addDoc(collection(db, 'issues'), {
        userId: user.uid,
        name: `Off-track: ${title || 'Rock'}`,
        description: description || 'Automatically added from off-track rock during meeting',
        priority: 'medium',
        status: 'open',
        enteredBy: user.uid,
        enteredByName: user.displayName || 'You',
        source: 'rock',
        sourceRockId: rockId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setMeetingData(prev => {
        const currentIssues = Array.isArray(prev.issues) ? prev.issues : (prev.issues?.issues || []);
        return { ...prev, issues: [...currentIssues, { id: docRef.id, status: 'open', notes: '', name: `Off-track: ${title || 'Rock'}` }] };
      });
    } catch (e) {
      console.error('ensureIssueForOffTrackRock error', e);
    }
  };

  const handleStepClick = (stepIndex) => {
    setCurrentStep(stepIndex);
  };

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete meeting
      try {
        const meetingSummary = {
          userId: user.uid,
          startTime: new Date(startTime),
          endTime: new Date(),
          duration: timer,
          sectionTimers: sectionTimers,
          steps: meetingData,
          status: 'completed',
          createdAt: serverTimestamp()
        };

        await addDoc(collection(db, 'meetings'), meetingSummary);
        showSuccess('Meeting Complete', 'Great job completing your weekly meeting!');
        onComplete();
      } catch (error) {
        console.error('Error completing meeting:', error);
        showError('Error', 'Failed to complete meeting. Please try again.');
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepComplete = (stepId) => {
    const stepData = meetingData[stepId];
    if (!stepData) return false;

    switch (stepId) {
      case 'checkin':
        return stepData.user1Word && stepData.user2Word;
      case 'qualityoflife':
        // Check if at least some ratings have been made (more flexible)
        return stepData.ratings && Object.keys(stepData.ratings).length > 0; // Any ratings at all
      case 'rocks':
        return stepData.rocks && stepData.rocks.length > 0;
      case 'todos':
        return stepData.todos && stepData.todos.length > 0;
      case 'issues':
        return stepData.issues && stepData.issues.length > 0;
      case 'close':
        return stepData.user1Rating && stepData.user2Rating;
      default:
        return false;
    }
  };

  const renderCheckIn = () => {
    const handleUser1Change = (value) => {
      setLocalUser1Word(value);
      const newData = { ...meetingData.checkin, user1Word: value };
      setMeetingData(prev => ({ ...prev, checkin: newData }));
    };

    const handleUser2Change = (value) => {
      setLocalUser2Word(value);
      const newData = { ...meetingData.checkin, user2Word: value };
      setMeetingData(prev => ({ ...prev, checkin: newData }));
    };

    const handleSave = () => {
      const newData = { user1Word: localUser1Word, user2Word: localUser2Word };
      saveStepData('checkin', newData);
    };

    return (
      <div className="space-y-6">
        <div className="text-center">
          <Heart className="w-12 h-12 text-pink-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">One Word Check-in</h2>
          <p className="text-gray-600">How are you feeling right now? Share one word each.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Partner 1</h3>
            <input
              type="text"
              placeholder="Enter one word..."
              value={localUser1Word}
              onChange={(e) => handleUser1Change(e.target.value)}
              onBlur={handleSave}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-lg"
              maxLength={20}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Partner 2</h3>
            <input
              type="text"
              placeholder="Enter one word..."
              value={localUser2Word}
              onChange={(e) => handleUser2Change(e.target.value)}
              onBlur={handleSave}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-lg"
              maxLength={20}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderQualityOfLife = () => {
    const categories = [
      { id: 'physical', name: 'Physical', icon: Activity, color: 'text-blue-600' },
      { id: 'mental', name: 'Mental', icon: Brain, color: 'text-purple-600' },
      { id: 'financial', name: 'Financial', icon: TrendingUp, color: 'text-green-600' },
      { id: 'friends', name: 'Friends/Community', icon: Users, color: 'text-indigo-600' },
      { id: 'marriage', name: 'Marriage', icon: Heart, color: 'text-pink-600' },
      { id: 'sex', name: 'Sex', icon: Heart, color: 'text-red-600' }
    ];

    const getRating = (category, user) => {
      return meetingData.qualityoflife?.ratings?.[`${category}_${user}`] || 5;
    };

    const setRating = (category, user, value) => {
      const currentRatings = meetingData.qualityoflife?.ratings || {};
      const newRatings = { ...currentRatings, [`${category}_${user}`]: value };
      const newData = { ...meetingData.qualityoflife, ratings: newRatings };
      setMeetingData(prev => ({ ...prev, qualityoflife: newData }));
      saveStepData('qualityoflife', newData);
    };

    const getPreviousRating = (category) => {
      if (!previousQoL) return null;
      return previousQoL[category] || null;
    };

    const getRatingColor = (rating, previous) => {
      if (!previous) return 'text-gray-600';
      if (rating > previous) return 'text-green-600';
      if (rating < previous) return 'text-red-600';
      return 'text-gray-600';
    };

    return (
      <div className="space-y-6">
        <div className="text-center">
          <TrendingUp className="w-12 h-12 text-purple-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Quality of Life Check-in</h2>
          <p className="text-gray-600">Rate each dimension from 1-10. Compare with last week.</p>
        </div>

        <div className="space-y-6">
          {categories.map((category) => (
            <div key={category.id} className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center space-x-3 mb-4">
                <category.icon className={`w-5 h-5 ${category.color}`} />
                <h3 className="text-lg font-semibold text-gray-800">{category.name}</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Partner 1</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={getRating(category.id, 'user1')}
                      onChange={(e) => setRating(category.id, 'user1', parseInt(e.target.value))}
                      className="slider quality-of-life flex-1"
                    />
                    <span className={`text-lg font-bold ${getRatingColor(getRating(category.id, 'user1'), getPreviousRating(category.id))}`}>
                      {getRating(category.id, 'user1')}
                    </span>
                  </div>
                  {getPreviousRating(category.id) && (
                    <p className="text-xs text-gray-500">
                      Last week: {getPreviousRating(category.id)}/10
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Partner 2</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={getRating(category.id, 'user2')}
                      onChange={(e) => setRating(category.id, 'user2', parseInt(e.target.value))}
                      className="slider quality-of-life flex-1"
                    />
                    <span className={`text-lg font-bold ${getRatingColor(getRating(category.id, 'user2'), getPreviousRating(category.id))}`}>
                      {getRating(category.id, 'user2')}
                    </span>
                  </div>
                  {getPreviousRating(category.id) && (
                    <p className="text-xs text-gray-500">
                      Last week: {getPreviousRating(category.id)}/10
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Save Button for Quality of Life */}
        <div className="text-center pt-4">
          <button
            onClick={() => {
              const currentRatings = meetingData.qualityoflife?.ratings || {};
              saveStepData('qualityoflife', { ratings: currentRatings });
            }}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            Save Quality of Life Ratings
          </button>
        </div>
      </div>
    );
  };

  const renderRocks = () => {
    const getRockStatus = (rockId) => {
      const list = Array.isArray(meetingData.rocks)
        ? meetingData.rocks
        : (meetingData.rocks && Array.isArray(meetingData.rocks.rocks) ? meetingData.rocks.rocks : []);
      return list.find(r => r.id === rockId)?.status || 'on-track';
    };

    const setRockStatus = async (rockId, status, comment = '') => {
      const currentRocks = Array.isArray(meetingData.rocks)
        ? meetingData.rocks
        : (meetingData.rocks && Array.isArray(meetingData.rocks.rocks) ? meetingData.rocks.rocks : []);
      const existingIndex = currentRocks.findIndex(r => r.id === rockId);
      
      let newRocks;
      if (existingIndex >= 0) {
        newRocks = [...currentRocks];
        newRocks[existingIndex] = { ...newRocks[existingIndex], status, comment };
      } else {
        newRocks = [...currentRocks, { id: rockId, status, comment }];
      }

      setMeetingData(prev => ({ ...prev, rocks: newRocks }));
      saveStepData('rocks', { rocks: newRocks });

      // Persist to Firestore to keep in sync with Rocks page
      try {
        await updateDoc(doc(db, 'rocks', rockId), {
          status,
          comment: comment || '',
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.error('MeetingFlow: Failed to update rock status in Firestore', err);
        showError('Update Failed', 'Could not sync rock status.');
      }

      // If marked off-track, ensure an Issue exists for discussion
      try {
        if (status === 'off-track') {
          const rock = rocks.find(r => r.id === rockId) || {};
          await ensureIssueForOffTrackRock(rockId, rock.title, rock.description);
        }
      } catch (e) {
        console.error('MeetingFlow: ensureIssueForOffTrackRock failed', e);
      }
    };

    return (
      <div className="space-y-6">
        <div className="text-center">
          <Target className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Rocks Check-in</h2>
          <p className="text-gray-600">Review your quarterly rocks. Mark as on/off track.</p>
        </div>

        <div className="space-y-4">
          {rocks.map((rock) => (
            <div key={rock.id} className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{rock.title}</h3>
                  <p className="text-gray-600 mb-2">{rock.description}</p>
                  {rock.dueDate && (
                    <p className="text-sm text-gray-500">Due: {new Date(rock.dueDate).toLocaleDateString()}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setRockStatus(rock.id, 'on-track')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      getRockStatus(rock.id) === 'on-track'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                    On Track
                  </button>
                  <button
                    onClick={() => setRockStatus(rock.id, 'off-track')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      getRockStatus(rock.id) === 'off-track'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-700'
                    }`}
                  >
                    <XCircle className="w-4 h-4 inline mr-1" />
                    Off Track
                  </button>
                  <button
                    onClick={() => setRockStatus(rock.id, 'completed')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      getRockStatus(rock.id) === 'completed'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                    Done
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments
                </label>
                <textarea
                  placeholder="Add any comments about this rock..."
                  value={(Array.isArray(meetingData.rocks)
                    ? meetingData.rocks
                    : (meetingData.rocks && Array.isArray(meetingData.rocks.rocks) ? meetingData.rocks.rocks : [])
                  ).find(r => r.id === rock.id)?.comment || ''}
                  onChange={(e) => {
                    const currentStatus = getRockStatus(rock.id);
                    setRockStatus(rock.id, currentStatus, e.target.value);
                  }}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          ))}

          {rocks.length === 0 && (
            <div className="text-center py-8">
              <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No rocks found. Add some quarterly rocks first.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTodos = () => {
    const getTodoStatus = (todoId) => {
      const list = Array.isArray(meetingData.todos)
        ? meetingData.todos
        : (meetingData.todos && Array.isArray(meetingData.todos.todos) ? meetingData.todos.todos : []);
      return list.find(t => t.id === todoId)?.status || 'incomplete';
    };

    const setTodoStatus = async (todoId, status) => {
      // Map meeting flow labels to app statuses
      const mappedStatus = status === 'complete' ? 'completed' : (status === 'incomplete' ? 'new' : status);
      const currentTodos = Array.isArray(meetingData.todos)
        ? meetingData.todos
        : (meetingData.todos && Array.isArray(meetingData.todos.todos) ? meetingData.todos.todos : []);
      const existingIndex = currentTodos.findIndex(t => t.id === todoId);
      
      let newTodos;
      if (existingIndex >= 0) {
        newTodos = [...currentTodos];
        newTodos[existingIndex] = { ...newTodos[existingIndex], status: mappedStatus };
      } else {
        newTodos = [...currentTodos, { id: todoId, status: mappedStatus }];
      }

      setMeetingData(prev => ({ ...prev, todos: newTodos }));
      saveStepData('todos', { todos: newTodos });

      // Persist to Firestore to keep in sync with Todos page
      try {
        await updateDoc(doc(db, 'todos', todoId), {
          status: mappedStatus,
          statusChangedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.error('MeetingFlow: Failed to update todo status in Firestore', err);
        showError('Update Failed', 'Could not sync to-do status.');
      }
    };

    return (
      <div className="space-y-6">
        <div className="text-center">
          <CheckSquare className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">To-Dos Review</h2>
          <p className="text-gray-600">Review and update your to-dos.</p>
        </div>

        <div className="space-y-4">
          {todos.map((todo) => (
            <div key={todo.id} className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">{todo.title}</h3>
                  <p className="text-gray-600 mb-2">{todo.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Priority: {todo.priority}</span>
                    {todo.dueDate && (
                      <span>Due: {new Date(todo.dueDate).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setTodoStatus(todo.id, 'incomplete')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      getTodoStatus(todo.id) === 'incomplete'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-yellow-100 hover:text-yellow-700'
                    }`}
                  >
                    Incomplete
                  </button>
                  <button
                    onClick={() => setTodoStatus(todo.id, 'complete')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      getTodoStatus(todo.id) === 'complete'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                    Complete
                  </button>
                </div>
              </div>
            </div>
          ))}

          {todos.length === 0 && (
            <div className="text-center py-8">
              <CheckSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No to-dos found. Add some to-dos first.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderIssues = () => {
    const getIssueStatus = (issueId) => {
      const list = Array.isArray(meetingData.issues)
        ? meetingData.issues
        : (meetingData.issues && Array.isArray(meetingData.issues.issues) ? meetingData.issues.issues : []);
      return list.find(i => i.id === issueId)?.status || 'open';
    };

    const setIssueStatus = async (issueId, status, notes = '') => {
      const currentIssues = Array.isArray(meetingData.issues)
        ? meetingData.issues
        : (meetingData.issues && Array.isArray(meetingData.issues.issues) ? meetingData.issues.issues : []);
      const existingIndex = currentIssues.findIndex(i => i.id === issueId);
      
      let newIssues;
      if (existingIndex >= 0) {
        newIssues = [...currentIssues];
        newIssues[existingIndex] = { ...newIssues[existingIndex], status, notes };
      } else {
        newIssues = [...currentIssues, { id: issueId, status, notes }];
      }

      setMeetingData(prev => ({ ...prev, issues: newIssues }));
      saveStepData('issues', { issues: newIssues });

      // Persist to Firestore to keep in sync with Issues page
      try {
        await updateDoc(doc(db, 'issues', issueId), {
          status,
          notes: notes || '',
          statusChangedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.error('MeetingFlow: Failed to update issue status in Firestore', err);
        showError('Update Failed', 'Could not sync issue status.');
      }
    };

    const ensureIssueForOffTrackRock = async (rockId, title = 'Rock', description = '') => {
      try {
        // Load existing issues for this user and filter client-side to avoid index needs
        const q = query(collection(db, 'issues'), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        const exists = snap.docs.some(d => (d.data().sourceRockId === rockId) && (d.data().status !== 'archived'));
        if (exists) return;

        const docRef = await addDoc(collection(db, 'issues'), {
          userId: user.uid,
          name: `Off-track: ${title || 'Rock'}`,
          description: description || 'Automatically added from off-track rock during meeting',
          priority: 'medium',
          status: 'open',
          enteredBy: user.uid,
          enteredByName: user.displayName || 'You',
          source: 'rock',
          sourceRockId: rockId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // Reflect in local meetingData for immediate UI coherence
        setMeetingData(prev => {
          const currentIssues = Array.isArray(prev.issues) ? prev.issues : (prev.issues?.issues || []);
          return { ...prev, issues: [...currentIssues, { id: docRef.id, status: 'open', notes: '', name: `Off-track: ${title || 'Rock'}` }] };
        });
      } catch (e) {
        console.error('ensureIssueForOffTrackRock error', e);
      }
    };

    // Add off-track rocks as issues
    const offTrackRocks = rocks.filter(rock => 
      (Array.isArray(meetingData.rocks)
        ? meetingData.rocks
        : (meetingData.rocks && Array.isArray(meetingData.rocks.rocks) ? meetingData.rocks.rocks : [])
      )
      .find(r => r.id === rock.id)?.status === 'off-track'
    );

      const allIssues = [...issues, ...offTrackRocks.map(rock => ({
      id: `rock_${rock.id}`,
      name: `Off-track: ${rock.title}`,
      description: rock.description,
      type: 'rock'
    }))];

    return (
      <div className="space-y-6">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Issues (IDS)</h2>
          <p className="text-gray-600">Identify, Discuss, and Solve your issues.</p>
        </div>

        <div className="space-y-4">
          {allIssues.map((issue) => (
            <div key={issue.id} className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{issue.name}</h3>
                  <p className="text-gray-600 mb-2">{issue.description}</p>
                  {issue.priority && (
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      issue.priority === 'high' ? 'bg-red-100 text-red-700' :
                      issue.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {issue.priority} priority
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIssueStatus(issue.id, 'open')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      getIssueStatus(issue.id) === 'open'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-orange-700'
                    }`}
                  >
                    Open
                  </button>
                  <button
                    onClick={() => setIssueStatus(issue.id, 'resolved')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      getIssueStatus(issue.id) === 'resolved'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                    Resolved
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discussion Notes
                </label>
                <textarea
                  placeholder="Add discussion notes, solutions, or action items..."
                  value={(Array.isArray(meetingData.issues)
                    ? meetingData.issues
                    : (meetingData.issues && Array.isArray(meetingData.issues.issues) ? meetingData.issues.issues : [])
                  ).find(i => i.id === issue.id)?.notes || ''}
                  onChange={(e) => {
                    const currentStatus = getIssueStatus(issue.id);
                    setIssueStatus(issue.id, currentStatus, e.target.value);
                  }}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
          ))}

          {allIssues.length === 0 && (
            <div className="text-center py-8">
              <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No issues found. Great job staying on track!</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderClose = () => {
    const ratingThumbColor = (value) => {
      if (value <= 3) return '#ef4444'; // red
      if (value <= 7) return '#f59e0b'; // yellow
      return '#22c55e'; // green
    };
    const ratingTrackColor = (value) => {
      if (value <= 3) return '#fee2e2'; // red-100
      if (value <= 7) return '#fef3c7'; // amber-100
      return '#dcfce7'; // green-100
    };
    const getRating = (user) => {
      return meetingData.close?.[`${user}Rating`] || 5;
    };

    const setRating = (user, rating) => {
      const newData = { ...meetingData.close, [`${user}Rating`]: rating };
      setMeetingData(prev => ({ ...prev, close: newData }));
      saveStepData('close', newData);
    };

    const getComment = (user) => {
      return meetingData.close?.[`${user}Comment`] || '';
    };

    const setComment = (user, comment) => {
      const newData = { ...meetingData.close, [`${user}Comment`]: comment };
      setMeetingData(prev => ({ ...prev, close: newData }));
      saveStepData('close', newData);
    };

    return (
      <div className="space-y-6">
        <div className="text-center">
          <Star className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Close Meeting</h2>
          <p className="text-gray-600">Rate your meeting and share any final thoughts.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Partner 1</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Rating (1-10)
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={getRating('user1')}
                    onChange={(e) => setRating('user1', parseInt(e.target.value))}
                    className="slider dynamic-color close-meeting flex-1"
                    style={{
                      '--slider-thumb-color': ratingThumbColor(getRating('user1')),
                      '--slider-track-color': ratingTrackColor(getRating('user1'))
                    }}
                  />
                  <span className="text-lg font-bold text-gray-800">
                    {getRating('user1')}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments
                </label>
                <textarea
                  placeholder="Share your thoughts about the meeting..."
                  value={getComment('user1')}
                  onChange={(e) => setComment('user1', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Partner 2</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Rating (1-10)
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={getRating('user2')}
                    onChange={(e) => setRating('user2', parseInt(e.target.value))}
                    className="slider dynamic-color close-meeting flex-1"
                    style={{
                      '--slider-thumb-color': ratingThumbColor(getRating('user2')),
                      '--slider-track-color': ratingTrackColor(getRating('user2'))
                    }}
                  />
                  <span className="text-lg font-bold text-gray-800">
                    {getRating('user2')}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments
                </label>
                <textarea
                  placeholder="Share your thoughts about the meeting..."
                  value={getComment('user2')}
                  onChange={(e) => setComment('user2', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Meeting Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Duration:</span>
              <p className="font-semibold">{formatTime(timer)}</p>
            </div>
            <div>
              <span className="text-gray-600">Steps Completed:</span>
              <p className="font-semibold">{currentStep + 1}/6</p>
            </div>
            <div>
              <span className="text-gray-600">Rocks Reviewed:</span>
              <p className="font-semibold">{rocks.length}</p>
            </div>
            <div>
              <span className="text-gray-600">Issues Discussed:</span>
              <p className="font-semibold">{issues.length}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentStep = () => {
    const stepContent = (() => {
      switch (currentStep) {
        case 0:
          return renderCheckIn();
        case 1:
          return renderQualityOfLife();
        case 2:
          return renderRocks();
        case 3:
          return renderTodos();
        case 4:
          return renderIssues();
        case 5:
          return renderClose();
        default:
          return null;
      }
    })();

    return (
      <div className="space-y-6">
        {/* Step Content */}
        {stepContent}
        
        {/* Navigation Buttons - Within Step */}
        <div className="flex items-center justify-between pt-8 border-t border-gray-200">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center space-x-3 px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Previous Step</span>
          </button>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              Step {currentStep + 1} of {steps.length}
            </span>
            {sectionTimers[steps[currentStep].id] && (
              <span className="text-sm text-gray-500">
                Time: {formatTime(sectionTimers[steps[currentStep].id])}
              </span>
            )}
          </div>

          <button
            onClick={handleNext}
            disabled={loading}
            className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg hover:from-pink-600 hover:to-rose-600 transition-all duration-200 disabled:opacity-50 font-medium"
          >
            <span>
              {currentStep === steps.length - 1 ? 'Complete Meeting' : 'Next Step'}
            </span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100">
      {/* Header with Progress Bar */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Weekly Meeting</h1>
                <p className="text-sm text-gray-600">Step {currentStep + 1} of {steps.length}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{formatTime(timer)}</span>
              </div>
            </div>
          </div>

          {/* Navigation Buttons - Top */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <button
              onClick={handleNext}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg hover:from-pink-600 hover:to-rose-600 transition-all duration-200 disabled:opacity-50"
            >
              <span>
                {currentStep === steps.length - 1 ? 'Complete Meeting' : 'Next Step'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-gradient-to-r from-pink-500 to-rose-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          {/* Clickable Step Names */}
          <div className="flex justify-between text-xs">
            {steps.map((step, index) => {
              const isCurrent = index === currentStep;
              
              return (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(index)}
                  className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-all duration-200 ${
                    isCurrent 
                      ? 'bg-pink-100 text-pink-700' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <step.icon className={`w-4 h-4`} />
                  <span className="hidden sm:block font-medium">{step.title}</span>
                  {sectionTimers[step.id] && (
                    <span className="text-xs opacity-75">
                      {formatTime(sectionTimers[step.id])}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {renderCurrentStep()}
      </div>

      {/* Floating Navigation Indicator */}
      <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-30">
        <div className="flex items-center space-x-3">
          <div className="text-xs text-gray-500">
            <div>Use ← → keys to navigate</div>
            <div className="font-medium text-gray-700">
              {steps[currentStep].title}
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
              title="Previous Step (←)"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-gray-400">
              {currentStep + 1}/{steps.length}
            </span>
            <button
              onClick={handleNext}
              disabled={loading}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
              title="Next Step (→)"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingFlow;
