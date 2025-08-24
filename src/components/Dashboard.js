import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Heart, LogOut, Play, User, Mail, Calendar, Clock, TrendingUp } from 'lucide-react';
import MeetingAgenda from './MeetingAgenda';
import MeetingHistory from './MeetingHistory';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [showAgenda, setShowAgenda] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [firebaseStatus, setFirebaseStatus] = useState('checking');

  // Test Firebase connection
  useEffect(() => {
    const testFirebase = async () => {
      try {
        console.log('Testing Firebase connection...');
        const testDoc = await addDoc(collection(db, 'test'), {
          test: true,
          timestamp: serverTimestamp()
        });
        console.log('Firebase connection successful, test doc ID:', testDoc.id);
        setFirebaseStatus('connected');
        
        // Clean up test document
        // Note: In production, you'd want to delete this test doc
      } catch (error) {
        console.error('Firebase connection failed:', error);
        setFirebaseStatus('error');
        alert(`Firebase connection error: ${error.message}. Please check your Firebase configuration and make sure Firestore is enabled.`);
      }
    };

    if (user) {
      testFirebase();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleStartMeeting = () => {
    setShowAgenda(true);
  };

  const handleViewHistory = () => {
    setShowHistory(true);
  };

  const handleMeetingComplete = () => {
    setShowAgenda(false);
    // You could add a success message or redirect to history here
  };

  if (showAgenda) {
    return <MeetingAgenda onBack={() => setShowAgenda(false)} onComplete={handleMeetingComplete} />;
  }

  if (showHistory) {
    return <MeetingHistory onBack={() => setShowHistory(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-2 rounded-lg">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">Couples Tracker</h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Firebase Status */}
      {firebaseStatus === 'checking' && (
        <div className="max-w-4xl mx-auto px-4 py-2">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm text-blue-700">Testing Firebase connection...</p>
          </div>
        </div>
      )}

      {firebaseStatus === 'error' && (
        <div className="max-w-4xl mx-auto px-4 py-2">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
            <p className="text-sm text-red-700">⚠️ Firebase connection failed. Please check your configuration.</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Welcome back, {user?.displayName?.split(' ')[0] || 'Partner'}!
            </h2>
            <p className="text-gray-600">
              Ready for your weekly relationship meeting?
            </p>
          </div>

          {/* User Info */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-pink-500" />
              Your Profile
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">
                  <strong>Name:</strong> {user?.displayName || 'Not provided'}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">
                  <strong>Email:</strong> {user?.email || 'Not provided'}
                </span>
              </div>
            </div>
          </div>

          {/* Start Meeting Button */}
          <div className="text-center">
            <button
              onClick={handleStartMeeting}
              disabled={firebaseStatus === 'error'}
              className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-pink-600 hover:to-rose-600 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-3 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-6 h-6" />
              <span>Start Weekly Meeting</span>
            </button>
            <p className="text-gray-500 text-sm mt-3">
              Begin your structured relationship meeting with 6 key sections
            </p>
          </div>
        </div>

        {/* Meeting Overview */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-pink-500" />
            Meeting Structure
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-pink-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Heart className="w-4 h-4 text-pink-500" />
                <span className="font-medium text-sm">1. Gratitude</span>
              </div>
              <p className="text-xs text-gray-600">Share what you're grateful for</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-sm">2. Annual Rocks</span>
              </div>
              <p className="text-xs text-gray-600">Review goals and priorities</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-green-500" />
                <span className="font-medium text-sm">3. Scorecard</span>
              </div>
              <p className="text-xs text-gray-600">Check relationship metrics</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-4 h-4 text-purple-500" />
                <span className="font-medium text-sm">4. To-Dos</span>
              </div>
              <p className="text-xs text-gray-600">Assign action items</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <span className="font-medium text-sm">5. Issues (IDS)</span>
              </div>
              <p className="text-xs text-gray-600">Identify and solve problems</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-4 h-4 text-yellow-500" />
                <span className="font-medium text-sm">6. Rating</span>
              </div>
              <p className="text-xs text-gray-600">Rate the meeting</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-pink-500" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleStartMeeting}
              disabled={firebaseStatus === 'error'}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-200 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-5 h-5" />
              <span>Start New Meeting</span>
            </button>
            <button
              onClick={handleViewHistory}
              disabled={firebaseStatus === 'error'}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-4 rounded-xl font-medium hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Calendar className="w-5 h-5" />
              <span>View History</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
