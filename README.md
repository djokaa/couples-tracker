# Couples Meeting Tracker

A beautiful React web app for couples to track their meetings and special moments together. Built with Firebase authentication and a modern, mobile-friendly design.

## Features

- 🔐 Google Sign-in authentication
- 📱 Mobile-friendly responsive design
- 🎨 Clean, modern UI with warm colors
- 📊 Dashboard with user profile
- ⏱️ Start Meeting functionality (placeholder)
- 🔒 Protected routes

## Tech Stack

- **Frontend**: React 18, React Router
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Auth
- **Database**: Firestore (ready for future use)
- **Icons**: Lucide React

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Setup

#### Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "couples-meeting-tracker")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

#### Step 2: Enable Authentication

1. In your Firebase project, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Click on "Google" provider
5. Enable it and add your authorized domain (localhost for development)
6. Click "Save"

#### Step 3: Create a Web App

1. In your Firebase project, click the gear icon next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon (</>) to add a web app
5. Enter an app nickname (e.g., "Couples Tracker Web")
6. Click "Register app"
7. Copy the Firebase configuration object

#### Step 4: Update Firebase Config

1. Open `src/firebase/config.js`
2. Replace the placeholder values with your actual Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};
```

### 3. Run the Application

```bash
npm start
```

The app will open at `http://localhost:3000`

## Project Structure

```
src/
├── components/
│   ├── LandingPage.js    # Landing page with Google sign-in
│   └── Dashboard.js      # Main dashboard after login
├── contexts/
│   └── AuthContext.js    # Authentication context
├── firebase/
│   └── config.js         # Firebase configuration
├── App.js               # Main app component with routing
├── App.css              # Global styles
├── index.js             # App entry point
└── index.css            # Base styles
```

## Features Overview

### Landing Page
- Beautiful gradient background
- Google Sign-in button
- Feature highlights
- Mobile-responsive design

### Dashboard
- User profile display
- Welcome message with user's name
- Start Meeting button (placeholder)
- Statistics cards (placeholder)
- Sign out functionality

### Authentication
- Google Sign-in integration
- Protected routes
- Automatic redirects
- User state management

## Future Enhancements

- Meeting timer functionality
- Meeting history tracking
- Notes and memories for each meeting
- Calendar integration
- Push notifications
- Meeting statistics and insights

## Development

### Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Runs the test suite
- `npm eject` - Ejects from Create React App (not recommended)

### Environment Variables

For production, you may want to move Firebase config to environment variables:

1. Create a `.env` file in the root directory
2. Add your Firebase config:

```
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

3. Update `src/firebase/config.js` to use environment variables

## Troubleshooting

### Common Issues

1. **Firebase config errors**: Make sure you've replaced all placeholder values in `src/firebase/config.js`

2. **Authentication not working**: 
   - Verify Google provider is enabled in Firebase Console
   - Check that your domain is authorized in Firebase Console

3. **Styling issues**: Make sure Tailwind CSS is properly installed and configured

4. **Build errors**: Try clearing node_modules and reinstalling:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

## License

MIT License - feel free to use this project for your own purposes!
