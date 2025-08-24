import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import {
  User,
  Mail,
  Phone,
  Camera,
  Save,
  X,
  Edit,
  Settings,
  Shield,
  Bell,
  Palette,
  Globe,
  Users
} from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import { db } from '../firebase/config';
// import { useNavigate } from 'react-router-dom';
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
    collection,
    addDoc,
    query,
    where,
    getDocs
} from 'firebase/firestore';

const UserProfile = ({ onBack }) => {
  const { user } = useAuth();
  const { t, setLanguage } = useI18n();
  const { showSuccess, showError } = useNotification();
  // const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEditMode, setShowEditMode] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [couple, setCouple] = useState(null);
  const [partnerInfo, setPartnerInfo] = useState(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removeChoice, setRemoveChoice] = useState('keep');

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobilePhone: '',
    profileImageUrl: ''
  });

  // Settings state
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    darkMode: false,
    language: 'en',
    timezone: 'UTC'
  });

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user?.uid) return;

      try {
        setLoading(true);
        
        // Get user profile from Firestore
        const userDoc = await getDoc(doc(db, 'userProfiles', user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setFormData({
            firstName: userData.firstName || user?.displayName?.split(' ')[0] || '',
            lastName: userData.lastName || user?.displayName?.split(' ').slice(1).join(' ') || '',
            email: userData.email || user?.email || '',
            mobilePhone: userData.mobilePhone || '',
            profileImageUrl: userData.profileImageUrl || user?.photoURL || ''
          });
          setSettings(userData.settings || settings);
          // Load couple info if available
          if (userData.coupleId) {
            try {
              const coupleSnap = await getDoc(doc(db, 'couples', userData.coupleId));
              if (coupleSnap.exists()) {
                const coupleData = coupleSnap.data();
                setCouple({ id: coupleSnap.id, ...coupleData });
                const other = (coupleData.partners || []).find(p => p.uid !== user.uid && !p.isDummy);
                setPartnerInfo(other || null);
              }
            } catch (e) {
              console.error('UserProfile: failed loading couple', e);
            }
          }
        } else {
          // Initialize with Google profile data
          setFormData({
            firstName: user?.displayName?.split(' ')[0] || '',
            lastName: user?.displayName?.split(' ').slice(1).join(' ') || '',
            email: user?.email || '',
            mobilePhone: '',
            profileImageUrl: user?.photoURL || ''
          });
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
        showError('Error Loading Profile', 'Failed to load your profile data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [user, showError]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInvitePartner = async () => {
    console.log('[Invite] Invite button clicked');
    if (!inviteEmail) { console.warn('[Invite] No email entered'); return; }
    try {
      console.log('[Invite] Submitting invite for email:', inviteEmail, 'coupleId:', couple?.id, 'inviterUid:', user?.uid);
      if (!couple?.id) {
        showError('No Couple', 'Your couple account is not set up.');
        return;
      }
      const payload = {
        coupleId: couple.id,
        inviterUid: user.uid,
        inviterName: `${formData.firstName} ${formData.lastName}`.trim() || user.displayName || 'You',
        inviteeEmail: inviteEmail.trim().toLowerCase(),
        status: 'sent',
        createdAt: serverTimestamp()
      };
      console.log('[Invite] Creating invitation document with payload:', payload);
      const created = await addDoc(collection(db, 'coupleInvitations'), payload);
      console.log('[Invite] Invitation document created with id:', created.id);
      console.log('[Invite] Updating couple invite fields');
      await updateDoc(doc(db, 'couples', couple.id), {
        invitationStatus: 'pending',
        invitationEmail: inviteEmail.trim().toLowerCase(),
        updatedAt: serverTimestamp()
      });
      setInviteOpen(false);
      setInviteEmail('');
      showSuccess('Invitation Sent', 'Your partner has been invited.');
      // Refresh couple state
      console.log('[Invite] Refreshing couple state for coupleId:', couple.id);
      const cSnap = await getDoc(doc(db, 'couples', couple.id));
      if (cSnap.exists()) setCouple({ id: cSnap.id, ...cSnap.data() });
    } catch (e) {
      console.error('[Invite] Invite partner failed', { message: e?.message, code: e?.code, stack: e?.stack });
      showError('Invite Failed', 'Could not send the invitation.');
    }
  };

  const handleRemovePartner = async () => {
    try {
      if (!couple?.id) return;
      // Keep existing user, replace other partner with a dummy placeholder
      const updatedPartners = [
        { uid: user.uid, name: formData.firstName || user.displayName || 'You', email: formData.email, role: 'primary' },
        { uid: 'dummy_partner', name: 'Partner', email: 'partner@example.com', role: 'secondary', isDummy: true }
      ];

      await updateDoc(doc(db, 'couples', couple.id), {
        partners: updatedPartners,
        invitationStatus: 'none',
        removedAt: serverTimestamp(),
        removedChoice: removeChoice
      });

      setPartnerInfo(null);
      setCouple(prev => ({ ...prev, partners: updatedPartners, invitationStatus: 'none' }));
      setRemoveOpen(false);
      showSuccess('Partner Removed', 'Your partner has been removed.');
      // Note: data export/delete actions would be handled by backend jobs; not blocking UI here
    } catch (e) {
      console.error('Remove partner failed', e);
      showError('Remove Failed', 'Could not remove partner.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user?.uid) return;

    setSaving(true);
    try {
      // In a real app, you'd upload the image to Firebase Storage first
      // For now, we'll just save the profile data
      const profileData = {
        ...formData,
        settings,
        updatedAt: serverTimestamp()
      };

      // Save to Firestore
      await setDoc(doc(db, 'userProfiles', user.uid), profileData, { merge: true });
      
      setShowEditMode(false);
      showSuccess('Profile Updated', 'Your profile has been updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('Update Failed', 'Failed to update your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLinkedInLogin = undefined;

  const handleSettingsChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));

    // Apply dark mode immediately
    if (key === 'darkMode') {
      const root = document.documentElement;
      if (value) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      // Persist preference
      try {
        localStorage.setItem('app:darkMode', value ? '1' : '0');
      } catch {}
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-2 rounded-lg">
                <User className="w-6 h-6 text-white" />
              </div>
                <h1 className="text-2xl font-bold text-gray-800">{t('userProfile')}</h1>
            </div>
            <div className="flex items-center space-x-3">
              {!showEditMode && (
                <button
                  onClick={() => setShowEditMode(true)}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              )}
              <button
                onClick={onBack}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Back</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">{t('personalInformation')}</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Profile Image */}
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                      {imagePreview || formData.profileImageUrl ? (
                        <img
                          src={imagePreview || formData.profileImageUrl}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-500">
                          <User className="w-12 h-12 text-white" />
                        </div>
                      )}
                    </div>
                    {showEditMode && (
                      <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <Camera className="w-4 h-4 text-gray-600" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {formData.firstName} {formData.lastName}
                    </h3>
                    <p className="text-gray-600">{formData.email}</p>
                    {showEditMode && (
                      <p className="text-sm text-gray-500 mt-1">Click the camera icon to change photo</p>
                    )}
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('firstName')} *
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        !showEditMode ? 'bg-gray-50 cursor-not-allowed' : ''
                      }`}
                      disabled={!showEditMode}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('lastName')} *
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        !showEditMode ? 'bg-gray-50 cursor-not-allowed' : ''
                      }`}
                      disabled={!showEditMode}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('email')} *
                    </label>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          !showEditMode ? 'bg-gray-50 cursor-not-allowed' : ''
                        }`}
                        disabled={!showEditMode}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('mobilePhone')}
                    </label>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.mobilePhone}
                        onChange={(e) => setFormData({ ...formData, mobilePhone: e.target.value })}
                        className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          !showEditMode ? 'bg-gray-50 cursor-not-allowed' : ''
                        }`}
                        disabled={!showEditMode}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {showEditMode && (
                  <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowEditMode(false)}
                      className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>{t('saveChanges')}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </form>
            </div>

            {/* My Partner Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mt-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">My Partner</h2>
              {!partnerInfo ? (
                <div>
                  <p className="text-gray-600 mb-4">You don’t have a linked partner yet.</p>
                  <div className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4">
                    <div className="text-sm text-purple-800">
                      Invite your partner to join your couple account.
                    </div>
                    <button
                      onClick={() => setInviteOpen(true)}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-purple-700"
                    >
                      Invite Your Partner
                    </button>
                  </div>
                  {couple?.invitationStatus === 'pending' && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">Invitation sent to {couple?.invitationEmail || 'partner'} – waiting for acceptance.</p>
                      <button
                        onClick={async () => {
                          try {
                            if (!couple?.id) return;
                            // Mark any pending invites for this couple+email as revoked
                            console.log('[Invite] Revoke requested for coupleId:', couple.id, 'email:', couple?.invitationEmail);
                            const q = query(
                              collection(db, 'coupleInvitations'),
                              where('coupleId', '==', couple.id),
                              where('inviteeEmail', '==', (couple.invitationEmail || '').toLowerCase()),
                              where('status', '==', 'sent')
                            );
                            const snap = await getDocs(q);
                            console.log('[Invite] Found pending invites to revoke:', snap.docs.map(d=>d.id));
                            await Promise.all(snap.docs.map(d => updateDoc(doc(db, 'coupleInvitations', d.id), {
                              status: 'revoked',
                              revokedAt: serverTimestamp(),
                            })));
                            console.log('[Invite] Revoked invites updated');
                            await updateDoc(doc(db, 'couples', couple.id), {
                              invitationStatus: 'none',
                              invitationEmail: '',
                              updatedAt: serverTimestamp()
                            });
                            console.log('[Invite] Couple invite fields cleared');
                            setCouple(prev => prev ? ({ ...prev, invitationStatus: 'none', invitationEmail: '' }) : prev);
                            showSuccess('Invitation Revoked', 'The pending invitation has been revoked.');
                          } catch (e) {
                            console.error('[Invite] Revoke invitation failed', { message: e?.message, code: e?.code, stack: e?.stack });
                            showError('Revoke Failed', 'Could not revoke the invitation.');
                          }
                        }}
                        className="ml-3 px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg font-medium hover:bg-red-50"
                      >
                        Revoke
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-800 font-semibold">{partnerInfo.name || 'Partner'}</p>
                    <p className="text-gray-600 text-sm">{partnerInfo.email}</p>
                    {couple?.createdAt && (
                      <p className="text-gray-500 text-xs mt-1">Linked since {new Date(couple.createdAt.toDate ? couple.createdAt.toDate() : couple.createdAt).toLocaleDateString()}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setRemoveOpen(true)}
                    className="px-4 py-2 text-red-600 border border-red-200 rounded-lg font-medium hover:bg-red-50"
                  >
                    Remove Partner
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Settings Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                <Settings className="w-5 h-5 mr-2 text-gray-600" />
                {t('settings')}
              </h2>

              <div className="space-y-6">
                {/* Notifications */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                    <Bell className="w-4 h-4 mr-2 text-gray-600" />
                    {t('notifications')}
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.emailNotifications}
                        onChange={(e) => handleSettingsChange('emailNotifications', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{t('emailNotifications')}</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.pushNotifications}
                        onChange={(e) => handleSettingsChange('pushNotifications', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{t('pushNotifications')}</span>
                    </label>
                  </div>
                </div>

                {/* Appearance */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                    <Palette className="w-4 h-4 mr-2 text-gray-600" />
                    {t('appearance')}
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.darkMode}
                        onChange={(e) => handleSettingsChange('darkMode', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{t('darkMode')}</span>
                    </label>
                  </div>
                </div>

                {/* Preferences */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                    <Globe className="w-4 h-4 mr-2 text-gray-600" />
                    {t('preferences')}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('language')}
                      </label>
                      <select
                        value={settings.language}
                        onChange={(e) => { handleSettingsChange('language', e.target.value); setLanguage(e.target.value); }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('timezone')}
                      </label>
                      <select
                        value={settings.timezone}
                        onChange={(e) => handleSettingsChange('timezone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Privacy */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                    <Shield className="w-4 h-4 mr-2 text-gray-600" />
                    Privacy
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{t('profileVisibleToPartners')}</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Partner Modal */}
      {inviteOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Invite Your Partner</h3>
                <button onClick={() => setInviteOpen(false)} className="p-2 text-gray-600 hover:text-gray-800"><X className="w-5 h-5"/></button>
              </div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Partner Email</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="partner@example.com"
              />
              <div className="flex items-center justify-end space-x-2 mt-6">
                <button onClick={() => setInviteOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
                <button onClick={handleInvitePartner} className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium">Send Invite</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remove Partner Modal */}
      {removeOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Remove Partner</h3>
                <button onClick={() => setRemoveOpen(false)} className="p-2 text-gray-600 hover:text-gray-800"><X className="w-5 h-5"/></button>
              </div>
              <p className="text-gray-600 mb-4">Choose what to do with shared data:</p>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input type="radio" name="removeChoice" value="keep" checked={removeChoice==='keep'} onChange={(e)=>setRemoveChoice(e.target.value)} />
                  <span>Keep shared data in my account</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input type="radio" name="removeChoice" value="delete" checked={removeChoice==='delete'} onChange={(e)=>setRemoveChoice(e.target.value)} />
                  <span>Delete all shared data</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input type="radio" name="removeChoice" value="export-delete" checked={removeChoice==='export-delete'} onChange={(e)=>setRemoveChoice(e.target.value)} />
                  <span>Export data first, then delete</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input type="radio" name="removeChoice" value="export-keep" checked={removeChoice==='export-keep'} onChange={(e)=>setRemoveChoice(e.target.value)} />
                  <span>Export data and keep</span>
                </label>
              </div>
              <div className="flex items-center justify-end space-x-2 mt-6">
                <button onClick={() => setRemoveOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
                <button onClick={handleRemovePartner} className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium">Confirm Remove</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
