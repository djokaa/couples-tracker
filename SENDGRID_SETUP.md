# 🚀 SendGrid SMTP Setup Guide

## 📧 **Setting up SendGrid for Email Notifications**

This guide will help you configure SendGrid SMTP for your Firebase email extension.

## 🎯 **Step 1: Sign up for SendGrid**

1. **Go to SendGrid**: https://signup.sendgrid.com/
2. **Create a free account** (100 emails/day free tier)
3. **Verify your email address**
4. **Complete account setup**

## 🔑 **Step 2: Get SendGrid API Key**

1. **Log into SendGrid Dashboard**
2. **Go to Settings → API Keys**
3. **Click "Create API Key"**
4. **Choose "Full Access" or "Restricted Access" (Mail Send)**
5. **Copy the API Key** (you'll only see it once!)

## ⚙️ **Step 3: Configure Firebase Extension**

Since the extension is already installed, we need to update its configuration through the Firebase Console:

### **Option A: Firebase Console (Recommended)**

1. **Go to Firebase Console**: https://console.firebase.google.com/project/relationship-l10/overview
2. **Click on "Extensions" in the left sidebar**
3. **Find "firestore-send-email" extension**
4. **Click on the extension to view details**
5. **Click "Reconfigure" or "Update configuration"**

### **Configuration Parameters for SendGrid:**

```
Authentication Type: Username & Password
SMTP connection URI: smtp://smtp.sendgrid.net:587
SMTP password: [Your SendGrid API Key]
Default FROM address: noreply@coupletracker.app
Default REPLY-TO address: support@coupletracker.app
Email documents collection: mail
```

### **Option B: Command Line (Alternative)**

If the console method doesn't work, we can try reinstalling the extension:

```bash
# Remove the current extension
firebase ext:uninstall firestore-send-email

# Reinstall with SendGrid configuration
firebase ext:install firebase/firestore-send-email
```

## 🔧 **Step 4: SendGrid Configuration Details**

### **SMTP Settings:**
- **Host**: `smtp.sendgrid.net`
- **Port**: `587` (STARTTLS) or `465` (SMTPS)
- **Username**: `apikey`
- **Password**: Your SendGrid API Key
- **Security**: STARTTLS or SSL/TLS

### **Connection String Format:**
```
smtp://smtp.sendgrid.net:587
```

## 📊 **Step 5: Verify Configuration**

After updating the configuration:

1. **Deploy the updated extension**:
   ```bash
   firebase deploy --only extensions
   ```

2. **Test the email system**:
   - Go to: http://localhost:3000/email-test
   - Enter your email address
   - Send a test email

3. **Check Firebase Functions logs**:
   ```bash
   firebase functions:log
   ```

## 🧪 **Step 6: Test All Email Types**

Once SendGrid is configured, test all email types:

### **1. Meeting Reminder Test**
- Subject: "Meeting Reminder: Weekly Check-in Meeting"
- Content: Professional design with agenda items

### **2. Todo Notification Test**
- Subject: "New Todo: Book Anniversary Dinner"
- Content: Clean design with priority levels

### **3. General Notification Test**
- Subject: "App Update Available"
- Content: Flexible design with custom styling

### **4. Integration Test**
- Create a todo assigned to a partner
- Should automatically send email notification

## 🔍 **Troubleshooting**

### **Common Issues:**

1. **Authentication Error (401)**
   - Verify SendGrid API Key is correct
   - Ensure API Key has "Mail Send" permissions
   - Check SMTP connection string format

2. **Connection Timeout**
   - Verify SendGrid SMTP settings
   - Check firewall/network restrictions
   - Try different ports (587 vs 465)

3. **Emails Not Delivered**
   - Check SendGrid Activity logs
   - Verify sender email is authenticated
   - Check spam/junk folders

### **SendGrid Dashboard Checks:**

1. **Activity Log**: Check if emails are being sent
2. **API Keys**: Verify API key is active
3. **Sender Authentication**: Verify sender domain
4. **Bounce Management**: Check for bounces

## 📈 **SendGrid Features You Can Use**

### **1. Email Categories**
Add categories to your emails for better tracking:

```javascript
{
  "to": ["user@example.com"],
  "categories": ["meeting_reminder"],
  "message": {
    "subject": "Meeting Reminder",
    "html": "..."
  }
}
```

### **2. Dynamic Templates**
Use SendGrid Dynamic Templates for advanced email designs:

```javascript
{
  "to": ["user@example.com"],
  "sendGrid": {
    "templateId": "d-your-template-id",
    "dynamicTemplateData": {
      "meetingTitle": "Weekly Check-in",
      "meetingTime": "10:00 AM",
      "agendaItems": ["Goal Review", "Planning"]
    }
  }
}
```

### **3. Email Analytics**
Monitor email performance in SendGrid dashboard:
- Delivery rates
- Open rates
- Click rates
- Bounce rates

## 🎯 **Expected Results**

After successful SendGrid configuration:

✅ **Emails delivered to inbox** (not spam)  
✅ **Beautiful, professional email design**  
✅ **Mobile-responsive layout**  
✅ **Working links and buttons**  
✅ **Proper branding and styling**  
✅ **Email analytics in SendGrid dashboard**  

## 📞 **Support Resources**

### **SendGrid Support:**
- SendGrid Documentation: https://docs.sendgrid.com/
- SendGrid Support: https://support.sendgrid.com/

### **Firebase Support:**
- Firebase Console: https://console.firebase.google.com/project/relationship-l10/overview
- Firebase Functions Logs: `firebase functions:log`

### **Testing:**
- Email Test Page: http://localhost:3000/email-test
- Email Settings Page: http://localhost:3000/email-settings

## 🎉 **Next Steps**

1. **Complete SendGrid setup** following this guide
2. **Test all email types** using the test page
3. **Monitor email delivery** in SendGrid dashboard
4. **Configure email analytics** for better insights
5. **Set up email templates** for consistent branding

---

**Status**: 🟡 **READY FOR SENDGRID CONFIGURATION**  
**Last Updated**: January 2024  
**Version**: 1.0.0

