import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { db } from '../firebase/config';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import {
  Heart,
  Clock,
  Save,
  ChevronLeft,
  ChevronRight,
  Target,
  BarChart3,
  CheckSquare,
  AlertTriangle,
  Star
} from 'lucide-react';

const MeetingAgenda = ({ onBack, onComplete, meetingParams }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [currentStep, setCurrentStep] = useState(0);
  const [meetingData, setMeetingData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [startTime] = useState(Date.now());
  const [person1Gratitude, setPerson1Gratitude] = useState('');
  const [person2Gratitude, setPerson2Gratitude] = useState('');

  const steps = [
    { id: 'gratitude', title: 'Gratitude', icon: Heart },
    { id: 'rocks', title: 'Annual Rocks Review', icon: Target },
    { id: 'scorecard', title: 'Scorecard', icon: BarChart3 },
    { id: 'todos', title: 'To-Dos', icon: CheckSquare },
    { id: 'issues', title: 'Issues (IDS)', icon: AlertTriangle },
    { id: 'rating', title: 'Meeting Rating', icon: Star }
  ];

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s]
      .map(v => v < 10 ? '0' + v : v)
      .filter((v, i) => v !== '00' || i > 0)
      .join(':');
  };

  useEffect(() => {
    // Listen for real-time updates to meeting data
    const today = new Date().toDateString();
    const q = query(
      collection(db, 'meetingSections'),
      where('meetingDate', '==', today),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = {};
      snapshot.docs.forEach((doc) => {
        const sectionData = doc.data();
        data[sectionData.sectionId] = sectionData;
      });
      setMeetingData(data);
      // Update gratitude fields if data exists
      if (data.gratitude?.data) {
        setPerson1Gratitude(data.gratitude.data.person1Gratitude || '');
        setPerson2Gratitude(data.gratitude.data.person2Gratitude || '');
      }
    });

    return () => unsubscribe();
  }, [user.uid]);

  const saveSection = async (sectionData) => {
    if (!user?.uid) return;

    try {
      const today = new Date().toDateString();
      const sectionId = steps[currentStep].id;
      
      const sectionDoc = {
        userId: user.uid,
        meetingDate: today,
        sectionId: sectionId,
        data: sectionData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Check if section already exists
      const existingQuery = query(
        collection(db, 'meetingSections'),
        where('meetingDate', '==', today),
        where('userId', '==', user.uid),
        where('sectionId', '==', sectionId)
      );

      const existingSnapshot = await getDocs(existingQuery);
      
      if (existingSnapshot.docs.length > 0) {
        // Update existing section
        await updateDoc(doc(db, 'meetingSections', existingSnapshot.docs[0].id), {
          data: sectionData,
          updatedAt: serverTimestamp()
        });
      } else {
        // Create new section
        await addDoc(collection(db, 'meetingSections'), sectionDoc);
      }

      showSuccess('Section Saved', `${steps[currentStep].title} section saved successfully!`);
    } catch (error) {
      console.error('Error saving section:', error);
      showError('Save Failed', 'Failed to save section. Please try again.');
    }
  };

  const handleNext = async () => {
    // Save current section before moving to next
    if (currentStep === 0) {
      await saveSection({
        person1Gratitude,
        person2Gratitude
      });
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Meeting completed
      showSuccess('Meeting Complete', 'Great job completing your weekly meeting!');
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderGratitudeSection = () => {
    const handleSave = async () => {
      await saveSection({
        person1Gratitude,
        person2Gratitude
      });
    };

    return (
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Gratitude</h2>
          <p className="text-gray-600">Share what you're grateful for about each other</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Partner 1's Gratitude
            </label>
            <textarea
              value={person1Gratitude}
              onChange={(e) => setPerson1Gratitude(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="Share what you're grateful for about your partner..."
              rows={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Partner 2's Gratitude
            </label>
            <textarea
              value={person2Gratitude}
              onChange={(e) => setPerson2Gratitude(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="Share what you're grateful for about your partner..."
              rows={6}
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-4 mt-8">
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-200 flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save & Continue</span>
          </button>
        </div>
      </div>
    );
  };

  const renderPlaceholderSection = () => {
    const currentStepData = steps[currentStep];
    const IconComponent = currentStepData.icon;

    return (
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <IconComponent className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{currentStepData.title}</h2>
          <p className="text-gray-600">This section is coming soon!</p>
        </div>

        <div className="text-center">
          <p className="text-gray-500 mb-6">
            The {currentStepData.title.toLowerCase()} section will be implemented in the next update.
          </p>
        </div>
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderGratitudeSection();
      default:
        return renderPlaceholderSection();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100">
      {/* Progress Bar with Timer */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Back to Meetings</span>
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Step {currentStep + 1} of {steps.length}
              </span>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  {Math.round(((currentStep + 1) / steps.length) * 100)}% Complete
                </span>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {formatTime(Date.now() - startTime)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-pink-500 to-rose-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {renderCurrentStep()}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <button
            onClick={handleNext}
            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg font-medium hover:from-pink-600 hover:to-rose-600 transition-all duration-200 flex items-center space-x-2"
          >
            <span>{currentStep === steps.length - 1 ? 'Complete Meeting' : 'Next'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingAgenda;
