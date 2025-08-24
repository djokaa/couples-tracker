import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../firebase/config';
import app from '../firebase/config';

// Initialize Firebase Functions
const functions = getFunctions(app, 'us-central1');

// Email notification service
class EmailService {
  constructor() {
    this.functions = functions;
  }

  // Send meeting reminder email
  async sendMeetingReminder(meetingData) {
    try {
      const sendMeetingReminder = httpsCallable(this.functions, 'sendMeetingReminder');
      
      const result = await sendMeetingReminder({
        meetingId: meetingData.id,
        partnerEmail: meetingData.partnerEmail,
        meetingTitle: meetingData.title,
        meetingTime: meetingData.startTime,
        agendaItems: meetingData.agendaItems || [],
        testMode: meetingData.testMode || false
      });

      return result.data;
    } catch (error) {
      console.error('Error sending meeting reminder:', error);
      throw new Error('Failed to send meeting reminder email');
    }
  }

  // Send todo notification email
  async sendTodoNotification(todoData) {
    try {
      const sendTodoNotification = httpsCallable(this.functions, 'sendTodoNotification');
      
      const result = await sendTodoNotification({
        todoId: todoData.id,
        partnerEmail: todoData.partnerEmail,
        todoTitle: todoData.title,
        todoDescription: todoData.description,
        priority: todoData.priority || 'medium',
        dueDate: todoData.dueDate,
        testMode: todoData.testMode || false
      });

      return result.data;
    } catch (error) {
      console.error('Error sending todo notification:', error);
      throw new Error('Failed to send todo notification email');
    }
  }

  // Send general notification email
  async sendGeneralNotification(notificationData) {
    try {
      const sendGeneralNotification = httpsCallable(this.functions, 'sendGeneralNotification');
      
      const result = await sendGeneralNotification({
        partnerEmail: notificationData.partnerEmail,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type || 'info',
        actionUrl: notificationData.actionUrl,
        actionText: notificationData.actionText,
        testMode: notificationData.testMode || false
      });

      return result.data;
    } catch (error) {
      console.error('Error sending general notification:', error);
      throw new Error('Failed to send notification email');
    }
  }

  // Send welcome email (uses existing function)
  async sendWelcomeEmail(userData) {
    try {
      // This would typically be triggered automatically by Firebase Auth
      // but we can also call it manually if needed
      const sendWelcomeEmail = httpsCallable(this.functions, 'sendWelcomeEmailOnSignup');
      
      const result = await sendWelcomeEmail({
        userId: userData.uid,
        email: userData.email,
        displayName: userData.displayName
      });

      return result.data;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw new Error('Failed to send welcome email');
    }
  }

  // Send new account created notification
  async sendNewAccountNotification(userData) {
    try {
      console.log('EmailService: Calling sendNewAccountNotification with data:', userData);
      
      // Create functions instance directly
      const functions = getFunctions(app, 'us-central1');
      console.log('EmailService: Created functions instance:', functions);
      
      const sendNewAccountNotification = httpsCallable(functions, 'sendNewAccountNotification');
      
      const callData = {
        userId: userData.uid,
        email: userData.email,
        displayName: userData.displayName,
        signupMethod: userData.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'email',
        testMode: userData.testMode || false
      };
      
      console.log('EmailService: Calling function with data:', callData);
      
      const result = await sendNewAccountNotification(callData);
      
      console.log('EmailService: Function call successful, result:', result.data);
      return result.data;
    } catch (error) {
      console.error('EmailService: Error sending new account notification:', error);
      console.error('EmailService: Error details:', {
        code: error.code,
        message: error.message,
        details: error.details
      });
      throw new Error(`Failed to send new account notification: ${error.message}`);
    }
  }

  // Send partner invitation email
  async sendPartnerInvitation(invitationData) {
    try {
      // This uses the existing invite email function
      const sendInviteEmail = httpsCallable(this.functions, 'sendInviteEmailOnCreate');
      
      const result = await sendInviteEmail({
        inviteId: invitationData.id,
        inviteeEmail: invitationData.inviteeEmail,
        inviterName: invitationData.inviterName
      });

      return result.data;
    } catch (error) {
      console.error('Error sending partner invitation:', error);
      throw new Error('Failed to send partner invitation email');
    }
  }

  // Test email function
  async sendTestEmail(email) {
    try {
      const sendTestEmailCallable = httpsCallable(this.functions, 'sendTestEmailCallable');
      
      const result = await sendTestEmailCallable({
        to: email
      });

      return result.data;
    } catch (error) {
      console.error('Error sending test email:', error);
      throw new Error('Failed to send test email');
    }
  }

  // Get current user's partner email
  async getPartnerEmail() {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // This would typically come from your user profile or partner data
      // For now, we'll return a placeholder - you'll need to implement this
      // based on your user data structure
      return null; // Replace with actual partner email retrieval
    } catch (error) {
      console.error('Error getting partner email:', error);
      throw error;
    }
  }

  // Check if email notifications are enabled for user
  async isEmailNotificationsEnabled() {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return false;
      }

      // This would check user preferences
      // For now, return true as default
      return true;
    } catch (error) {
      console.error('Error checking email notification settings:', error);
      return false;
    }
  }

  // Update email notification preferences
  async updateEmailPreferences(preferences) {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // This would update user preferences in Firestore
      // For now, just log the preferences
      console.log('Email preferences updated:', preferences);
      return { success: true };
    } catch (error) {
      console.error('Error updating email preferences:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const emailService = new EmailService();
export default emailService;

// Export individual methods for convenience
export const {
  sendMeetingReminder,
  sendTodoNotification,
  sendGeneralNotification,
  sendWelcomeEmail,
  sendNewAccountNotification,
  sendPartnerInvitation,
  sendTestEmail,
  getPartnerEmail,
  isEmailNotificationsEnabled,
  updateEmailPreferences
} = emailService;
