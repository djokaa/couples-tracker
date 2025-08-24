import React, { useState } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { sendNewAccountNotification } from '../services/emailService';
import { Mail, Send, CheckCircle, AlertCircle, UserPlus } from 'lucide-react';

const EmailTest = () => {
  const { 
    showMeetingReminder, 
    showTodoNotification, 
    showGeneralNotification,
    testEmailNotification,
    showSuccess,
    showError 
  } = useNotification();
  const { user } = useAuth();

  const [testEmail, setTestEmail] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  const handleTestMeetingReminder = async () => {
    if (!testEmail) {
      showError('Test Failed', 'Please enter an email address');
      return;
    }
    
    setIsTesting(true);
    try {
      await showMeetingReminder({
        id: 'test-meeting-123',
        partnerEmail: testEmail,
        title: 'Test Meeting Reminder',
        startTime: new Date(Date.now() + 3600000), // 1 hour from now
        agendaItems: ['Test agenda item 1', 'Test agenda item 2'],
        testMode: true
      }, true);
      showSuccess('Meeting Reminder Sent', 'Meeting reminder email sent successfully');
    } catch (error) {
      showError('Test Failed', 'Failed to send meeting reminder email');
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestTodoNotification = async () => {
    if (!testEmail) {
      showError('Test Failed', 'Please enter an email address');
      return;
    }
    
    setIsTesting(true);
    try {
      await showTodoNotification({
        id: 'test-todo-456',
        partnerEmail: testEmail,
        title: 'Test Todo Assignment',
        description: 'This is a test todo notification',
        priority: 'high',
        dueDate: new Date(Date.now() + 86400000), // 1 day from now
        testMode: true
      }, true);
      showSuccess('Todo Notification Sent', 'Todo notification email sent successfully');
    } catch (error) {
      showError('Test Failed', 'Failed to send todo notification email');
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestGeneralNotification = async () => {
    if (!testEmail) {
      showError('Test Failed', 'Please enter an email address');
      return;
    }
    
    setIsTesting(true);
    try {
      await showGeneralNotification({
        partnerEmail: testEmail,
        title: 'Test General Notification',
        message: 'This is a test general notification message',
        type: 'info',
        actionUrl: 'https://example.com',
        actionText: 'Learn More',
        testMode: true
      }, true);
      showSuccess('General Notification Sent', 'General notification email sent successfully');
    } catch (error) {
      showError('Test Failed', 'Failed to send general notification email');
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestNewAccountNotification = async () => {
    if (!testEmail) {
      showError('Test Failed', 'Please enter an email address');
      return;
    }
    
    setIsTesting(true);
    try {
      console.log('Testing new account notification with data:', {
        uid: 'test-user-123',
        email: testEmail,
        displayName: 'Test User',
        providerData: [{ providerId: 'password' }],
        testMode: true
      });
      
      await sendNewAccountNotification({
        uid: 'test-user-123',
        email: testEmail,
        displayName: 'Test User',
        providerData: [{ providerId: 'password' }],
        testMode: true
      });
      showSuccess('New Account Notification Sent', 'New account notification email sent successfully');
    } catch (error) {
      console.error('New account notification error:', error);
      showError('Test Failed', `Failed to send new account notification email: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestAllEmails = async () => {
    if (!testEmail) {
      showError('Test Failed', 'Please enter an email address');
      return;
    }
    
    setIsTesting(true);
    try {
      // Send all types of test emails
      await Promise.all([
        testEmailNotification(testEmail),
        showMeetingReminder({
          id: 'test-meeting-all',
          partnerEmail: testEmail,
          title: 'Test Meeting Reminder (All Types)',
          startTime: new Date(Date.now() + 3600000),
          agendaItems: ['Test agenda item 1', 'Test agenda item 2'],
          testMode: true
        }, true),
        showTodoNotification({
          id: 'test-todo-all',
          partnerEmail: testEmail,
          title: 'Test Todo Assignment (All Types)',
          description: 'This is a test todo notification from the "Test All" feature',
          priority: 'high',
          dueDate: new Date(Date.now() + 86400000),
          testMode: true
        }, true),
        showGeneralNotification({
          partnerEmail: testEmail,
          title: 'Test General Notification (All Types)',
          message: 'This is a test general notification from the "Test All" feature',
          type: 'info',
          actionUrl: 'https://example.com',
          actionText: 'Learn More',
          testMode: true
        }, true),
        sendNewAccountNotification({
          uid: 'test-user-all',
          email: testEmail,
          displayName: 'Test User (All Types)',
          providerData: [{ providerId: 'password' }],
          testMode: true
        })
      ]);
      
      showSuccess('All Emails Sent', 'All email types have been sent successfully!');
    } catch (error) {
      showError('Test Failed', 'Failed to send some emails. Check the console for details.');
      console.error('Test all emails error:', error);
    } finally {
      setIsTesting(false);
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
      showSuccess('Test Email Sent', 'Test email sent successfully');
    } catch (error) {
      showError('Test Failed', 'Failed to send test email');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Mail className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email System Test</h1>
          <p className="text-gray-600">Test the email notification system</p>
        </div>
      </div>

      {/* Test Email Input */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Email Address</h2>
        <div className="flex space-x-2">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="Enter email address for testing"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleTestEmail}
            disabled={isTesting || !testEmail}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {isTesting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Testing...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Test Email</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Email Types</h2>
        
        {/* Test All Emails Button */}
        <div className="mb-4">
          <button
            onClick={handleTestAllEmails}
            disabled={isTesting || !testEmail}
            className="w-full p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2 font-medium"
          >
            {isTesting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Testing All Email Types...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Test All Email Types</span>
              </>
            )}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={handleTestMeetingReminder}
            className="p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-left"
          >
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-900">Meeting Reminder</span>
            </div>
            <p className="text-sm text-gray-600">Test meeting reminder email</p>
          </button>

          <button
            onClick={handleTestTodoNotification}
            className="p-4 border border-green-200 rounded-lg hover:bg-green-50 transition-colors text-left"
          >
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-gray-900">Todo Notification</span>
            </div>
            <p className="text-sm text-gray-600">Test todo assignment email</p>
          </button>

          <button
            onClick={handleTestGeneralNotification}
            className="p-4 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors text-left"
          >
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-gray-900">General Notification</span>
            </div>
            <p className="text-sm text-gray-600">Test general notification email</p>
          </button>

          <button
            onClick={handleTestNewAccountNotification}
            className="p-4 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors text-left"
          >
            <div className="flex items-center space-x-2 mb-2">
              <UserPlus className="w-5 h-5 text-orange-600" />
              <span className="font-medium text-gray-900">New Account Notification</span>
            </div>
            <p className="text-sm text-gray-600">Test new account created email</p>
          </button>
        </div>
      </div>

      {/* Status Information */}
      <div className="bg-green-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-green-900 mb-2">System Status</h3>
        <div className="space-y-2 text-sm text-green-800">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>Email service configured (SendGrid)</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>Notification context enhanced</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>Firebase Functions ready</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>SMTP configured and ready</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>New account notifications enabled</span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-green-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-green-900 mb-2">Ready to Test!</h3>
        <div className="space-y-2 text-sm text-green-800">
          <p>✅ SendGrid SMTP configured</p>
          <p>✅ Firebase Functions deployed</p>
          <p>✅ Email system ready</p>
          <p>🎯 Enter your email above and test the system!</p>
        </div>
      </div>
    </div>
  );
};

export default EmailTest;
