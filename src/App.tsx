import { Routes, Route, useNavigate, useParams, useNavigate as useRRNavigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { AskQuestion } from './pages/AskQuestion';
import { QuestionDetail } from './pages/QuestionDetail';
import { Tags } from './pages/Tags';
import { UserProfile } from './pages/UserProfile';
import { useAuth } from './contexts/AuthContext';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

function Layout({ children, currentPage }: { children: React.ReactNode; currentPage: string }) {
  const navigate = useNavigate();
  const { loading } = useAuth();

  const handleSearch = (query: string) => {
    navigate(`/dashboard?search=${query}`);
  };

  const handleNavigation = (page: string, id?: string) => {
    if (id) navigate(`/${page}/${id}`);
    else navigate(`/${page}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
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

function QuestionDetailWrapper() {
  const { _id } = useParams<{ _id: string }>();
  const navigate = useRRNavigate();

  return (
    <QuestionDetail
      _id={_id ?? ''}
      onNavigate={(page: string, id?: string) => {
        if (id) navigate(`/${page}/${id}`);
        else navigate(`/${page}`);
      }}
    />
  );
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Dashboard */}
        <Route
          path="/"
          element={
            <Layout currentPage="dashboard">
              <Dashboard onNavigate={() => { }} searchQuery="" filterMode={null} />
            </Layout>
          }
        />

        <Route
          path="/dashboard"
          element={
            <Layout currentPage="dashboard">
              <Dashboard onNavigate={() => { }} searchQuery="" filterMode={null} />
            </Layout>
          }
        />

        {/* Ask */}
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

        {/* Tags */}
        <Route
          path="/tags"
          element={
            <Layout currentPage="tags">
              <Tags onNavigate={() => { }} onTagSelect={() => { }} />
            </Layout>
          }
        />

        {/* Profile */}
        <Route
          path="/profile"
          element={
            <Layout currentPage="profile">
              <UserProfile onNavigate={() => { }} />
            </Layout>
          }
        />
      </Routes>

      <ToastContainer />
    </AuthProvider>
  );
}

export default App;
