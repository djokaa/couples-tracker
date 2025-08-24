import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { I18nProvider } from './contexts/I18nContext';
import { NotificationProvider } from './contexts/NotificationContext';
import LandingPage from './components/LandingPage';
import MainMenu from './components/MainMenu';
import TopNavigation from './components/TopNavigation';
import RocksManager from './components/RocksManager';
import TodosManager from './components/TodosManager';
import IssuesManager from './components/IssuesManager';
import QualityOfLifeDashboard from './components/QualityOfLifeDashboard';
import WeeklyMeetings from './components/WeeklyMeetings';
import MeetingFlow from './components/MeetingFlow';
import UserProfile from './components/UserProfile';
import RecentActivity from './components/RecentActivity';
import HelpCenter from './components/HelpCenter';
import CoupleProfile from './components/CoupleProfile';
import GlobalSearch from './components/GlobalSearch';
import Notification from './components/Notification';
import EmailTest from './components/EmailTest';
import AcceptInvitation from './components/AcceptInvitation';
import PartnerSignup from './components/PartnerSignup';
import CoupleSettings from './components/CoupleSettings';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

// Public Route Component (redirects to home if already logged in)
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? <Navigate to="/" replace /> : children;
};

const AppContent = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentView, setCurrentView] = useState('home');
  const [viewParams, setViewParams] = useState({});

  // Initialize dark mode from localStorage
  useEffect(() => {
    try {
      const pref = localStorage.getItem('app:darkMode');
      if (pref === '1') {
        document.documentElement.classList.add('dark');
      }
    } catch {}
  }, []);

  useEffect(() => {
    const path = location.pathname;
    if (path === '/' || path === '/home') setCurrentView('home');
    else if (path === '/meetings') setCurrentView('meetings');
    else if (path === '/meeting-flow') setCurrentView('meeting-flow');
    else if (path === '/rocks') setCurrentView('rocks');
    else if (path === '/todos') setCurrentView('todos');
    else if (path === '/issues') setCurrentView('issues');
    else if (path === '/quality-of-life') setCurrentView('quality-of-life');
    else if (path === '/recent-activity') setCurrentView('recent-activity');
    else if (path === '/profile') setCurrentView('profile');
    else if (path === '/help') setCurrentView('help');
    else if (path === '/email-test') setCurrentView('email-test');
    else if (path.startsWith('/accept-invite/')) setCurrentView('accept-invite');
    else if (path === '/signup') setCurrentView('signup');
    else if (path === '/couple-settings') setCurrentView('couple-settings');
  }, [location.pathname]);

  const handleNavigate = (view, params = {}) => {
    setCurrentView(view);
    setViewParams(params);
    
    // Update the URL based on the view
    switch (view) {
      case 'home':
        navigate('/');
        break;
      case 'meetings':
        navigate('/meetings');
        break;
      case 'meeting-flow':
        navigate('/meeting-flow');
        break;
      case 'rocks':
        navigate('/rocks');
        break;
      case 'todos':
        navigate('/todos');
        break;
      case 'issues':
        navigate('/issues');
        break;
      case 'quality-of-life':
        navigate('/quality-of-life');
        break;
      case 'recent-activity':
        navigate('/recent-activity');
        break;
      case 'profile':
        navigate('/profile');
        break;
      case 'email-test':
        navigate('/email-test');
        break;
      case 'accept-invite':
        navigate(`/accept-invite/${location.pathname.split('/').pop()}`);
        break;
      case 'signup':
        navigate('/signup');
        break;
      case 'couple-settings':
        navigate('/couple-settings');
        break;
      default:
        navigate('/');
    }
  };

  const handleLogout = () => {
    logout();
    setCurrentView('home');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'home':
        return <MainMenu onNavigate={handleNavigate} />;
      case 'rocks':
        return <RocksManager onBack={() => handleNavigate('home')} params={viewParams} />;
      case 'todos':
        return <TodosManager onBack={() => handleNavigate('home')} params={viewParams} />;
      case 'issues':
        return <IssuesManager onBack={() => handleNavigate('home')} params={viewParams} />;
      case 'quality-of-life':
        return <QualityOfLifeDashboard onBack={() => handleNavigate('home')} params={viewParams} />;
      case 'meetings':
        return <WeeklyMeetings onNavigate={handleNavigate} />;
      case 'meeting-flow':
        return <MeetingFlow onBack={() => handleNavigate('meetings')} onComplete={() => handleNavigate('meetings')} />;
      case 'profile':
        return <UserProfile onBack={() => handleNavigate('home')} />;
      case 'couple':
        return <CoupleProfile onBack={() => handleNavigate('home')} />;
      case 'recent-activity':
        return <RecentActivity onBack={() => handleNavigate('home')} />;
      case 'help':
        return <HelpCenter onBack={() => handleNavigate('home')} />;
      case 'email-test':
        return <EmailTest />;
      case 'accept-invite':
        return <AcceptInvitation />;
      case 'signup':
        return <PartnerSignup />;
      case 'couple-settings':
        return <CoupleSettings />;
      default:
        return <MainMenu onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100">
      <TopNavigation 
        currentView={currentView}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />
      {renderCurrentView()}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <I18nProvider>
        <NotificationProvider>
          <Router>
          <div className="App">
            <Routes>
              <Route 
                path="/login" 
                element={
                  <PublicRoute>
                    <LandingPage />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <AppContent />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/meetings" 
                element={
                  <ProtectedRoute>
                    <AppContent />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/meeting-flow" 
                element={
                  <ProtectedRoute>
                    <AppContent />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/rocks" 
                element={
                  <ProtectedRoute>
                    <AppContent />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/todos" 
                element={
                  <ProtectedRoute>
                    <AppContent />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/issues" 
                element={
                  <ProtectedRoute>
                    <AppContent />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/quality-of-life" 
                element={
                  <ProtectedRoute>
                    <AppContent />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/recent-activity" 
                element={
                  <ProtectedRoute>
                    <AppContent />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <AppContent />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile/couple" 
                element={
                  <ProtectedRoute>
                    <AppContent />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/help" 
                element={
                  <ProtectedRoute>
                    <AppContent />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/email-test" 
                element={
                  <ProtectedRoute>
                    <AppContent />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/accept-invite/:inviteId" 
                element={<AcceptInvitation />} 
              />
              <Route 
                path="/signup" 
                element={<PartnerSignup />} 
              />
              <Route 
                path="/couple-settings" 
                element={
                  <ProtectedRoute>
                    <AppContent />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="*" 
                element={<Navigate to="/" replace />} 
              />
            </Routes>
          </div>
        </Router>
      </NotificationProvider>
      </I18nProvider>
    </AuthProvider>
  );
}

export default App;
