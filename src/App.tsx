import { Routes, Route, useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom'; // 1. Import useLocation
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
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

// --- LAYOUT COMPONENT ---
function Layout({ children, currentPage }: { children: React.ReactNode; currentPage: string }) {
  const navigate = useNavigate();
  const location = useLocation(); // 2. Get current location
  const { loading } = useAuth();

  const handleSearch = (query: string) => {
    if (query.trim()) {
      // If user types something, always go to dashboard search results
      navigate(`/dashboard?search=${encodeURIComponent(query)}`);
    } else {
      if (location.pathname === '/dashboard' || location.pathname === '/') {
        navigate('/dashboard'); 
      }
    }
  };

  const handleNavigation = (page: string, id?: string) => {
    if (id) navigate(`/${page}/${id}`);
    else navigate(`/${page}`);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onNavigate={handleNavigation} onSearch={handleSearch} currentPage={currentPage} />
      <div className="flex flex-1">
        <Sidebar currentPage={currentPage} onNavigate={handleNavigation} />
        <main className="flex-1 w-full md:w-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

// --- DASHBOARD WRAPPER ---
function DashboardWrapper() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const searchQuery = searchParams.get('search');
  const tagQuery = searchParams.get('tag');

  let currentSearch = '';
  let filterMode: 'search' | 'tag' | null = null;

  if (tagQuery) {
    currentSearch = tagQuery;
    filterMode = 'tag';
  } else if (searchQuery) {
    currentSearch = searchQuery;
    filterMode = 'search';
  }

  return (
    <Dashboard 
      onNavigate={(page, id) => id ? navigate(`/${page}/${id}`) : navigate(`/${page}`)} 
      searchQuery={currentSearch} 
      filterMode={filterMode} 
    />
  );
}

// --- QUESTION WRAPPER ---
function QuestionDetailWrapper() {
  // We don't need to grab _id here if QuestionDetail uses useParams, 
  // but keeping the wrapper is fine for clean props.
  const navigate = useNavigate();

  return (
    <QuestionDetail
      onNavigate={(page: string, id?: string) => {
        if (id) navigate(`/${page}/${id}`);
        else navigate(`/${page}`);
      }}
    />
  );
}

// --- MAIN APP ---
function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Dashboard Root Redirect */}
        <Route
          path="/"
          element={
            <Layout currentPage="dashboard">
              <DashboardWrapper />
            </Layout>
          }
        />

        {/* Dashboard Route */}
        <Route
          path="/dashboard"
          element={
            <Layout currentPage="dashboard">
              <DashboardWrapper />
            </Layout>
          }
        />

        {/* Ask Question */}
        <Route
          path="/ask"
          element={
            <Layout currentPage="ask">
              <AskQuestion />
            </Layout>
          }
        />

        {/* Question Detail */}
        <Route
          path="/question/:_id"
          element={
            <Layout currentPage="question">
              <QuestionDetailWrapper />
            </Layout>
          }
        />

        {/* Tags Page */}
        <Route
          path="/tags"
          element={
            <Layout currentPage="tags">
              <Tags 
                onNavigate={() => {}} 
                onTagSelect={(tagName) => window.location.href = `/dashboard?tag=${tagName}`} 
              />
            </Layout>
          }
        />

        {/* Profile */}
        <Route
          path="/profile"
          element={
            <Layout currentPage="profile">
              <UserProfile onNavigate={() => {}} />
            </Layout>
          }
        />
      </Routes>

      <ToastContainer />
    </AuthProvider>
  );
}

export default App;