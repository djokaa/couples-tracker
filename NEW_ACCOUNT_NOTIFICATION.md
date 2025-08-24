# New Account Notification System

## Overview

The new account notification system automatically sends a welcome email when a new user creates an account in the Couples Tracker app. This system is designed to provide a warm welcome and guide new users through their first steps.

## Features

### 🎉 Welcome Email
- **Automatic Trigger**: Sent when a new user profile is created in Firestore
- **Professional Design**: Beautiful HTML email with brand colors and styling
- **Personalized Content**: Includes user's name and signup method
- **Action-Oriented**: Provides clear next steps and helpful links

### 📧 Email Content
- **Account Details**: Shows email, signup method, and creation date
- **Next Steps**: Guides users through profile completion and partner invitation
- **Help Resources**: Links to help center and app access
- **Security Notice**: Includes security information for account protection

## Technical Implementation

### Firebase Functions

#### 1. Automatic Trigger Function
```javascript
exports.sendNewAccountNotificationOnProfileCreate = functions.firestore
  .document('userProfiles/{userId}')
  .onCreate(async (snap) => {
    // Automatically sends email when user profile is created
  });
```

#### 2. Manual Callable Function
```javascript
exports.sendNewAccountNotification = functions.https.onCall(async (data, context) => {
  // Allows manual triggering of new account notifications
});
```

### Email Service Integration

#### Frontend Service
```javascript
// Send new account notification
await sendNewAccountNotification({
  uid: userData.uid,
  email: userData.email,
  displayName: userData.displayName,
  signupMethod: 'google' | 'email',
  testMode: false
});
```

### Email Template

The email template includes:
- **Brand Header**: Couples Tracker logo and branding
- **Success Message**: Celebration of account creation
- **Account Information**: User details and signup method
- **Next Steps**: Clear guidance for new users
- **Help Center**: Link to support resources
- **App Access**: Direct link to the application

## Testing

### Manual Testing
1. **Email Test Component**: Use the EmailTest component in the app
2. **Test Button**: Click "New Account Notification" to test
3. **Test All**: Use "Test All Email Types" to test all notifications

### Automated Testing
```javascript
// Test script for new account notification
const result = await sendNewAccountNotification({
  userId: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  signupMethod: 'email',
  testMode: true
});
```

## Configuration

### Environment Variables
- `app.url`: Application URL for email links
- `app.help_url`: Help center URL
- `mail.from`: Sender email address
- `mail.reply_to`: Reply-to email address

### Email Logging
All new account notifications are logged in the `emailLogs` collection with:
- `type`: 'new_account_created'
- `userId`: User ID
- `sentTo`: Recipient email
- `sentAt`: Timestamp
- `data`: Additional metadata

## Security Features

### Duplicate Prevention
- Uses `emailSends` collection to prevent duplicate emails
- Document ID: `new_account_{userId}`
- Prevents multiple emails for the same user

### Authentication
- Requires user authentication for manual calls
- Supports test mode for development
- Validates required fields before sending

## User Experience

### Email Flow
1. **User Signs Up**: Creates account via email or Google
2. **Profile Created**: User profile document created in Firestore
3. **Trigger Fired**: Automatic function detects new profile
4. **Email Sent**: Welcome email delivered to user
5. **User Guided**: Email provides clear next steps

### Email Design
- **Mobile Responsive**: Works on all device sizes
- **Brand Consistent**: Matches app design and colors
- **Accessible**: Clear typography and contrast
- **Actionable**: Clear call-to-action buttons

## Monitoring

### Firebase Console
- Monitor function execution in Firebase Console
- View email logs in Firestore
- Check SendGrid delivery status

### Error Handling
- Comprehensive error logging
- Graceful failure handling
- Retry mechanisms for failed sends

## Future Enhancements

### Planned Features
- **A/B Testing**: Test different email templates
- **Localization**: Support for multiple languages
- **Analytics**: Track email open rates and click-through
- **Customization**: Allow users to customize email preferences

### Integration Opportunities
- **Onboarding Flow**: Integrate with app onboarding
- **Partner Invitation**: Link to partner invitation process
- **Feature Discovery**: Highlight key app features
- **Community Building**: Welcome to user community

## Troubleshooting

### Common Issues
1. **Email Not Sent**: Check Firestore trigger logs
2. **Duplicate Emails**: Verify emailSends collection
3. **Template Issues**: Check HTML rendering
4. **Delivery Problems**: Verify SendGrid configuration

### Debug Steps
1. Check Firebase Functions logs
2. Verify emailSends collection
3. Test with manual function call
4. Check SendGrid dashboard

## Support

For issues with the new account notification system:
1. Check Firebase Console logs
2. Verify email configuration
3. Test with EmailTest component
4. Review this documentation

---

**Last Updated**: August 2024
**Version**: 1.0.0
