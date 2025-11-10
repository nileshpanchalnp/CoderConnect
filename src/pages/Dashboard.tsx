import { useEffect, useState } from 'react';
import axios from 'axios';
import { MessageSquare, Eye, ThumbsUp, ThumbsDown, Tag } from 'lucide-react';
import { Card } from '../components/Card';
import { formatDistanceToNow } from '../utils/date';

interface DashboardProps {
  onNavigate: (page: string, id?: string) => void;
  searchQuery?: string;
  filterMode?: 'search' | 'tag' | null;
}

interface QuestionWithStats {
  views: ReactNode;
  _id: string;
  title: string;
  description: string;
  created_at: string;
  author_id: { username: string; display_name: string; reputation: number };
  answer_count: number;
  vote_likes: number;
  vote_dislikes: number;
  tags: { name: string }[];
}

export const Dashboard = ({ onNavigate, searchQuery, filterMode }: DashboardProps) => {
  const [questions, setQuestions] = useState<QuestionWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuestions();
  }, [searchQuery, filterMode]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      // Base GET request to your backend API
const response = await axios.get('http://localhost:5000/question/getAll', {
  headers: {
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
  },
});
      let data: QuestionWithStats[] = response.data.questions || [];
      console.log( 'Fetched questions:', response.data.questions);

      // Apply filters locally (same logic as before)
      if (filterMode === 'search' && searchQuery) {
        const q = searchQuery.toLowerCase();
        data = data.filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q)
        );
      }

      if (filterMode === 'tag' && searchQuery) {
        const tagQuery = searchQuery.toLowerCase();
        data = data.filter((item) =>
          item.tags?.some((t) => t.name.toLowerCase() === tagQuery)
        );
      }

      // Sort by created_at (most recent first)
      data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setQuestions(data);
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 p-4">
        <div className="max-w-7xl mx-auto pt-4">
          <div className="text-center text-gray-600">Loading questions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto pt-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">All Questions</h1>
            <p className="text-gray-600">{questions.length} questions</p>
          </div>
        </div>

        <div className="space-y-4">
          {questions.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-600">
                {searchQuery
                  ? 'No questions found matching your search.'
                  : 'No questions yet. Be the first to ask!'}
              </p>
            </Card>
          ) : (
            questions.map((question) => (
              <Card
                key={question._id}
                hover
                className="p-6 cursor-pointer"
                onClick={() => onNavigate('/question/:id', question._id)}
              >
                <div className="flex gap-6">
                  <div className="flex flex-col items-center gap-3 text-sm text-gray-600 min-w-[80px]">
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4 text-green-600" />
                      <span className="font-medium">{question.vote_likes}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ThumbsDown className="w-4 h-4 text-red-600" />
                      <span className="font-medium">{question.vote_dislikes}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      <span className="font-medium">{question.answer_count}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span className="font-medium">{question.views}</span>
                    </div>
                  </div>

                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2 hover:text-cyan-600 transition-colors">
                      {question.title}
                    </h2>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {question.description.substring(0, 200)}...
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {question.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-sm font-medium"
                        >
                          <Tag className="w-3 h-3" />
                          {tag.name}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>
                        asked by{' '}
                        <span className="font-medium text-gray-700">
                          {question.author_id?.display_name}
                        </span>
                      </span>
                      <span>{formatDistanceToNow(question.created_at)}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
