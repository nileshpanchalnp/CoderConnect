
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

// ... (Your 'Layout' function is perfect, no change needed) ...
function Layout({ children }: { children: React.ReactNode }) {
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
      <Navbar onNavigate={handleNavigation} onSearch={handleSearch} currentPage="" />
      <div className="flex flex-1">
        <Sidebar currentPage="" onNavigate={handleNavigation} />
        <main className="flex-1 w-full md:w-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

// ... (Your 'QuestionDetailWrapper' function is perfect, no change needed) ...
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
      {/* <--- REMOVE THIS LINE --- <Router> */}
      <Routes>

        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected UI Layout */}
        <Route
          path="/"
          element={
            <Layout>
              <Dashboard onNavigate={() => { }} searchQuery="" filterMode={null} />
            </Layout>
          }
        />

        <Route
          path="/dashboard"
          element={
            <Layout>
              <Dashboard onNavigate={() => { }} searchQuery="" filterMode={null} />
            </Layout>
          }
        />

        <Route
          path="/ask"
          element={
            <Layout>
              <AskQuestion />
            </Layout>
          }
        />

        <Route
          path="/question/:_id"
          element={
            <Layout>
              <QuestionDetailWrapper />
            </Layout>
          }
        />

        <Route
          path="/tags"
          element={
            <Layout>
              <Tags onNavigate={() => { }} onTagSelect={() => { }} />
            </Layout>
          }
        />

        <Route
          path="/profile"
          element={
            <Layout>
              <UserProfile onNavigate={() => { }} />
            </Layout>
          }
        />

       
      </Routes>
          <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      {/* <--- REMOVE THIS LINE --- </Router> */}
    </AuthProvider>
  );
}

export default App;