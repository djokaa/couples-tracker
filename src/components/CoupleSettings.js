import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { db } from '../firebase/config';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Users, UserX, AlertTriangle, Settings, Heart, Shield } from 'lucide-react';

const CoupleSettings = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showConfirm } = useNotification();
  
  const [couple, setCouple] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    loadCoupleData();
  }, [user]);

  const loadCoupleData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get user profile
      const userDoc = await getDoc(doc(db, 'userProfiles', user.uid));
      if (userDoc.exists()) {
        const profile = userDoc.data();
        setUserProfile(profile);
        
        // Get couple data
        if (profile.coupleId) {
          const coupleDoc = await getDoc(doc(db, 'couples', profile.coupleId));
          if (coupleDoc.exists()) {
            setCouple({ id: coupleDoc.id, ...coupleDoc.data() });
          }
        }
      }
    } catch (error) {
      console.error('Error loading couple data:', error);
      showError('Error', 'Failed to load couple settings');
    } finally {
      setLoading(false);
    }
  };

  const isOwner = () => {
    return couple?.ownerId === user?.uid;
  };

  const getPartner = () => {
    if (!couple?.partners) return null;
    return couple.partners.find(partner => partner.uid !== user?.uid);
  };

  const handleRevokePartner = async () => {
    const partner = getPartner();
    if (!partner) return;

    const confirmed = await showConfirm(
      'Revoke Partner Access',
      `Are you sure you want to revoke ${partner.name}'s access to your couple account? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setProcessing(true);

      // Update couple to remove partner
      const updatedPartners = couple.partners.filter(p => p.uid !== partner.uid);
      
      await updateDoc(doc(db, 'couples', couple.id), {
        partners: updatedPartners,
        invitationStatus: 'open',
        updatedAt: serverTimestamp()
      });

      // Update partner's user profile to remove coupleId
      await updateDoc(doc(db, 'userProfiles', partner.uid), {
        coupleId: null,
        updatedAt: serverTimestamp()
      });

      // Send email notification to partner
      await sendPartnerRevokedEmail(partner);

      showSuccess('Partner Access Revoked', `${partner.name} has been removed from your couple account`);
      
      // Reload couple data
      await loadCoupleData();

    } catch (error) {
      console.error('Error revoking partner access:', error);
      showError('Error', 'Failed to revoke partner access');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteCouple = async () => {
    const confirmed = await showConfirm(
      'Delete Couple Account',
      'Are you sure you want to delete your couple account? This will permanently delete all couple data including meetings, todos, and rocks. This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      setProcessing(true);

      const partner = getPartner();

      // If there's a partner, transfer ownership to them
      if (partner) {
        await updateDoc(doc(db, 'couples', couple.id), {
          ownerId: partner.uid,
          updatedAt: serverTimestamp()
        });

        showSuccess('Couple Account Transferred', `Your couple account has been transferred to ${partner.name}`);
      } else {
        // No partner, delete the couple account
        await deleteCoupleAccount();
        showSuccess('Couple Account Deleted', 'Your couple account has been permanently deleted');
      }

      // Reload couple data
      await loadCoupleData();

    } catch (error) {
      console.error('Error deleting couple account:', error);
      showError('Error', 'Failed to delete couple account');
    } finally {
      setProcessing(false);
    }
  };

  const deleteCoupleAccount = async () => {
    // Delete couple document
    await deleteDoc(doc(db, 'couples', couple.id));
    
    // Update user profile to remove coupleId
    await updateDoc(doc(db, 'userProfiles', user.uid), {
      coupleId: null,
      updatedAt: serverTimestamp()
    });
  };

  const sendPartnerRevokedEmail = async (partner) => {
    try {
      // This would call the email service to notify the partner
      console.log('Sending partner revoked notification to:', partner.email);
    } catch (error) {
      console.error('Error sending partner revoked notification:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading couple settings...</p>
        </div>
      </div>
    );
  }

  if (!couple) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Couple Account</h2>
          <p className="text-gray-600">You don't have a couple account to manage.</p>
        </div>
      </div>
    );
  }

  const partner = getPartner();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-3 rounded-full">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Couple Settings</h1>
              <p className="text-gray-600">Manage your couple account and partner access</p>
            </div>
          </div>

          {/* Couple Info */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Couple Information</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Couple Name</p>
                <p className="font-semibold text-gray-900">{couple.coupleName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Account Owner</p>
                <p className="font-semibold text-gray-900">
                  {isOwner() ? 'You' : partner?.name || 'Unknown'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-semibold text-green-600">
                  {partner ? 'Active' : 'Waiting for partner'}
                </p>
              </div>
            </div>
          </div>

          {/* Partner Info */}
          {partner && (
            <div className="bg-blue-50 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Partner Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-semibold text-gray-900">{partner.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-semibold text-gray-900">{partner.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Joined</p>
                  <p className="font-semibold text-gray-900">
                    {partner.joinedAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-4">
            {isOwner() && partner && (
              <button
                onClick={handleRevokePartner}
                disabled={processing}
                className="w-full bg-red-100 text-red-700 py-3 px-4 rounded-xl font-semibold hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all duration-200"
              >
                <UserX className="w-5 h-5" />
                <span>Revoke Partner Access</span>
              </button>
            )}

            {isOwner() && (
              <button
                onClick={handleDeleteCouple}
                disabled={processing}
                className="w-full bg-red-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all duration-200"
              >
                <AlertTriangle className="w-5 h-5" />
                <span>
                  {partner ? 'Transfer Ownership & Leave' : 'Delete Couple Account'}
                </span>
              </button>
            )}
          </div>

          {/* Info */}
          <div className="mt-6 p-4 bg-yellow-50 rounded-xl">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-800 mb-1">Important Notes</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Revoking partner access will remove them from your couple account</li>
                  <li>• If you delete your account and have a partner, ownership will transfer to them</li>
                  <li>• All couple data (meetings, todos, rocks) will be shared between partners</li>
                  <li>• These actions cannot be undone</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoupleSettings;
