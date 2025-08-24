import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import {
  Play,
  Pause,
  Square,
  Save,
  Clock,
  Heart
} from 'lucide-react';

const MeetingTimer = ({ onBack }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [notes, setNotes] = useState('');
  const intervalRef = useRef(null);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s]
      .map(v => v < 10 ? '0' + v : v)
      .filter((v, i) => v !== '00' || i > 0)
      .join(':');
  };

  const startTimer = () => {
    if (!isRunning) {
      setIsRunning(true);
      intervalRef.current = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    }
  };

  const pauseTimer = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const stopTimer = () => {
    setIsRunning(false);
    // Auto-generate meeting title with current date
    const today = new Date();
    const dateString = today.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    setMeetingTitle(`Relationship Meeting - ${dateString}`);
    setShowSaveForm(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const resetTimer = () => {
    setTime(0);
    setMeetingTitle('');
    setNotes('');
    setShowSaveForm(false);
    setIsSaving(false);
  };

  const saveMeeting = async () => {
    if (isSaving) return; // Prevent multiple saves

    setIsSaving(true);
    try {
      console.log('Starting to save meeting...');
      console.log('User ID:', user.uid);
      console.log('Meeting data:', {
        title: meetingTitle || 'Untitled Meeting',
        duration: time,
        notes: notes
      });

      const meetingData = {
        userId: user.uid,
        title: meetingTitle || 'Untitled Meeting',
        duration: time,
        notes: notes,
        createdAt: serverTimestamp()
      };

      console.log('Attempting to save to Firestore...');
      const docRef = await addDoc(collection(db, 'meetings'), meetingData);
      console.log('Meeting saved successfully with ID:', docRef.id);

      // Reset everything after saving
      resetTimer();
      showSuccess('Meeting Saved', 'Your meeting has been saved successfully!');
    } catch (error) {
      console.error('Error saving meeting:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      showError('Save Failed', `Failed to save meeting: ${error.message}. Please check your Firebase configuration.`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100">
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Timer Display */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-8">
              <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-3 rounded-lg">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800">Meeting Timer</h1>
            </div>
            
            <div className="text-6xl font-mono font-bold text-gray-800 mb-8">
              {formatTime(time)}
            </div>
            
            <div className="flex items-center justify-center space-x-4">
              {!isRunning ? (
                <button
                  onClick={startTimer}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 flex items-center space-x-2"
                >
                  <Play className="w-6 h-6" />
                  <span>Start</span>
                </button>
              ) : (
                <button
                  onClick={pauseTimer}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 flex items-center space-x-2"
                >
                  <Pause className="w-6 h-6" />
                  <span>Pause</span>
                </button>
              )}
              
              <button
                onClick={stopTimer}
                className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-red-600 hover:to-pink-600 transition-all duration-200 flex items-center space-x-2"
              >
                <Square className="w-6 h-6" />
                <span>End Meeting</span>
              </button>
            </div>
          </div>
        </div>

        {/* Save Form */}
        {showSaveForm && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Save Meeting</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Title
                </label>
                <input
                  type="text"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Enter meeting title..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Add any notes about this meeting..."
                  rows={4}
                />
              </div>
              
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={resetTimer}
                  className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveMeeting}
                  disabled={isSaving}
                  className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg font-medium hover:from-pink-600 hover:to-rose-600 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Meeting</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingTimer;
