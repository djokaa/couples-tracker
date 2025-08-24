import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  Search,
  X,
  Target,
  CheckSquare,
  AlertTriangle,
  Calendar,
  TrendingUp,
  Heart,
  Users,
  Clock,
  ArrowRight,
  Command,
  Command as CommandIcon
} from 'lucide-react';

const GlobalSearch = ({ onNavigate, onClose }) => {
  const { user } = useAuth();
  const { showError } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [allData, setAllData] = useState({
    rocks: [],
    todos: [],
    issues: [],
    meetings: [],
    qualityOfLife: [],
    meetingSections: []
  });
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = useCallback((term) => {
    if (!term.trim()) return;
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  }, [recentSearches]);

  // Fetch all data for search
  useEffect(() => {
    if (!user?.uid) return;

    const fetchAllData = async () => {
      setLoading(true);
      try {
        const data = {};

        // Fetch rocks
        const rocksQuery = query(collection(db, 'rocks'), where('userId', '==', user.uid));
        const rocksSnapshot = await getDocs(rocksQuery);
        data.rocks = rocksSnapshot.docs.map(doc => ({
          id: doc.id,
          type: 'rock',
          title: doc.data().title,
          description: doc.data().description || '',
          status: doc.data().status,
          assignedTo: doc.data().assignedTo,
          createdAt: doc.data().createdAt,
          section: 'Annual Rocks'
        }));

        // Fetch todos
        const todosQuery = query(collection(db, 'todos'), where('userId', '==', user.uid));
        const todosSnapshot = await getDocs(todosQuery);
        data.todos = todosSnapshot.docs.map(doc => ({
          id: doc.id,
          type: 'todo',
          title: doc.data().title,
          description: doc.data().description || '',
          status: doc.data().status,
          assignedTo: doc.data().assignedTo,
          createdAt: doc.data().createdAt,
          section: 'To-Dos'
        }));

        // Fetch issues
        const issuesQuery = query(collection(db, 'issues'), where('userId', '==', user.uid));
        const issuesSnapshot = await getDocs(issuesQuery);
        data.issues = issuesSnapshot.docs.map(doc => ({
          id: doc.id,
          type: 'issue',
          title: doc.data().name,
          description: doc.data().description || '',
          status: doc.data().status,
          enteredBy: doc.data().enteredBy,
          createdAt: doc.data().createdAt,
          section: 'Issues (IDS)'
        }));

        // Fetch meetings
        const meetingsQuery = query(collection(db, 'meetings'), where('userId', '==', user.uid));
        const meetingsSnapshot = await getDocs(meetingsQuery);
        data.meetings = meetingsSnapshot.docs.map(doc => ({
          id: doc.id,
          type: 'meeting',
          title: doc.data().title || 'Weekly Meeting',
          description: doc.data().notes || '',
          status: doc.data().status,
          createdAt: doc.data().createdAt,
          section: 'Weekly Meetings'
        }));

        // Fetch quality of life check-ins
        const qoLQuery = query(collection(db, 'qualityOfLife'), where('userId', '==', user.uid));
        const qoLSnapshot = await getDocs(qoLQuery);
        data.qualityOfLife = qoLSnapshot.docs.map(doc => {
          const data = doc.data();
          const avgScore = (data.physical + data.mental + data.spiritual + data.friends + data.marriage + data.sex) / 6;
          return {
            id: doc.id,
            type: 'quality-of-life',
            title: `Quality of Life Check-in (${avgScore.toFixed(1)}/10)`,
            description: `Physical: ${data.physical}/10, Mental: ${data.mental}/10, Spiritual: ${data.spiritual}/10, Friends: ${data.friends}/10, Marriage: ${data.marriage}/10, Sex: ${data.sex}/10`,
            status: 'completed',
            createdAt: data.createdAt,
            date: data.date,
            section: 'Quality of Life'
          };
        });

        // Fetch meeting sections (gratitude, etc.)
        const sectionsQuery = query(collection(db, 'meetingSections'), where('userId', '==', user.uid));
        const sectionsSnapshot = await getDocs(sectionsQuery);
        data.meetingSections = sectionsSnapshot.docs.map(doc => {
          const data = doc.data();
          let title = '';
          let description = '';
          
          if (data.sectionId === 'gratitude') {
            title = 'Gratitude';
            description = `${data.data?.person1Gratitude || ''} ${data.data?.person2Gratitude || ''}`.trim();
          } else {
            title = data.sectionId?.charAt(0).toUpperCase() + data.sectionId?.slice(1) || 'Meeting Section';
            description = JSON.stringify(data.data || {});
          }

          return {
            id: doc.id,
            type: 'meeting-section',
            title,
            description,
            status: 'completed',
            createdAt: data.createdAt,
            meetingDate: data.meetingDate,
            sectionId: data.sectionId,
            section: 'Meeting Notes'
          };
        });

        setAllData(data);
      } catch (error) {
        console.error('Error fetching data for search:', error);
        showError('Search Error', 'Failed to load search data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [user.uid, showError]);

  // Fuzzy search function
  const fuzzySearch = (text, query) => {
    if (!query) return 0;
    const searchTerm = query.toLowerCase();
    const searchText = text.toLowerCase();
    
    if (searchText.includes(searchTerm)) return 1;
    
    // Simple fuzzy matching
    let score = 0;
    let queryIndex = 0;
    
    for (let i = 0; i < searchText.length && queryIndex < searchTerm.length; i++) {
      if (searchText[i] === searchTerm[queryIndex]) {
        score += 1;
        queryIndex++;
      }
    }
    
    return score / searchTerm.length;
  };

  // Search function
  const performSearch = useCallback((term) => {
    if (!term.trim()) {
      setResults([]);
      return;
    }

    const allItems = [
      ...allData.rocks,
      ...allData.todos,
      ...allData.issues,
      ...allData.meetings,
      ...allData.qualityOfLife,
      ...allData.meetingSections
    ];

    const searchResults = allItems
      .map(item => {
        const titleScore = fuzzySearch(item.title, term);
        const descScore = fuzzySearch(item.description, term);
        const maxScore = Math.max(titleScore, descScore);
        
        return {
          ...item,
          score: maxScore,
          matchedField: titleScore > descScore ? 'title' : 'description'
        };
      })
      .filter(item => item.score > 0.3) // Minimum relevance threshold
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Limit to top 10 results

    setResults(searchResults);
  }, [allData]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchTerm);
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, performSearch]);

  // Highlight matching text
  const highlightText = (text, searchTerm) => {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-0.5 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  // Handle result click
  const handleResultClick = (result) => {
    saveRecentSearch(searchTerm);
    
    switch (result.type) {
      case 'rock':
        onNavigate('rocks');
        break;
      case 'todo':
        onNavigate('todos');
        break;
      case 'issue':
        onNavigate('issues');
        break;
      case 'meeting':
        onNavigate('meetings');
        break;
      case 'quality-of-life':
        onNavigate('quality-of-life');
        break;
      case 'meeting-section':
        onNavigate('meeting-agenda');
        break;
      default:
        onNavigate('home');
    }
    
    onClose();
  };

  // Handle recent search click
  const handleRecentSearchClick = (term) => {
    setSearchTerm(term);
    performSearch(term);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          searchRef.current && !searchRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
        {/* Search Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search across all content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-lg"
              autoFocus
            />
            <button
              onClick={onClose}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Keyboard shortcut hint */}
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>Search across rocks, todos, issues, meetings, and more</span>
            <div className="flex items-center space-x-1">
              <CommandIcon className="w-3 h-3" />
              <span>K</span>
            </div>
          </div>
        </div>

        {/* Search Results */}
        <div ref={dropdownRef} className="overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading search data...</p>
            </div>
          ) : searchTerm ? (
            results.length > 0 ? (
              <div className="p-2">
                {results.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}-${index}`}
                    onClick={() => handleResultClick(result)}
                    className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full flex-shrink-0 ${
                        result.type === 'rock' ? 'bg-blue-50' :
                        result.type === 'todo' ? 'bg-green-50' :
                        result.type === 'issue' ? 'bg-orange-50' :
                        result.type === 'meeting' ? 'bg-pink-50' :
                        result.type === 'quality-of-life' ? 'bg-purple-50' :
                        'bg-gray-50'
                      }`}>
                        {result.type === 'rock' && <Target className="w-4 h-4 text-blue-600" />}
                        {result.type === 'todo' && <CheckSquare className="w-4 h-4 text-green-600" />}
                        {result.type === 'issue' && <AlertTriangle className="w-4 h-4 text-orange-600" />}
                        {result.type === 'meeting' && <Calendar className="w-4 h-4 text-pink-600" />}
                        {result.type === 'quality-of-life' && <TrendingUp className="w-4 h-4 text-purple-600" />}
                        {result.type === 'meeting-section' && <Users className="w-4 h-4 text-gray-600" />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium text-gray-800 truncate">
                            {highlightText(result.title, searchTerm)}
                          </h4>
                          <span className="text-xs text-gray-500 ml-2">
                            {result.section}
                          </span>
                        </div>
                        
                        {result.description && (
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {highlightText(result.description, searchTerm)}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {result.status}
                          </span>
                          <ArrowRight className="w-3 h-3 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No results found</h3>
                <p className="text-gray-500">Try adjusting your search terms or check your spelling.</p>
              </div>
            )
          ) : (
            <div className="p-4">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Recent Searches</h3>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term, index) => (
                      <button
                        key={index}
                        onClick={() => handleRecentSearchClick(term)}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Search Tips */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">Search Tips</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-blue-600" />
                    <span>Annual Rocks & Goals</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckSquare className="w-4 h-4 text-green-600" />
                    <span>To-Do Items & Tasks</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <span>Issues & Problems</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-pink-600" />
                    <span>Meeting Notes</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    <span>Quality of Life Check-ins</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-600" />
                    <span>Gratitude & Meeting Sections</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
