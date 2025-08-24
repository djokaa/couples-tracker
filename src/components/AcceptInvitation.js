import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { db } from '../firebase/config';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Heart, CheckCircle, XCircle, Mail, User, ArrowRight } from 'lucide-react';

const AcceptInvitation = () => {
  const { inviteId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [couple, setCouple] = useState(null);

  useEffect(() => {
    const loadInvitation = async () => {
      if (!inviteId) {
        showError('Invalid Invitation', 'No invitation ID provided');
        navigate('/');
        return;
      }

      try {
        setLoading(true);
        
        // Get invitation details
        const inviteDoc = await getDoc(doc(db, 'coupleInvitations', inviteId));
        
        if (!inviteDoc.exists()) {
          showError('Invalid Invitation', 'This invitation does not exist or has expired');
          navigate('/');
          return;
        }

        const inviteData = inviteDoc.data();
        
        // Check if invitation is still valid
        if (inviteData.status !== 'sent') {
          showError('Invalid Invitation', 'This invitation has already been processed');
          navigate('/');
          return;
        }

        setInvitation({ id: inviteDoc.id, ...inviteData });

        // Get couple details
        if (inviteData.coupleId) {
          const coupleDoc = await getDoc(doc(db, 'couples', inviteData.coupleId));
          if (coupleDoc.exists()) {
            setCouple({ id: coupleDoc.id, ...coupleDoc.data() });
          }
        }

      } catch (error) {
        console.error('Error loading invitation:', error);
        showError('Error', 'Failed to load invitation details');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    loadInvitation();
  }, [inviteId, navigate, showError]);

  const handleAccept = async () => {
    try {
      setProcessing(true);
      
      // Update invitation status
      await updateDoc(doc(db, 'coupleInvitations', inviteId), {
        status: 'accepted',
        acceptedAt: serverTimestamp()
      });

      // Send email notification to inviter
      await sendAcceptanceNotification();

      showSuccess('Invitation Accepted', 'Welcome to your couple account!');
      
      // Redirect to signup/login flow
      navigate('/signup', { 
        state: { 
          invitedEmail: invitation.inviteeEmail,
          inviteId: inviteId,
          coupleId: invitation.coupleId
        }
      });

    } catch (error) {
      console.error('Error accepting invitation:', error);
      showError('Error', 'Failed to accept invitation');
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    try {
      setProcessing(true);
      
      // Update invitation status
      await updateDoc(doc(db, 'coupleInvitations', inviteId), {
        status: 'declined',
        declinedAt: serverTimestamp()
      });

      // Send email notification to inviter
      await sendDeclineNotification();

      showSuccess('Invitation Declined', 'The invitation has been declined');
      
      // Redirect to home
      navigate('/');

    } catch (error) {
      console.error('Error declining invitation:', error);
      showError('Error', 'Failed to decline invitation');
    } finally {
      setProcessing(false);
    }
  };

  const sendAcceptanceNotification = async () => {
    try {
      // The email notification will be automatically sent by the Firestore trigger
      // when we update the invitation status to 'accepted'
      console.log('Invitation accepted, email notification will be sent automatically');
    } catch (error) {
      console.error('Error sending acceptance notification:', error);
    }
  };

  const sendDeclineNotification = async () => {
    try {
      // The email notification will be automatically sent by the Firestore trigger
      // when we update the invitation status to 'declined'
      console.log('Invitation declined, email notification will be sent automatically');
    } catch (error) {
      console.error('Error sending decline notification:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center">
        <div className="text-center text-gray-600">Invalid invitation</div>
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">You've Been Invited!</h1>
          <p className="text-gray-600">Join your partner on Couples Tracker</p>
        </div>

        {/* Invitation Details */}
        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <User className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Invited by</p>
              <p className="font-semibold text-gray-900">{invitation.inviterName}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 mb-4">
            <Mail className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">To join as</p>
              <p className="font-semibold text-gray-900">{invitation.inviteeEmail}</p>
            </div>
          </div>

          {couple && (
            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-500 mb-1">Couple Name</p>
              <p className="font-semibold text-gray-900">{couple.coupleName}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleAccept}
            disabled={processing}
            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 px-4 rounded-xl font-semibold hover:from-pink-600 hover:to-rose-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all duration-200"
          >
            {processing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Accept Invitation</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <button
            onClick={handleDecline}
            disabled={processing}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all duration-200"
          >
            <XCircle className="w-5 h-5" />
            <span>Decline Invitation</span>
          </button>
        </div>

        {/* Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By accepting, you'll be able to share your relationship journey together
          </p>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitation;
