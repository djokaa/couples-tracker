import React, { useState, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { Mail, Bell, Clock, CheckSquare, Users, Settings, Send, TestTube } from 'lucide-react';

const EmailSettings = () => {
  const { 
    emailPreferences, 
    updateEmailPreferences, 
    testEmailNotification,
    showSuccess,
    showError 
  } = useNotification();

  const [preferences, setPreferences] = useState(emailPreferences);
  const [testEmail, setTestEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    setPreferences(emailPreferences);
  }, [emailPreferences]);

  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSavePreferences = async () => {
    setIsLoading(true);
    try {
      await updateEmailPreferences(preferences);
      showSuccess('Preferences Saved', 'Email notification preferences updated successfully');
    } catch (error) {
      showError('Save Failed', 'Failed to update email preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      showError('Test Failed', 'Please enter an email address');
      return;
    }

    setIsTesting(true);
    try {
      await testEmailNotification(testEmail);
      setTestEmail('');
    } catch (error) {
      showError('Test Failed', 'Failed to send test email');
    } finally {
      setIsTesting(false);
    }
  };

  const notificationTypes = [
    {
      key: 'meetingReminders',
      title: 'Meeting Reminders',
      description: 'Get notified about upcoming meetings',
      icon: Clock,
      color: 'text-blue-600'
    },
    {
      key: 'todoNotifications',
      title: 'Todo Notifications',
      description: 'Receive notifications for new todos assigned to you',
      icon: CheckSquare,
      color: 'text-green-600'
    },
    {
      key: 'generalNotifications',
      title: 'General Notifications',
      description: 'Receive general app notifications and updates',
      icon: Bell,
      color: 'text-purple-600'
    },
    {
      key: 'partnerInvitations',
      title: 'Partner Invitations',
      description: 'Get notified when your partner sends you invitations',
      icon: Users,
      color: 'text-pink-600'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Mail className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Notifications</h1>
          <p className="text-gray-600">Manage your email notification preferences</p>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Settings className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
        </div>

        <div className="space-y-4">
          {notificationTypes.map(({ key, title, description, icon: Icon, color }) => (
            <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="flex items-center space-x-3">
                <Icon className={`w-5 h-5 ${color}`} />
                <div>
                  <h3 className="font-medium text-gray-900">{title}</h3>
                  <p className="text-sm text-gray-600">{description}</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={preferences[key]}
                  onChange={(e) => handlePreferenceChange(key, e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSavePreferences}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Save Preferences</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Test Email Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-6">
          <TestTube className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Test Email Notifications</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="testEmail" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="testEmail"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Enter email address to test"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleTestEmail}
              disabled={isTesting || !testEmail}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isTesting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Test Email</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Email Templates Preview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Email Templates</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Meeting Reminder Template */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Clock className="w-5 h-5 text-blue-600" />
              <h3 className="font-medium text-gray-900">Meeting Reminder</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Sent 1 hour before scheduled meetings with agenda items and meeting details.
            </p>
            <div className="text-xs text-gray-500">
              Includes: Meeting title, time, agenda, and direct link to join
            </div>
          </div>

          {/* Todo Notification Template */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <CheckSquare className="w-5 h-5 text-green-600" />
              <h3 className="font-medium text-gray-900">Todo Notification</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Sent when a new todo is assigned to you with priority and due date.
            </p>
            <div className="text-xs text-gray-500">
              Includes: Todo title, description, priority, due date, and action link
            </div>
          </div>

          {/* Partner Invitation Template */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Users className="w-5 h-5 text-pink-600" />
              <h3 className="font-medium text-gray-900">Partner Invitation</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Sent when your partner invites you to connect on the platform.
            </p>
            <div className="text-xs text-gray-500">
              Includes: Inviter name, invitation message, and accept link
            </div>
          </div>

          {/* General Notification Template */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Bell className="w-5 h-5 text-purple-600" />
              <h3 className="font-medium text-gray-900">General Notification</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Used for general app notifications, updates, and announcements.
            </p>
            <div className="text-xs text-gray-500">
              Includes: Custom title, message, and optional action button
            </div>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Need Help?</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>• Email notifications are sent using Firebase Cloud Functions</p>
          <p>• You can disable specific notification types above</p>
          <p>• Test emails help verify your email configuration</p>
          <p>• All emails include unsubscribe options</p>
        </div>
      </div>
    </div>
  );
};

export default EmailSettings;

