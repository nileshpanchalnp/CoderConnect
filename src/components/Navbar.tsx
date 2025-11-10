import { useState, useRef, useEffect } from 'react';
import { Search, User, LogOut, Trophy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './Button';

interface NavbarProps {
  onSearch?: (query: string) => void;
  onNavigate: (page: string) => void;
  currentPage: string;
}

export const Navbar = ({ onSearch, onNavigate, currentPage }: NavbarProps) => {
  const { user, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setShowDropdown(false);
    onNavigate('dashboard');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-white/40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <button
              onClick={() => onNavigate('dashboard')}
              className="text-2xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent hover:scale-105 transition-transform"
            >
              DevFlow
            </button>

            <div className="hidden md:flex items-center gap-4">
              <button
                onClick={() => onNavigate('dashboard')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  currentPage === 'dashboard'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Questions
              </button>
              <button
                onClick={() => onNavigate('tags')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  currentPage === 'tags'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Tags
              </button>
            </div>
          </div>

          <form onSubmit={handleSearch} className="hidden md:block flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/60 backdrop-blur-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </form>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Button
                  onClick={() => onNavigate('ask')}
                  size="sm"
                  className="hidden sm:block"
                >
                  Ask Question
                </Button>

                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/60 backdrop-blur-sm border border-gray-300 hover:bg-white/80 transition-all"
                  >
                    <User className="w-5 h-5 text-gray-700" />
                    <span className="hidden sm:inline text-sm font-medium text-gray-700">
                      {user?.username}
                    </span>
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-56 bg-white/90 backdrop-blur-md rounded-xl border border-white/40 shadow-xl overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900">
                          {user?.display_name}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Trophy className="w-3 h-3 text-yellow-500" />
                          {user?.reputation || 0} reputation
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          onNavigate('profile');
                          setShowDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                      >
                        <User className="w-4 h-4" />
                        My Profile
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => onNavigate('login')}
                  variant="ghost"
                  size="sm"
                >
                  Login
                </Button>
                <Button onClick={() => onNavigate('signup')} size="sm">
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
