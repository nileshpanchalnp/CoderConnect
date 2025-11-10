import { useEffect, useState } from 'react';
import { Trophy, FileQuestion, MessageSquare, User as UserIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Question } from '../lib/supabase';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { formatDistanceToNow } from '../utils/date';

interface UserProfileProps {
  onNavigate: (page: string, id?: string) => void;
}

interface Stats {
  questionsAsked: number;
  answersPosted: number;
  commentsPosted: number;
}

export const UserProfile = ({ onNavigate }: UserProfileProps) => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [stats, setStats] = useState<Stats>({
    questionsAsked: 0,
    answersPosted: 0,
    commentsPosted: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: userQuestions } = await supabase
        .from('questions')
        .select('*')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });

      setQuestions(userQuestions || []);

      const { count: questionsCount } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', user.id);

      const { count: answersCount } = await supabase
        .from('answers')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', user.id);

      const { count: commentsCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', user.id);

      setStats({
        questionsAsked: questionsCount || 0,
        answersPosted: answersCount || 0,
        commentsPosted: commentsCount || 0,
      });
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Login Required
          </h2>
          <p className="text-gray-600 mb-6">
            You need to be logged in to view your profile.
          </p>
          <Button onClick={() => onNavigate('login')}>Sign In</Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 p-4">
        <div className="max-w-6xl mx-auto pt-8">
          <div className="text-center text-gray-600">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto pt-8">
        <Card className="p-8 mb-6">
          <div className="flex items-start gap-6">
            <div className="p-6 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full">
              <UserIcon className="w-12 h-12 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {user?.display_name}
              </h1>
              <p className="text-gray-600 mb-4">@{user?.username}</p>
              <div className="flex items-center gap-2 text-lg">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <span className="font-semibold text-gray-900">
                  {user?.reputation || 0}
                </span>
                <span className="text-gray-600">reputation points</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-cyan-100 rounded-lg">
                <FileQuestion className="w-6 h-6 text-cyan-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.questionsAsked}
                </p>
                <p className="text-sm text-gray-600">Questions Asked</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.answersPosted}
                </p>
                <p className="text-sm text-gray-600">Answers Posted</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.commentsPosted}
                </p>
                <p className="text-sm text-gray-600">Comments Posted</p>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Questions</h2>
          {questions.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-600 mb-4">You haven't asked any questions yet</p>
              <Button onClick={() => onNavigate('ask')}>Ask Your First Question</Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {questions.map((question) => (
                <Card
                  key={question.id}
                  hover
                  className="p-6 cursor-pointer"
                  onClick={() => onNavigate('question', question.id)}
                >
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-cyan-600 transition-colors">
                    {question.title}
                  </h3>
                  <p className="text-gray-600 mb-3 line-clamp-2">
                    {question.description.substring(0, 200)}...
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{question.views} views</span>
                    <span>{formatDistanceToNow(question.created_at)}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
