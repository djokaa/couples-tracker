import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Heart, Lock, Mail, User, CheckCircle, AlertCircle } from 'lucide-react';

const PartnerSignup = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signUpWithEmail, signInWithEmail } = useAuth();
  const { showSuccess, showError } = useNotification();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [existingAccount, setExistingAccount] = useState(false);
  const [invitationData, setInvitationData] = useState(null);

  useEffect(() => {
    // Get invitation data from navigation state
    if (location.state?.invitedEmail) {
      setInvitationData({
        invitedEmail: location.state.invitedEmail,
        inviteId: location.state.inviteId,
        coupleId: location.state.coupleId
      });
    } else {
      // If no invitation data, redirect to home
      navigate('/');
    }
  }, [location.state, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const checkExistingAccount = async () => {
    if (!invitationData?.invitedEmail) return;

    try {
      // Check if there's already a user profile with this email
      const usersRef = db.collection('userProfiles');
      const query = await usersRef.where('email', '==', invitationData.invitedEmail).get();
      
      if (!query.empty) {
        setExistingAccount(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking existing account:', error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!invitationData) {
      showError('Error', 'No invitation data found');
      return;
    }

    // Validate form
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      showError('Validation Error', 'Please enter your first and last name');
      return;
    }

    if (formData.password.length < 6) {
      showError('Validation Error', 'Password must be at least 6 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showError('Validation Error', 'Passwords do not match');
      return;
    }

    try {
      setLoading(true);

      // Check if account already exists
      const hasExistingAccount = await checkExistingAccount();
      
      if (hasExistingAccount) {
        showError('Account Exists', 'An account with this email already exists. Please log in with your existing account.');
        return;
      }

      // Create the account
      const userCredential = await signUpWithEmail(
        invitationData.invitedEmail,
        formData.password
      );

      const user = userCredential.user;

      // Create user profile
      const userProfile = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: invitationData.invitedEmail,
        profileImageUrl: '',
        coupleId: invitationData.coupleId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'userProfiles', user.uid), userProfile);

      // Update the couple to add the partner
      await linkPartnerToCouple(user.uid, invitationData.coupleId, userProfile);

      // Update invitation status to completed
      if (invitationData.inviteId) {
        await updateDoc(doc(db, 'coupleInvitations', invitationData.inviteId), {
          status: 'completed',
          completedAt: serverTimestamp(),
          partnerUid: user.uid
        });
      }

      showSuccess('Welcome!', 'Your account has been created and you\'re now connected with your partner!');
      
      // Redirect to the main app
      navigate('/');

    } catch (error) {
      console.error('Error creating partner account:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        showError('Account Exists', 'An account with this email already exists. Please log in with your existing account.');
      } else {
        showError('Error', 'Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const linkPartnerToCouple = async (partnerUid, coupleId, userProfile) => {
    try {
      const coupleRef = doc(db, 'couples', coupleId);
      const coupleDoc = await getDoc(coupleRef);
      
      if (coupleDoc.exists()) {
        const coupleData = coupleDoc.data();
        const partners = coupleData.partners || [];
        
        // Find and update the dummy partner slot
        const updatedPartners = partners.map(partner => {
          if (partner.isDummy) {
            return {
              uid: partnerUid,
              name: `${userProfile.firstName} ${userProfile.lastName}`.trim(),
              email: userProfile.email,
              status: 'active',
              joinedAt: serverTimestamp()
            };
          }
          return partner;
        });

        // Update couple document
        await updateDoc(coupleRef, {
          partners: updatedPartners,
          invitationStatus: 'completed',
          updatedAt: serverTimestamp()
        });

        // Send notification to the original partner
        await sendPartnerJoinedNotification(coupleData.ownerId, userProfile);
      }
    } catch (error) {
      console.error('Error linking partner to couple:', error);
      throw error;
    }
  };

  const sendPartnerJoinedNotification = async (ownerId, userProfile) => {
    try {
      // The email notification will be automatically sent by the Firestore trigger
      // when we update the invitation status to 'completed'
      console.log('Partner joined, email notification will be sent automatically');
    } catch (error) {
      console.error('Error sending partner joined notification:', error);
    }
  };

  if (!invitationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center">
        <div className="text-center text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Your Account</h1>
          <p className="text-gray-600">Join your partner on Couples Tracker</p>
        </div>

        {/* Email Display */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex items-center space-x-3">
            <Mail className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Email Address</p>
              <p className="font-semibold text-gray-900">{invitationData.invitedEmail}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="First name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Last name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <div className="relative">
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                minLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 pr-10"
                placeholder="Create a password"
              />
              <Lock className="w-5 h-5 text-gray-400 absolute right-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password *
            </label>
            <div className="relative">
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 pr-10"
                placeholder="Confirm your password"
              />
              {formData.confirmPassword && (
                formData.password === formData.confirmPassword ? (
                  <CheckCircle className="w-5 h-5 text-green-500 absolute right-3 top-2.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500 absolute right-3 top-2.5" />
                )
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 px-4 rounded-xl font-semibold hover:from-pink-600 hover:to-rose-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all duration-200"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <User className="w-5 h-5" />
                <span>Create Account & Join Partner</span>
              </>
            )}
          </button>
        </form>

        {/* Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By creating an account, you agree to share your relationship journey with your partner
          </p>
        </div>
      </div>
    </div>
  );
};

export default PartnerSignup;
