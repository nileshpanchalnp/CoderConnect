import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { AskQuestion } from './pages/AskQuestion';
import { QuestionDetail } from './pages/QuestionDetail';
import { Tags } from './pages/Tags';
import { UserProfile } from './pages/UserProfile';

type Page = 'login' | 'signup' | 'dashboard' | 'ask' | 'question' | 'tags' | 'profile';

function AppContent() {
  const { loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [questionId, setQuestionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'search' | 'tag' | null>(null);

  const handleNavigation = (page: string, id?: string) => {
    setCurrentPage(page as Page);
    if (page === 'question' && id) {
      setQuestionId(id);
    }
    if (page !== 'dashboard') {
      setSearchQuery('');
      setFilterMode(null);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilterMode('search');
    setCurrentPage('dashboard');
  };

  const handleTagSelect = (tag: string) => {
    setSearchQuery(tag);
    setFilterMode('tag');
    setCurrentPage('dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (currentPage === 'login') {
    return <Login onNavigate={handleNavigation} />;
  }

  if (currentPage === 'signup') {
    return <Signup onNavigate={handleNavigation} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        onNavigate={handleNavigation}
        onSearch={handleSearch}
        currentPage={currentPage}
      />
      <div className="flex flex-1">
        <Sidebar currentPage={currentPage} onNavigate={handleNavigation} />
        <main className="flex-1 w-full md:w-auto">
          {currentPage === 'dashboard' && (
            <Dashboard
              onNavigate={handleNavigation}
              searchQuery={searchQuery}
              filterMode={filterMode}
            />
          )}
          {currentPage === 'ask' && <AskQuestion onNavigate={handleNavigation} />}
          {currentPage === 'question' && questionId && (
            <QuestionDetail questionId={questionId} onNavigate={handleNavigation} />
          )}
          {currentPage === 'tags' && (
            <Tags onNavigate={handleNavigation} onTagSelect={handleTagSelect} />
          )}
          {currentPage === 'profile' && <UserProfile onNavigate={handleNavigation} />}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
