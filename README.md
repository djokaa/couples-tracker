# Couples Tracker App

A comprehensive relationship management application built with React, Firebase, and modern web technologies. This app helps couples stay connected, organized, and focused on their relationship goals.

**🚀 Live App: https://couples-tracker.vercel.app**

## 🌟 Features

### Core Relationship Management
- **Partner Invitation System** - Invite your partner to join your relationship workspace
- **Shared Dashboard** - Real-time shared dashboard for both partners
- **Couple Profile Management** - Manage your couple's information and settings

### Task & Goal Management
- **Rocks Manager** - Track and manage important relationship goals (Rocks)
- **Todos Manager** - Shared todo lists and task management
- **Issues Manager** - Track and resolve relationship issues together

### Meeting & Communication
- **Weekly Meetings** - Schedule and manage regular relationship check-ins
- **Meeting Flow** - Structured meeting process with agenda and timer
- **Meeting Agenda** - Collaborative agenda creation and management

### Quality of Life Tracking
- **Quality of Life Dashboard** - Track and visualize relationship satisfaction metrics
- **Recent Activity** - Monitor shared activities and progress

### Communication & Notifications
- **Email Notifications** - Automated email system for invitations, reminders, and updates
- **In-App Notifications** - Real-time notifications for important events
- **Partner Communication** - Direct messaging and notification system

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase account
- SendGrid account (for email functionality)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/djokaa/couples-tracker.git
   cd couples-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd functions
   npm install
   cd ..
   ```

3. **Firebase Setup**
   - Create a new Firebase project
   - Enable Authentication, Firestore, and Functions
   - Configure SendGrid extension for email functionality
   - Update Firebase configuration in `src/firebase/config.js`

4. **Environment Configuration**
   - Set up Firebase Functions configuration:
     ```bash
     firebase functions:config:set app.url="https://your-app-domain.com"
     firebase functions:config:set app.accept_url="https://your-app-domain.com/accept-invite"
     ```

5. **Deploy Firebase Functions**
   ```bash
   firebase deploy --only functions
   ```

6. **Start the development server**
   ```bash
   npm start
   ```

## 📱 Usage

### For New Users
1. Sign up with email or Google account
2. Complete your profile setup
3. Invite your partner using their email address
4. Your partner will receive an invitation email
5. Partner accepts invitation and creates their account
6. Both partners are now connected and can share data

### For Partners
1. Click the invitation link in your email
2. Review the invitation details
3. Accept or decline the invitation
4. If accepting, create your account with the invited email
5. Start using the shared features together

## 🏗️ Architecture

### Frontend
- **React 18** - Modern React with hooks and functional components
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icons
- **Firebase SDK** - Real-time database and authentication

### Backend
- **Firebase Functions** - Serverless backend functions
- **Firestore** - NoSQL database for real-time data
- **Firebase Authentication** - User authentication and management
- **SendGrid** - Email delivery service

### Key Components
- **AuthContext** - Authentication state management
- **NotificationContext** - In-app notification system
- **EmailService** - Email functionality integration
- **Partner Invitation System** - Complete invitation workflow

## 📧 Email System

The app includes a comprehensive email notification system:

- **Welcome Emails** - Sent to new users upon signup
- **Partner Invitations** - Email invitations with secure links
- **Invitation Status Updates** - Notifications for acceptance/decline
- **Meeting Reminders** - Automated meeting notifications
- **Todo Notifications** - Task assignment and updates
- **General Notifications** - Custom notification system

## 🔧 Configuration

### Firebase Functions Configuration
```bash
# Set app URLs
firebase functions:config:set app.url="https://your-app-domain.com"
firebase functions:config:set app.accept_url="https://your-app-domain.com/accept-invite"

# Set email configuration
firebase functions:config:set mail.from="your-email@domain.com"
firebase functions:config:set mail.reply_to="your-email@domain.com"
```

### SendGrid Setup
1. Install SendGrid extension in Firebase
2. Configure SendGrid API key
3. Set up email templates and sending rules

## 🚀 Deployment

### Firebase Hosting
```bash
npm run build
firebase deploy --only hosting
```

### Firebase Functions
```bash
firebase deploy --only functions
```

## 📁 Project Structure

```
couples-tracker/
├── src/
│   ├── components/          # React components
│   ├── contexts/           # React contexts
│   ├── services/           # Service layer
│   ├── firebase/           # Firebase configuration
│   └── App.js              # Main application
├── functions/              # Firebase Functions
├── public/                 # Static assets
└── README.md              # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation in the `/docs` folder
- Review the Firebase console for function logs
- Check the browser console for frontend errors

## 🔮 Future Features

- Mobile app development
- Advanced analytics and insights
- Integration with calendar systems
- Voice and video communication
- Relationship coaching features
- Advanced privacy controls
