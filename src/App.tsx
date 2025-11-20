import { Routes, Route, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext'; // Adjust path if needed
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
  const { loading } = useAuth();

  // 1. This function updates the URL when you type in Navbar
  const handleSearch = (query: string) => {
    if (!query.trim()) {
      navigate('/dashboard'); // Clear search
    } else {
      navigate(`/dashboard?search=${encodeURIComponent(query)}`);
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
      {/* Pass handleSearch to Navbar */}
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

// --- DASHBOARD WRAPPER (THE FIX) ---
// This component reads the URL ?search=xyz or ?tag=xyz and passes it to Dashboard
function DashboardWrapper() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // <--- READ URL PARAMS
  
  const searchQuery = searchParams.get('search');
  const tagQuery = searchParams.get('tag');

  // Determine logic: Tag takes priority, then Search, then null
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
  const { _id } = useParams<{ _id: string }>();
  const navigate = useNavigate();

  return (
    <QuestionDetail
      // Remove _id prop if you are using useParams inside QuestionDetail, 
      // otherwise keep it here. Based on your previous code, you use useParams inside.
      onNavigate={(page: string, id?: string) => {
        if (id) navigate(`/${page}/${_id}`);
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
               {/* Use the wrapper here instead of direct Dashboard */}
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
               {/* When a tag is clicked, navigate to dashboard with query param */}
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