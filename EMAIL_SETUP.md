# Email Notification System Setup Guide

This guide will help you set up the email notification system for your Couples Tracker app.

## Overview

The email notification system consists of:
- **Firebase Cloud Functions**: Backend email sending logic
- **Frontend Email Service**: React service for calling email functions
- **Enhanced Notification Context**: Integration with email notifications
- **Email Settings Component**: User interface for managing preferences

## Prerequisites

1. Firebase project with Cloud Functions enabled
2. Firebase Authentication set up
3. Firestore database configured
4. Firebase Trigger Email extension (recommended) or custom email service

## Setup Steps

### 1. Install Dependencies

Navigate to the functions directory and install the required dependencies:

```bash
cd functions
npm install nodemailer
```

### 2. Configure Firebase Functions

#### Option A: Using Firebase Trigger Email Extension (Recommended)

1. Install the Firebase Trigger Email extension:
   ```bash
   firebase ext:install firestore-send-email
   ```

2. Configure the extension with your email service (SendGrid, Mailgun, etc.)

3. The functions will automatically use the extension to send emails

#### Option B: Custom Email Service

If you prefer to use a custom email service, update the functions to use your preferred email provider:

```javascript
// In functions/index.js, replace the mail collection approach with your email service
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  service: 'gmail', // or your preferred service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

### 3. Deploy Firebase Functions

Deploy the updated functions to Firebase:

```bash
firebase deploy --only functions
```

### 4. Configure Environment Variables

Set up the following Firebase Functions configuration:

```bash
firebase functions:config:set mail.from="noreply@yourdomain.com"
firebase functions:config:set mail.reply_to="support@yourdomain.com"
firebase functions:config:set app.url="https://your-app-domain.com"
firebase functions:config:set app.help_url="https://your-app-domain.com/help"
firebase functions:config:set app.accept_url="https://your-app-domain.com/accept-invite"
```

### 5. Update Frontend Configuration

Ensure your Firebase configuration in `src/firebase/config.js` includes the correct project settings.

### 6. Test the Email System

1. Start your React app:
   ```bash
   npm start
   ```

2. Navigate to the Email Settings page (you'll need to add this to your routing)

3. Use the test email function to verify everything is working

## Email Templates

The system includes four main email templates:

### 1. Meeting Reminder
- **Trigger**: 1 hour before scheduled meetings
- **Content**: Meeting title, time, agenda items, and join link
- **Template**: `renderMeetingReminderEmail`

### 2. Todo Notification
- **Trigger**: When a new todo is assigned
- **Content**: Todo title, description, priority, due date, and action link
- **Template**: `renderTodoNotificationEmail`

### 3. Partner Invitation
- **Trigger**: When a partner invitation is created
- **Content**: Inviter name, invitation message, and accept link
- **Template**: `renderInviteEmail`

### 4. General Notification
- **Trigger**: Manual or system-generated notifications
- **Content**: Custom title, message, and optional action button
- **Template**: `renderGeneralNotificationEmail`

## Usage Examples

### Sending a Meeting Reminder

```javascript
import { useNotification } from '../contexts/NotificationContext';

const { showMeetingReminder } = useNotification();

// In your meeting creation/scheduling logic
showMeetingReminder({
  id: 'meeting-123',
  partnerEmail: 'partner@example.com',
  title: 'Weekly Check-in',
  startTime: new Date('2024-01-15T10:00:00Z'),
  agendaItems: ['Review goals', 'Plan weekend', 'Discuss finances']
}, true); // true = send email notification
```

### Sending a Todo Notification

```javascript
import { useNotification } from '../contexts/NotificationContext';

const { showTodoNotification } = useNotification();

// In your todo creation logic
showTodoNotification({
  id: 'todo-456',
  partnerEmail: 'partner@example.com',
  title: 'Book dinner reservation',
  description: 'Make reservation for anniversary dinner',
  priority: 'high',
  dueDate: new Date('2024-01-20')
}, true); // true = send email notification
```

### Sending a General Notification

```javascript
import { useNotification } from '../contexts/NotificationContext';

const { showGeneralNotification } = useNotification();

// For general notifications
showGeneralNotification({
  partnerEmail: 'partner@example.com',
  title: 'App Update Available',
  message: 'A new version of the app is available with exciting features!',
  type: 'info',
  actionUrl: 'https://your-app.com/update',
  actionText: 'Learn More'
}, true); // true = send email notification
```

## Email Preferences

Users can manage their email notification preferences through the EmailSettings component:

- **Meeting Reminders**: Enable/disable meeting reminder emails
- **Todo Notifications**: Enable/disable todo assignment emails
- **General Notifications**: Enable/disable general app notifications
- **Partner Invitations**: Enable/disable partner invitation emails

## Scheduled Functions

The system includes a scheduled function that runs every hour to send meeting reminders:

- **Function**: `scheduledMeetingReminders`
- **Schedule**: Every 1 hour
- **Purpose**: Automatically sends reminders for meetings starting in the next 1-2 hours

## Troubleshooting

### Common Issues

1. **Emails not sending**: Check Firebase Functions logs for errors
2. **Authentication errors**: Ensure Firebase Auth is properly configured
3. **Template rendering issues**: Verify email template syntax
4. **Scheduled functions not running**: Check Firebase Functions billing and quotas

### Debugging

1. Check Firebase Functions logs:
   ```bash
   firebase functions:log
   ```

2. Test individual functions:
   ```bash
   firebase functions:shell
   ```

3. Verify email service configuration in Firebase console

### Email Service Limits

Be aware of your email service provider's limits:
- SendGrid: 100 emails/day (free tier)
- Mailgun: 5,000 emails/month (free tier)
- Gmail: 500 emails/day (with app passwords)

## Security Considerations

1. **Authentication**: All email functions require user authentication
2. **Rate Limiting**: Implement rate limiting to prevent abuse
3. **Email Validation**: Validate email addresses before sending
4. **Unsubscribe**: Include unsubscribe links in all emails
5. **Data Privacy**: Ensure compliance with email privacy laws (GDPR, CAN-SPAM)

## Monitoring and Analytics

The system logs all email sends to the `emailLogs` collection in Firestore, including:
- Email type
- Recipient
- Sender
- Timestamp
- Success/failure status

Use this data to monitor email delivery rates and troubleshoot issues.

## Next Steps

1. Customize email templates to match your brand
2. Add more notification types as needed
3. Implement email analytics and reporting
4. Add email preference management to user profiles
5. Set up email delivery monitoring and alerts

