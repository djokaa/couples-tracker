import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Users, Mail, UserPlus, Trash2, RefreshCw } from 'lucide-react';

const CoupleProfile = ({ onBack }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [couple, setCouple] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        if (!user?.uid) return;
        const up = await getDoc(doc(db, 'userProfiles', user.uid));
        const coupleId = up.data()?.coupleId;
        if (!coupleId) { setLoading(false); return; }
        const cp = await getDoc(doc(db, 'couples', coupleId));
        setCouple({ id: coupleId, ...cp.data() });
      } catch (e) {
        console.error(e);
        showError('Error', 'Failed to load couple profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.uid, showError]);

  const handleInvite = async () => {
    try {
      if (!inviteEmail || !couple?.id) return;
      await updateDoc(doc(db, 'couples', couple.id), {
        invitationStatus: 'pending',
        invitedEmail: inviteEmail,
        updatedAt: serverTimestamp()
      });
      showSuccess('Invitation Sent', 'Invite email recorded. (Email delivery stubbed)');
    } catch (e) {
      console.error(e);
      showError('Error', 'Failed to send invite');
    }
  };

  if (loading) return null;

  if (!couple) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center">
        <div className="text-center text-gray-600">No couple profile found.</div>
      </div>
    );
  }

  const partnerA = couple.partners?.[0];
  const partnerB = couple.partners?.[1];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-2 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Couple</h1>
            </div>
            <button onClick={onBack} className="px-4 py-2 border rounded-lg text-gray-700">Back</button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Couple Name</label>
              <input
                type="text"
                defaultValue={couple.coupleName || ''}
                onBlur={async (e) => {
                  try { await updateDoc(doc(db, 'couples', couple.id), { coupleName: e.target.value, updatedAt: serverTimestamp() }); showSuccess('Saved', 'Couple name updated'); } catch { showError('Error', 'Failed to save'); }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-xl p-4">
                <div className="font-semibold mb-1">Partner A</div>
                <div className="text-sm text-gray-600">{partnerA?.name} ({partnerA?.email || 'email pending'})</div>
                <div className="mt-2 text-xs inline-flex px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">{partnerA?.status || 'active'}</div>
              </div>
              <div className="border rounded-xl p-4">
                <div className="font-semibold mb-1">Partner B</div>
                <div className="text-sm text-gray-600">{partnerB?.name} ({partnerB?.email || 'email pending'})</div>
                <div className={`mt-2 text-xs inline-flex px-2 py-0.5 rounded-full ${partnerB?.status==='active' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-yellow-100 text-yellow-700 border border-yellow-200'}`}>{partnerB?.status || 'pending'}</div>
                {partnerB?.status !== 'active' && (
                  <div className="mt-3 flex items-center space-x-2">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e)=>setInviteEmail(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-lg"
                      placeholder="Partner email"
                    />
                    <button onClick={handleInvite} className="px-3 py-2 bg-pink-600 text-white rounded-lg flex items-center space-x-1">
                      <UserPlus className="w-4 h-4"/> <span>Invite</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="border rounded-xl p-4">
              <div className="font-semibold mb-2">Settings</div>
              <div className="flex items-center space-x-2 text-sm">
                <button className="px-3 py-2 border rounded-lg flex items-center space-x-1">
                  <RefreshCw className="w-4 h-4"/> <span>Reinvite</span>
                </button>
                <button className="px-3 py-2 border rounded-lg text-red-600 flex items-center space-x-1">
                  <Trash2 className="w-4 h-4"/> <span>Remove Partner</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoupleProfile;







