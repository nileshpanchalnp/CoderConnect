import { useState, useEffect, useRef } from 'react';
import { Menu, X, Home, Tag, LogOut, Plus, Trophy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './Button';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Sidebar = ({ currentPage, onNavigate }: SidebarProps) => {
  const { user, profile, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNavClick = (page: string) => {
    onNavigate(page);
    setIsOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    handleNavClick('dashboard');
  };

  const navItems = [
    { id: 'dashboard', label: 'All Questions', icon: Home },
    { id: 'tags', label: 'Tags', icon: Tag },
  ];

  const userItems = user
    ? [
        { id: 'ask', label: 'Ask Question', icon: Plus },
        { id: 'profile', label: 'My Profile', icon: Trophy },
      ]
    : [];

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-16 left-4 z-40 md:hidden p-2 rounded-lg bg-white/80 backdrop-blur-sm border border-gray-300 hover:bg-gray-100 transition-all"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-gray-900" />
        ) : (
          <Menu className="w-6 h-6 text-gray-900" />
        )}
      </button>

      <aside
        ref={sidebarRef}
        className={`fixed md:relative top-0 left-0 h-screen md:h-auto z-30 w-64 bg-white/80 backdrop-blur-md border-r border-white/40 shadow-lg transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="h-full md:h-screen flex flex-col">
          <div className="pt-24 md:pt-6 px-6 pb-6 border-b border-gray-200">
            <button
              onClick={() => handleNavClick('dashboard')}
              className="text-2xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent hover:scale-105 transition-transform w-full text-left"
            >
              DevFlow
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {user && (
            <div className="border-t border-gray-200 px-4 py-6 space-y-2">
              <div className="bg-gradient-to-r from-cyan-100 to-blue-100 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-gray-900">{profile?.display_name}</p>
                <p className="text-xs text-gray-600">@{profile?.username}</p>
                <div className="flex items-center gap-1 mt-2 text-sm font-semibold text-yellow-600">
                  <Trophy className="w-4 h-4" />
                  {profile?.reputation || 0} points
                </div>
              </div>

              {userItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}

              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all font-medium"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          )}

          {!user && (
            <div className="border-t border-gray-200 px-4 py-6 space-y-2">
              <Button
                onClick={() => handleNavClick('login')}
                variant="ghost"
                className="w-full"
              >
                Sign In
              </Button>
              <Button
                onClick={() => handleNavClick('signup')}
                className="w-full"
              >
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
