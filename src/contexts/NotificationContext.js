import React, { createContext, useContext, useState, useCallback } from 'react';
import Notification from '../components/Notification';
import emailService from '../services/emailService';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [emailPreferences, setEmailPreferences] = useState({
    meetingReminders: true,
    todoNotifications: true,
    generalNotifications: true,
    partnerInvitations: true
  });

  const addNotification = useCallback(({ type = 'info', title, message, duration = 5000, sendEmail = false, emailData = null }) => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      type,
      title,
      message,
      duration,
      show: true
    };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    // Send email notification if requested
    if (sendEmail && emailData) {
      sendEmailNotification(type, emailData).catch(error => {
        console.error('Failed to send email notification:', error);
        // Add a fallback notification
        addNotification({
          type: 'error',
          title: 'Email Failed',
          message: 'Failed to send email notification',
          duration: 3000
        });
      });
    }
    
    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const showSuccess = useCallback((title, message, duration, sendEmail = false, emailData = null) => {
    return addNotification({ type: 'success', title, message, duration, sendEmail, emailData });
  }, [addNotification]);

  const showError = useCallback((title, message, duration, sendEmail = false, emailData = null) => {
    return addNotification({ type: 'error', title, message, duration, sendEmail, emailData });
  }, [addNotification]);

  const showWarning = useCallback((title, message, duration, sendEmail = false, emailData = null) => {
    return addNotification({ type: 'warning', title, message, duration, sendEmail, emailData });
  }, [addNotification]);

  const showInfo = useCallback((title, message, duration, sendEmail = false, emailData = null) => {
    return addNotification({ type: 'info', title, message, duration, sendEmail, emailData });
  }, [addNotification]);

  // Email notification helper
  const sendEmailNotification = useCallback(async (type, emailData) => {
    try {
      // Check if email notifications are enabled
      const isEnabled = await emailService.isEmailNotificationsEnabled();
      if (!isEnabled) {
        console.log('Email notifications are disabled');
        return;
      }

      switch (type) {
        case 'meeting_reminder':
          await emailService.sendMeetingReminder(emailData);
          break;
        case 'todo_notification':
          await emailService.sendTodoNotification(emailData);
          break;
        case 'general_notification':
          await emailService.sendGeneralNotification(emailData);
          break;
        case 'partner_invitation':
          await emailService.sendPartnerInvitation(emailData);
          break;
        default:
          console.warn('Unknown email notification type:', type);
      }
    } catch (error) {
      console.error('Email notification failed:', error);
      throw error;
    }
  }, []);

  // Meeting reminder notification
  const showMeetingReminder = useCallback((meetingData, sendEmail = true) => {
    const emailData = {
      id: meetingData.id,
      partnerEmail: meetingData.partnerEmail,
      title: meetingData.title,
      startTime: meetingData.startTime,
      agendaItems: meetingData.agendaItems || []
    };

    return showInfo(
      'Meeting Reminder',
      `Reminder: ${meetingData.title} starts in 1 hour`,
      5000,
      sendEmail,
      { type: 'meeting_reminder', ...emailData }
    );
  }, [showInfo]);

  // Todo notification
  const showTodoNotification = useCallback((todoData, sendEmail = true) => {
    const emailData = {
      id: todoData.id,
      partnerEmail: todoData.partnerEmail,
      title: todoData.title,
      description: todoData.description,
      priority: todoData.priority || 'medium',
      dueDate: todoData.dueDate
    };

    return showInfo(
      'New Todo Assigned',
      `New todo: ${todoData.title}`,
      5000,
      sendEmail,
      { type: 'todo_notification', ...emailData }
    );
  }, [showInfo]);

  // Partner invitation notification
  const showPartnerInvitation = useCallback((invitationData, sendEmail = true) => {
    const emailData = {
      id: invitationData.id,
      inviteeEmail: invitationData.inviteeEmail,
      inviterName: invitationData.inviterName
    };

    return showSuccess(
      'Partner Invitation Sent',
      `Invitation sent to ${invitationData.inviteeEmail}`,
      5000,
      sendEmail,
      { type: 'partner_invitation', ...emailData }
    );
  }, [showSuccess]);

  // General notification
  const showGeneralNotification = useCallback((notificationData, sendEmail = true) => {
    const emailData = {
      partnerEmail: notificationData.partnerEmail,
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type || 'info',
      actionUrl: notificationData.actionUrl,
      actionText: notificationData.actionText
    };

    return showInfo(
      notificationData.title,
      notificationData.message,
      5000,
      sendEmail,
      { type: 'general_notification', ...emailData }
    );
  }, [showInfo]);

  // Update email preferences
  const updateEmailPreferences = useCallback(async (newPreferences) => {
    try {
      await emailService.updateEmailPreferences(newPreferences);
      setEmailPreferences(prev => ({ ...prev, ...newPreferences }));
      showSuccess('Preferences Updated', 'Email notification preferences updated successfully');
    } catch (error) {
      showError('Update Failed', 'Failed to update email preferences');
    }
  }, [showSuccess, showError]);

  // Test email function
  const testEmailNotification = useCallback(async (email) => {
    try {
      await emailService.sendTestEmail(email);
      showSuccess('Test Email Sent', 'Test email sent successfully');
    } catch (error) {
      showError('Test Failed', 'Failed to send test email');
    }
  }, [showSuccess, showError]);

  const value = {
    notifications,
    emailPreferences,
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showMeetingReminder,
    showTodoNotification,
    showGeneralNotification,
    showPartnerInvitation,
    updateEmailPreferences,
    testEmailNotification,
    sendEmailNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {/* Render notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            type={notification.type}
            title={notification.title}
            message={notification.message}
            duration={notification.duration}
            show={notification.show}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
