import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";
import { Server } from "../Utills/Server";
import { toast } from 'react-toastify';

axios.defaults.withCredentials = true; // send cookies with requests

interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  reputation: number;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load logged-in user profile on refresh
  const loadProfile = async () => {
    try {
      const res = await axios.get(Server+`Profile/me`);
      setUser(res.data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const signUp = async (email: string, password: string, username: string, displayName: string) => {
    await axios.post(Server+`User/signup`, {
      email,
      password,
      username,
      display_name: displayName
    });
    await signIn(email, password);
    await loadProfile();
  };

  const signIn = async (email: string, password: string) => {
    await axios.post(Server+`User/signin`, { email, password });
    await loadProfile();
  };

  const signOut = async () => {
    await toast.success('USer LogOut successful!');
    await axios.post(Server+`User/signout`);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
