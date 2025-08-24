import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { sendMeetingReminder } from '../services/emailService';
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
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  Calendar,
  Edit,
  Trash2,
  Play,
  Clock,
  TrendingUp,
  Target,
  Plus,
  Archive,
  FileText,
  X,
  Users,
  MessageSquare,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Eye } from 'lucide-react';

const WeeklyMeetings = ({ onNavigate }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [filter, setFilter] = useState('all'); // all, upcoming, completed, archived
  // History state (from 'meetings' summaries created by MeetingFlow)
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyLimit, setHistoryLimit] = useState(10);
  const [showHistory, setShowHistory] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [modalEntered, setModalEntered] = useState(false);
  const [detailData, setDetailData] = useState({ rockMap: {}, todoMap: {}, issueMap: {} });

  console.log('WeeklyMeetings: Component rendered, user:', user?.uid);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledDate: '',
    status: 'scheduled',
    notes: ''
  });

  useEffect(() => {
    console.log('WeeklyMeetings: useEffect triggered, user:', user?.uid);

    if (!user?.uid) {
      console.log('WeeklyMeetings: No user, skipping query');
      return;
    }

    const q = query(
      collection(db, 'weeklyMeetings'),
      where('userId', '==', user.uid)
    );

    console.log('WeeklyMeetings: Setting up Firestore listener for user:', user.uid);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('WeeklyMeetings: Firestore snapshot received, docs:', snapshot.docs.length);

      if (snapshot.docs.length > 0) {
        console.log('WeeklyMeetings: First meeting data:', snapshot.docs[0].data());
      }

      const meetingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort by scheduledDate in JavaScript instead of Firestore
      meetingsData.sort((a, b) => {
        if (a.scheduledDate && b.scheduledDate) {
          return new Date(a.scheduledDate) - new Date(b.scheduledDate);
        }
        return 0;
      });

      console.log('WeeklyMeetings: Processed meetings data:', meetingsData);
      setMeetings(meetingsData);
      setLoading(false);
    }, (error) => {
      console.error('WeeklyMeetings: Firestore error:', error);
      console.error('WeeklyMeetings: Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      setLoading(false);
      showError('Error Loading Meetings', 'Failed to load your meetings. Please try again.');
    });

    return () => unsubscribe();
  }, [user.uid, showError]);

  // Load meeting summaries history (completed meetings saved by MeetingFlow)
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, 'meetings'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      // Robust, deterministic sort: newest first by endTime, then createdAt, then startTime
      const getMs = (m) => {
        const toMs = (v) => (
          v?.toDate ? v.toDate().getTime() :
          (typeof v === 'number' ? v :
          (typeof v === 'string' ? parseInt(v, 10) :
          (v instanceof Date ? v.getTime() : null)))
        );
        const endMs = toMs(m.endTime);
        const createdMs = toMs(m.createdAt);
        const startMs = toMs(m.startTime);
        return endMs ?? createdMs ?? startMs ?? 0;
      };

      all.sort((a, b) => getMs(b) - getMs(a));
      setHistory(all);
      setLoadingHistory(false);
    }, (error) => {
      console.error('WeeklyMeetings: Error loading meeting history', error);
      setLoadingHistory(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const visibleHistory = useMemo(() => history.slice(0, historyLimit), [history, historyLimit]);
  const hasMoreHistory = useMemo(() => history.length > historyLimit, [history, historyLimit]);

  // Modal open/close animation & ESC key
  useEffect(() => {
    if (selectedMeeting) {
      // Enter animation
      const id = setTimeout(() => setModalEntered(true), 10);
      const onEsc = (e) => { if (e.key === 'Escape') handleCloseModal(); };
      window.addEventListener('keydown', onEsc);
      return () => { window.removeEventListener('keydown', onEsc); clearTimeout(id); };
    } else {
      setModalEntered(false);
    }
  }, [selectedMeeting]);

  const handleCloseModal = () => {
    setModalEntered(false);
    setTimeout(() => setSelectedMeeting(null), 200);
  };

  // When modal opens, optionally fetch human-friendly titles for rocks/todos/issues
  useEffect(() => {
    const load = async () => {
      if (!selectedMeeting) return;
      const rockMap = {}; const todoMap = {}; const issueMap = {};
      try {
        const steps = selectedMeeting.steps || {};
        const rocksArr = Array.isArray(steps.rocks) ? steps.rocks : (steps.rocks?.rocks || []);
        const todoArr = Array.isArray(steps.todos) ? steps.todos : (steps.todos?.todos || []);
        const issueArr = Array.isArray(steps.issues) ? steps.issues : (steps.issues?.issues || []);

        // Fetch rocks
        await Promise.all((rocksArr || []).map(async (r) => {
          try { const snap = await getDoc(doc(db, 'rocks', r.id)); if (snap.exists()) rockMap[r.id] = snap.data(); } catch {}
        }));
        // Fetch todos
        await Promise.all((todoArr || []).map(async (t) => {
          try { const snap = await getDoc(doc(db, 'todos', t.id)); if (snap.exists()) todoMap[t.id] = snap.data(); } catch {}
        }));
        // Fetch issues (skip synthetic rock_ issues)
        await Promise.all((issueArr || []).filter(i => !String(i.id).startsWith('rock_')).map(async (i) => {
          try { const snap = await getDoc(doc(db, 'issues', i.id)); if (snap.exists()) issueMap[i.id] = snap.data(); } catch {}
        }));
      } finally {
        setDetailData({ rockMap, todoMap, issueMap });
      }
    };
    load();
  }, [selectedMeeting]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      scheduledDate: '',
      status: 'scheduled',
      notes: ''
    });
    setEditingMeeting(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('WeeklyMeetings: Form submitted!');

    try {
      console.log('WeeklyMeetings: Submitting meeting data:', formData);

      const meetingData = {
        userId: user.uid,
        title: formData.title.trim(),
        description: formData.description.trim(),
        scheduledDate: formData.scheduledDate,
        status: formData.status,
        notes: formData.notes.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('WeeklyMeetings: Processed meeting data:', meetingData);

      if (editingMeeting) {
        console.log('WeeklyMeetings: Updating existing meeting:', editingMeeting.id);
        await updateDoc(doc(db, 'weeklyMeetings', editingMeeting.id), {
          ...meetingData,
          updatedAt: serverTimestamp()
        });
        console.log('WeeklyMeetings: Meeting updated successfully');
        showSuccess('Meeting Updated', 'Your meeting has been updated successfully!');
      } else {
        console.log('WeeklyMeetings: Adding new meeting to Firestore');
        const docRef = await addDoc(collection(db, 'weeklyMeetings'), meetingData);
        console.log('WeeklyMeetings: Meeting added successfully with ID:', docRef.id);
        showSuccess('Meeting Scheduled', 'Your new meeting has been scheduled successfully!');
        
        // Send meeting reminder email (for now, send to the user's own email for testing)
        try {
          if (user?.email) {
            await sendMeetingReminder({
              id: docRef.id,
              partnerEmail: user.email,
              title: meetingData.title,
              startTime: meetingData.scheduledDate,
              agendaItems: meetingData.description ? [meetingData.description] : [],
              testMode: false
            });
          }
        } catch (error) {
          console.error('Failed to send meeting reminder email:', error);
          // Don't show error to user as meeting was saved successfully
        }
      }

      setShowAddForm(false);
      resetForm();
    } catch (error) {
      console.error('WeeklyMeetings: Error saving meeting:', error);
      console.error('WeeklyMeetings: Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      showError('Save Failed', `Failed to save meeting: ${error.message}. Please check your Firebase configuration.`);
    }
  };

  const handleEdit = (meeting) => {
    setEditingMeeting(meeting);
    setFormData({
      title: meeting.title,
      description: meeting.description,
      scheduledDate: meeting.scheduledDate,
      status: meeting.status,
      notes: meeting.notes || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (meetingId) => {
    if (window.confirm('Are you sure you want to delete this meeting?')) {
      try {
        await deleteDoc(doc(db, 'weeklyMeetings', meetingId));
        showSuccess('Meeting Deleted', 'The meeting has been deleted successfully.');
      } catch (error) {
        console.error('Error deleting meeting:', error);
        showError('Delete Failed', 'Failed to delete meeting. Please try again.');
      }
    }
  };

  const handleArchive = async (meeting) => {
    try {
      await updateDoc(doc(db, 'weeklyMeetings', meeting.id), {
        status: 'archived',
        updatedAt: serverTimestamp()
      });
      showSuccess('Meeting Archived', 'The meeting has been archived successfully.');
    } catch (error) {
      console.error('Error archiving meeting:', error);
      showError('Archive Failed', 'Failed to archive meeting. Please try again.');
    }
  };

  const handleStatusChange = async (meeting, newStatus) => {
    try {
      await updateDoc(doc(db, 'weeklyMeetings', meeting.id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      showSuccess('Status Updated', `Meeting status changed to ${newStatus.replace('-', ' ')}.`);
    } catch (error) {
      console.error('Error updating status:', error);
      showError('Update Failed', 'Failed to update status. Please try again.');
    }
  };

  const handleStartMeeting = () => {
    // Navigate directly to the new meeting flow
    onNavigate('meeting-flow');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'scheduled':
        return <Calendar className="w-5 h-5 text-blue-600" />;
      case 'in-progress':
        return <Play className="w-5 h-5 text-orange-600" />;
      case 'cancelled':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'archived':
        return <Archive className="w-5 h-5 text-gray-600" />;
      default:
        return <Calendar className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in-progress':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'archived':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'Not started';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s]
      .map(v => v < 10 ? '0' + v : v)
      .filter((v, i) => v !== '00' || i > 0)
      .join(':');
  };

  const formatDurationMs = (ms) => {
    if (!ms || isNaN(ms)) return null;
    const total = Math.floor(ms / 1000);
    return formatDuration(total);
  };

  const filteredMeetings = meetings.filter(meeting => {
    if (filter === 'all') return meeting.status !== 'archived';
    if (filter === 'upcoming') return meeting.status === 'scheduled';
    if (filter === 'completed') return meeting.status === 'completed';
    if (filter === 'archived') return meeting.status === 'archived';
    return true;
  });

  const stats = {
    total: meetings.filter(m => m.status !== 'archived').length,
    scheduled: meetings.filter(m => m.status === 'scheduled').length,
    completed: meetings.filter(m => m.status === 'completed').length,
    inProgress: meetings.filter(m => m.status === 'in-progress').length,
    archived: meetings.filter(m => m.status === 'archived').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading meetings...</p>
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
              <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-2 rounded-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Weekly Meetings</h1>
            </div>
            <button
              onClick={handleStartMeeting}
              className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-3 rounded-lg font-medium hover:from-pink-600 hover:to-rose-600 transition-all duration-200 flex items-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>Start Meeting</span>
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-1 mb-6">
            {[
              { key: 'all', label: 'All', count: stats.total },
              { key: 'upcoming', label: 'Upcoming', count: stats.scheduled },
              { key: 'completed', label: 'Completed', count: stats.completed },
              { key: 'archived', label: 'Archived', count: stats.archived }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  filter === tab.key
                    ? 'bg-pink-100 text-pink-700 border border-pink-200'
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
              <div className="bg-pink-100 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-pink-600" />
              </div>
              <p className="text-2xl font-bold text-pink-600">{stats.total}</p>
              <p className="text-xs text-gray-600">Total Meetings</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
              <p className="text-xs text-gray-600">Scheduled</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              <p className="text-xs text-gray-600">Completed</p>
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

        {/* Meeting History Section (moved up) */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-pink-100 p-2 rounded-lg">
                <Clock className="w-5 h-5 text-pink-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Meeting History</h2>
            </div>
            <button
              onClick={() => setShowHistory(prev => !prev)}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              {showHistory ? 'Hide' : 'Show'}
            </button>
          </div>

          {showHistory && (
            <>
              {loadingHistory ? (
                <div className="py-8 text-center text-gray-500 text-sm">Loading history…</div>
              ) : visibleHistory.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-sm">No completed meetings yet.</div>
              ) : (
                <div className="space-y-3">
                  {visibleHistory.map((m) => {
                    const endTs = (
                      m.endTime?.toDate ? m.endTime.toDate() :
                      (typeof m.endTime === 'number' ? new Date(m.endTime) :
                      (typeof m.endTime === 'string' ? new Date(parseInt(m.endTime, 10)) :
                      (m.createdAt?.toDate ? m.createdAt.toDate() : null)))
                    );
                    const durationSeconds = typeof m.duration === 'number' ? Math.floor(m.duration / 1000) : (typeof m.duration === 'string' ? Math.floor(parseInt(m.duration, 10) / 1000) : null);
                    const close = m.steps?.close || {};
                    const checkin = m.steps?.checkin || {};
                    const u1 = close.user1Rating ?? '-';
                    const u2 = close.user2Rating ?? '-';
                    return (
                      <div key={m.id} className="border border-gray-200 rounded-xl px-4 py-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center flex-wrap gap-2">
                              <div className="text-sm font-medium text-gray-800">
                                {endTs ? endTs.toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Unknown date'}
                              </div>
                              {durationSeconds ? (
                                <span className="text-xs text-gray-500 flex items-center">
                                  <Clock className="w-3 h-3 mr-1" /> {formatDuration(durationSeconds)}
                                </span>
                              ) : null}
                              <span className="ml-2 inline-flex items-center space-x-1">
                                <span className="px-2 py-0.5 rounded-full text-[11px] bg-green-100 text-green-700 border border-green-200">You: {u1}</span>
                                <span className="px-2 py-0.5 rounded-full text-[11px] bg-blue-100 text-blue-700 border border-blue-200">Partner: {u2}</span>
                              </span>
                            </div>
                            {(checkin.user1Word || checkin.user2Word) && (
                              <div className="mt-1 text-sm text-gray-600 line-clamp-1">
                                Check-in: {checkin.user1Word || '-'} / {checkin.user2Word || '-'}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 ml-3">
                            <button
                              onClick={() => setSelectedMeeting(m)}
                              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center space-x-1"
                            >
                              <Eye className="w-4 h-4" />
                              <span>View Details</span>
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm('Delete this meeting summary?')) {
                                  try {
                                    await deleteDoc(doc(db, 'meetings', m.id));
                                    showSuccess('Deleted', 'Meeting removed from history');
                                  } catch (err) {
                                    console.error(err);
                                    showError('Delete Failed', 'Could not delete meeting.');
                                  }
                                }
                              }}
                              className="px-3 py-1.5 text-sm bg-red-50 hover:bg-red-100 text-red-600 rounded-lg flex items-center space-x-1"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {hasMoreHistory && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setHistoryLimit(c => c + 10)}
                    className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
                  >
                    Load More
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Meetings List - removed per request */}

      </div>

      {/* History Details Modal - redesigned */}
      {selectedMeeting && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${modalEntered ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}
          onClick={handleCloseModal}
        >
          {/* overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-50" />

          {/* modal */}
          <div
            className={`relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-200 ${modalEntered ? 'scale-100' : 'scale-95'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {(() => {
              const steps = selectedMeeting?.steps || {};
              const endTs = (
                steps?.endTime?.toDate ? steps.endTime.toDate() :
                (selectedMeeting?.endTime?.toDate ? selectedMeeting.endTime.toDate() :
                (typeof selectedMeeting?.endTime === 'number' ? new Date(selectedMeeting.endTime) :
                (typeof selectedMeeting?.endTime === 'string' ? new Date(parseInt(selectedMeeting.endTime, 10)) : null)))
              );
              const durMs = typeof selectedMeeting?.duration === 'number' ? selectedMeeting.duration : (typeof selectedMeeting?.duration === 'string' ? parseInt(selectedMeeting.duration, 10) : null);
              const durStr = durMs ? formatDuration(Math.floor(durMs/1000)) : '—';
              const r1 = steps?.close?.user1Rating ?? '-';
              const r2 = steps?.close?.user2Rating ?? '-';
              return (
                <div className="sticky top-0 bg-white/90 backdrop-blur rounded-t-2xl border-b border-gray-200 p-6 flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-800">{endTs ? endTs.toLocaleString([], { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Meeting Summary'}</div>
                    <div className="mt-1 text-gray-600 flex items-center space-x-3">
                      <span className="flex items-center"><Clock className="w-4 h-4 mr-1"/> {durStr}</span>
                      <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200 text-sm">You: {r1}</span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 text-sm">Partner: {r2}</span>
                    </div>
                  </div>
                  <button onClick={handleCloseModal} className="p-2 text-gray-600 hover:text-gray-800 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              );
            })()}

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Check-ins */}
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center mb-3 text-gray-800 font-semibold"><MessageSquare className="w-4 h-4 mr-2"/> Check-ins</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Partner 1</div>
                    <div className="text-lg font-semibold text-gray-800">{selectedMeeting.steps?.checkin?.user1Word || '—'}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Partner 2</div>
                    <div className="text-lg font-semibold text-gray-800">{selectedMeeting.steps?.checkin?.user2Word || '—'}</div>
                  </div>
                </div>
              </div>

              {/* QoL */}
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center mb-3 text-gray-800 font-semibold"><TrendingUp className="w-4 h-4 mr-2"/> Quality of Life</div>
                {selectedMeeting.steps?.qualityoflife?.ratings ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-gray-600">
                        <tr>
                          <th className="text-left py-2">Category</th>
                          <th className="text-left py-2">Partner 1</th>
                          <th className="text-left py-2">Partner 2</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-800">
                        {['physical','mental','financial','friends','marriage','sex'].map(cat => (
                          <tr key={cat} className="border-t border-gray-100">
                            <td className="py-2 capitalize">{cat.replace('friends','Friends & Community')}</td>
                            <td className="py-2">{selectedMeeting.steps.qualityoflife.ratings[`${cat}_user1`] ?? '—'}</td>
                            <td className="py-2">{selectedMeeting.steps.qualityoflife.ratings[`${cat}_user2`] ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No data</div>
                )}
              </div>

              {/* Rocks */}
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center mb-3 text-gray-800 font-semibold"><Target className="w-4 h-4 mr-2"/> Rocks</div>
                {(() => {
                  const arr = Array.isArray(selectedMeeting.steps?.rocks) ? selectedMeeting.steps.rocks : (selectedMeeting.steps?.rocks?.rocks || []);
                  if (!arr || arr.length === 0) return <div className="text-sm text-gray-500">No data</div>;
                  const color = (s) => s==='completed' ? 'bg-green-100 text-green-700 border-green-200' : (s==='on-track' ? 'bg-blue-100 text-blue-700 border-blue-200' : (s==='off-track' ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-gray-100 text-gray-700 border-gray-200'));
                  return (
                    <div className="space-y-2">
                      {arr.map((r, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-gray-800">{detailData.rockMap[r.id]?.title || r.id}</div>
                            <span className={`px-2 py-0.5 rounded-full text-xs border ${color(r.status)}`}>{r.status.replace('-', ' ')}</span>
                          </div>
                          {r.comment && <div className="mt-2 text-sm text-gray-600">{r.comment}</div>}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* To-Dos */}
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center mb-3 text-gray-800 font-semibold"><CheckCircle className="w-4 h-4 mr-2"/> To-Dos</div>
                {(() => {
                  const arr = Array.isArray(selectedMeeting.steps?.todos) ? selectedMeeting.steps.todos : (selectedMeeting.steps?.todos?.todos || []);
                  if (!arr || arr.length === 0) return <div className="text-sm text-gray-500">No data</div>;
                  const color = (s) => s==='completed' ? 'bg-green-100 text-green-700 border-green-200' : (s==='new' ? 'bg-blue-100 text-blue-700 border-blue-200' : (s==='in-progress' ? 'bg-orange-100 text-orange-700 border-orange-200' : (s==='on-hold' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-gray-100 text-gray-700 border-gray-200')));
                  return (
                    <div className="space-y-2">
                      {arr.map((t, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                          <div className="font-medium text-gray-800">{detailData.todoMap[t.id]?.title || t.id}</div>
                          <span className={`px-2 py-0.5 rounded-full text-xs border ${color(t.status)}`}>{t.status.replace('-', ' ')}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Issues */}
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center mb-3 text-gray-800 font-semibold"><AlertCircle className="w-4 h-4 mr-2"/> Issues</div>
                {(() => {
                  const arr = Array.isArray(selectedMeeting.steps?.issues) ? selectedMeeting.steps.issues : (selectedMeeting.steps?.issues?.issues || []);
                  if (!arr || arr.length === 0) return <div className="text-sm text-gray-500">No data</div>;
                  const color = (s) => s==='resolved' ? 'bg-green-100 text-green-700 border-green-200' : (s==='open' ? 'bg-red-100 text-red-700 border-red-200' : (s==='in-progress' ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-gray-100 text-gray-700 border-gray-200'));
                  return (
                    <div className="space-y-2">
                      {arr.map((i, idx) => {
                        const title = i.type === 'rock' || String(i.id).startsWith('rock_') ? (detailData.rockMap[i.id?.replace('rock_','')]?.title || i.name || i.id) : (detailData.issueMap[i.id]?.name || i.name || i.id);
                        return (
                          <div key={idx} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div className="font-medium text-gray-800">{title}</div>
                              <span className={`px-2 py-0.5 rounded-full text-xs border ${color(i.status)}`}>{i.status.replace('-', ' ')}</span>
                            </div>
                            {i.notes && <div className="mt-2 text-sm text-gray-600">{i.notes}</div>}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Footer notes/comments */}
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center mb-3 text-gray-800 font-semibold"><FileText className="w-4 h-4 mr-2"/> Final Comments</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Partner 1 Comment</div>
                    <div className="text-gray-800">{selectedMeeting.steps?.close?.user1Comment || '—'}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Partner 2 Comment</div>
                    <div className="text-gray-800">{selectedMeeting.steps?.close?.user2Comment || '—'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingMeeting ? 'Edit Meeting' : 'Schedule New Meeting'}
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
                    Meeting Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Enter meeting title..."
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Describe your meeting..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Scheduled Date
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.scheduledDate}
                      onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Add any notes about this meeting..."
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
                    className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg font-medium hover:from-pink-600 hover:to-rose-600 transition-all duration-200"
                  >
                    {editingMeeting ? 'Update Meeting' : 'Schedule Meeting'}
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

export default WeeklyMeetings;
