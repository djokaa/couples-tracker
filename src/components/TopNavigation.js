import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Heart,
  LogOut,
  Target,
  CheckSquare,
  AlertTriangle,
  Calendar,
  Users,
  TrendingUp,
  ChevronDown,
  Menu,
  X,
  Settings,
  User,
  Search,
  Mail
} from 'lucide-react';
import GlobalSearch from './GlobalSearch';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const TopNavigation = ({ currentView, onNavigate, onLogout }) => {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [imageOk, setImageOk] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadProfileImage = async () => {
      try {
        if (!user?.uid) {
          setProfileImageUrl(null);
          return;
        }
        const profileRef = doc(db, 'userProfiles', user.uid);
        const snap = await getDoc(profileRef);
        if (isMounted) {
          const savedUrl = snap.exists() ? (snap.data().profileImageUrl || null) : null;
          setProfileImageUrl(savedUrl || user.photoURL || null);
          setImageOk(true);
        }
      } catch {
        if (isMounted) {
          setProfileImageUrl(user?.photoURL || null);
          setImageOk(true);
        }
      }
    };
    loadProfileImage();
    return () => { isMounted = false; };
  }, [user?.uid, user?.photoURL]);

  const menuItems = [
    {
      id: 'quality-of-life',
      title: 'Quality of Life',
      icon: TrendingUp,
      color: 'text-purple-600'
    },
    {
      id: 'rocks',
      title: 'Annual Rocks',
      icon: Target,
      color: 'text-blue-600'
    },
    {
      id: 'todos',
      title: 'To-Dos',
      icon: CheckSquare,
      color: 'text-green-600'
    },
    {
      id: 'issues',
      title: 'Issues (IDS)',
      icon: AlertTriangle,
      color: 'text-orange-600'
    },
    {
      id: 'meetings',
      title: 'Weekly Meetings',
      icon: Calendar,
      color: 'text-pink-600'
    }
  ];

  const currentMenuItem = menuItems.find(item => item.id === currentView);

  const handleNavigate = (view) => {
    onNavigate(view);
    setIsMenuOpen(false);
  };

  return (
    <>
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left Section - Logo */}
            <div className="flex items-center">
              <button
                onClick={() => onNavigate('home')}
                className="flex items-center space-x-3 hover:opacity-80 transition-opacity group"
              >
                <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-2.5 rounded-xl group-hover:shadow-lg transition-all duration-200">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <div className="hidden sm:block">
                  <span className="text-lg font-bold text-gray-800">Couples Tracker</span>
                </div>
              </button>
            </div>

            {/* Center Section - Menu (Desktop Only) */}
            <div className="hidden md:flex items-center justify-center flex-1 mx-8">
              <div className="relative group">
                <button className="flex items-center space-x-2 px-4 py-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 rounded-xl font-medium">
                  <span>Menu</span>
                  <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
                </button>

                <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  {menuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                        currentView === item.id ? 'bg-pink-50 text-pink-700' : 'text-gray-700'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                      <span className="font-medium">{item.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Section - Navigation & User */}
            <div className="flex items-center space-x-3">
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-3">
                {/* Full Search Bar (Desktop) */}
                <div className="hidden lg:flex items-center max-w-md">
                  <button
                    onClick={() => setShowSearch(true)}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 group"
                  >
                    <div className="flex items-center space-x-3">
                      <Search className="w-4 h-4" />
                      <span className="text-sm">Search across all content...</span>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
                      <span>⌘</span>
                      <span>K</span>
                    </div>
                  </button>
                </div>

                {/* Compact Search Button (Tablet) */}
                <button
                  onClick={() => setShowSearch(true)}
                  className="lg:hidden p-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-xl transition-all duration-200"
                >
                  <Search className="w-5 h-5" />
                </button>

                {/* User Dropdown */}
                <div className="relative group">
                  <button className="flex items-center space-x-3 px-4 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-all duration-200 rounded-xl">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center">
                      {imageOk && (profileImageUrl || user?.photoURL) ? (
                        <img
                          src={profileImageUrl || user.photoURL}
                          alt="Profile"
                          className="w-8 h-8 object-cover"
                          referrerPolicy="no-referrer"
                          onError={() => setImageOk(false)}
                        />
                      ) : (
                        <User className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-medium text-gray-800">
                        {user?.displayName?.split(' ')[0] || 'Partner'}
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
                  </button>

                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    {/* Profile Section */}
                    <div className="px-4 py-2 border-b border-gray-100">
                      <button
                        onClick={() => handleNavigate('profile')}
                        className="w-full flex items-center space-x-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <User className="w-4 h-4" />
                        <span className="text-sm font-medium">Profile</span>
                      </button>
                    </div>

                    {/* Options Section */}
                    <div className="px-4 py-2 border-b border-gray-100">
                      <button
                        onClick={() => {
                          // TODO: Implement options/settings page
                        }}
                        className="w-full flex items-center space-x-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        <span className="text-sm font-medium">Options</span>
                      </button>
                      <button
                        onClick={() => handleNavigate('email-test')}
                        className="w-full flex items-center space-x-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        <span className="text-sm font-medium">Email Test</span>
                      </button>
                      <button
                        onClick={() => handleNavigate('couple-settings')}
                        className="w-full flex items-center space-x-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <Users className="w-4 h-4" />
                        <span className="text-sm font-medium">Couple Settings</span>
                      </button>
                    </div>

                    {/* Sign Out Section */}
                    <div className="px-4 py-2">
                      <button
                        onClick={() => {
                          onLogout();
                        }}
                        className="w-full flex items-center space-x-3 px-3 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm font-medium">Sign Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Menu Button */}
              <div className="md:hidden flex items-center space-x-2">
                {/* Mobile Search Button */}
                <button
                  onClick={() => setShowSearch(true)}
                  className="p-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-xl transition-all duration-200"
                >
                  <Search className="w-5 h-5" />
                </button>
                
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-xl transition-all duration-200"
                >
                  {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-gray-200">
              <div className="pt-4 space-y-2">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-xl transition-all duration-200 ${
                      currentView === item.id
                        ? 'bg-pink-50 text-pink-700 border border-pink-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                    <span className="font-medium">{item.title}</span>
                  </button>
                ))}
                <div className="pt-4 border-t border-gray-200">
                  <div className="space-y-2">
                    <button
                      onClick={() => handleNavigate('profile')}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-200"
                    >
                      <User className="w-4 h-4" />
                      <span className="text-sm font-medium">Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        // TODO: Implement options/settings page
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-200"
                    >
                      <Settings className="w-4 h-4" />
                      <span className="text-sm font-medium">Options</span>
                    </button>
                    <button
                      onClick={() => {
                        handleNavigate('email-test');
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-200"
                    >
                      <Mail className="w-4 h-4" />
                      <span className="text-sm font-medium">Email Test</span>
                    </button>
                    <button
                      onClick={() => {
                        handleNavigate('couple-settings');
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-200"
                    >
                      <Users className="w-4 h-4" />
                      <span className="text-sm font-medium">Couple Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        onLogout();
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm font-medium">Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Breadcrumb Bar */}
        {currentView !== 'home' && currentMenuItem && (
          <div className="border-t border-gray-100 bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-3">
              <div className="flex items-center space-x-2 text-sm">
                <button
                  onClick={() => onNavigate('home')}
                  className="text-gray-500 hover:text-gray-700 transition-colors font-medium"
                >
                  Home
                </button>
                <span className="text-gray-400">/</span>
                <span className="text-gray-700 font-medium">{currentMenuItem.title}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Global Search Modal */}
      {showSearch && (
        <GlobalSearch
          onNavigate={onNavigate}
          onClose={() => setShowSearch(false)}
        />
      )}
    </>
  );
};

export default TopNavigation;
