import { useEffect, useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, Eye, Tag, Trophy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
// Note: Assuming Question, Answer, and Comment types are available globally or imported correctly.
// Removed supabase import as it's not used for the final comment post logic.
import { Question, Answer, Comment, Profile } from '../lib/supabase';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Textarea } from '../components/Input';
import { formatDistanceToNow } from '../utils/date';
import axios from 'axios';
import { Server } from '../Utills/Server';
import { useNavigate, useParams } from 'react-router-dom';

// Removed _id prop since it's retrieved via useParams()
interface QuestionDetailProps {
  onNavigate: (page: string) => void;
}

// Removed local Profile interface, using imported Profile type
interface QuestionWithDetails extends Question {
  _id: string;
  tags?: { name: string }[]; // Added ? for safety
  vote_likes: number;
  vote_dislikes: number;
  user_vote?: 'like' | 'dislike' | null;
  author_id?: Profile;
}

interface AnswerWithDetails extends Answer {
  _id: string;
  vote_likes: number;
  vote_dislikes: number;
  user_vote?: 'like' | 'dislike' | null;
  comments?: Comment[]; // Added ? for safety
  author_id?: Profile;
}

export const QuestionDetail = ({ }: QuestionDetailProps) => {
  const navigate = useNavigate();
  // We use the parameter name that the server expects: _id
  const { _id } = useParams();
  const { user } = useAuth();
  const [question, setQuestion] = useState<QuestionWithDetails | null>(null);
  // Initializing array states to empty array [] prevents .length error on initial render
  const [answers, setAnswers] = useState<AnswerWithDetails[]>([]);
  const [questionComments, setQuestionComments] = useState<Comment[]>([]);
  const [answerContent, setAnswerContent] = useState('');
  const [commentContent, setCommentContent] = useState('');
  const [commentTarget, setCommentTarget] = useState<{ type: 'question' | 'answer'; id: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (_id) {
      loadQuestion();
    }
  }, [_id]);


  const loadQuestion = async () => {
    setLoading(true);
    try {
      const res = await axios.get(Server + `Question/get/${_id}`);
      // Check if question exists and set state
      setQuestion(res.data.question || null);
      setQuestionComments(res.data.questionComments || []); // Safely default to []
      setAnswers(res.data.answers || []); // Safely default to []

    } catch (error) {
      console.error("Error loading question:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (type: 'like' | 'dislike', targetType: 'question' | 'answer', _id: string) => {
    // Assuming 'user' is the state variable holding the authenticated user object.
    // The 'user' check is good for ensuring authentication before proceeding.
    if (!user) {
      navigate("/login");
      return;
    }

    // 1. Construct the dynamic URL path
    let url: string;
    if (targetType === 'question') {
      // Matches the server route: POST /Vote/question/:question_id
      url = Server + `Vote/question/${_id}`;
    } else {
      // Matches the server route: POST /Vote/answer/:answer_id
      url = Server + `Vote/answer/${_id}`;
    }

    try {
      // 2. Make the POST request
      // Note: We only send vote_type. The author_id is handled by the 'auth' middleware on the backend.
      await axios.post(url, {
        vote_type: type,
      });

      // 3. Refresh data
      // This function must be called to re-fetch the question/answers 
      // to update the vote counts and user's current vote status on the UI.
      loadQuestion();

    } catch (error) {
      console.error(`Error voting on ${targetType}:`, error);
      // Optional: Add some user feedback here (e.g., a toast notification)
    }
  };

  const handlePostAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !answerContent.trim()) return;

    await axios.post(Server + `Answer/create/${_id}`, {
      question_id: _id,
      author_id: user.id,
      content: answerContent.trim(),
    });

    setAnswerContent("");
    loadQuestion();
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !commentContent.trim() || !commentTarget) return;

    const content = commentContent.trim();
    // ✅ FIX: The ID is saved in state as 'id', so access it as 'commentTarget.id'
    const targetId = commentTarget.id;

    // 1. Determine the correct API endpoint and route prefix
    let url: string;
    let data: { content: string; author_id: string };


    if (commentTarget.type === 'question') {
      // Use the correctly retrieved targetId
      url = Server + `CommentQuestion/create/${targetId}`;
    } else {
      // Use the correctly retrieved targetId
      url = Server + `CommnetAnswer/create/${targetId}`;
    }

    data = {
      content: content,
      // Your backend is set up to read the user ID from req.user._id, 
      // so sending user.id here is unnecessary but harmless if the backend ignores it.
      author_id: user.id
    };

    try {
      // 2. Use axios to post the data to the specific backend endpoint
      await axios.post(url, data);

      // 3. Clear state and reload data on success
      setCommentContent('');
      setCommentTarget(null);
      loadQuestion();

    } catch (error) {
      console.error("Error posting comment:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 p-4">
        <div className="max-w-6xl mx-auto pt-8">
          <div className="text-center text-gray-600">Loading question...</div>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 p-4">
        <div className="max-w-6xl mx-auto pt-8">
          <Card className="p-8 text-center">
            <p className="text-gray-600">Question not found</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto pt-8 pb-12">
        <Card className="p-8 mb-6">
          <div className="flex gap-6">
            <div className="flex flex-col items-center gap-3 min-w-[60px]">
              <button
                onClick={() => handleVote('like', 'question', question._id)}
                className={`p-2 rounded-lg transition-all ${question.user_vote === 'like'
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                <ThumbsUp className="w-6 h-6" />
              </button>
              <span className="text-xl font-bold text-gray-900">
                {question.vote_likes - question.vote_dislikes}
              </span>
              <button
                onClick={() => handleVote('dislike', 'question', question._id)}
                className={`p-2 rounded-lg transition-all ${question.user_vote === 'dislike'
                    ? 'bg-red-100 text-red-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                <ThumbsDown className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{question.title}</h1>

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {question.views} views
                </span>
                <span>asked {formatDistanceToNow(question.created_at)}</span>
              </div>

              <div className="prose max-w-none mb-6">
                <p className="text-gray-700 whitespace-pre-wrap">{question.description}</p>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {/* FIX 1: Use optional chaining on question.tags before map */}
                {question.tags?.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-sm font-medium"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">asked by</span>
                  <span className="text-sm font-medium text-gray-900">
                    {question.author_id?.display_name}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Trophy className="w-3 h-3 text-yellow-500" />
                    {question.author_id?.reputation}
                  </span>
                </div>
                {!commentTarget && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setCommentTarget({ type: 'question', id: question._id })}
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Add Comment
                  </Button>
                )}
              </div>

              {/* FIX 2: Use optional chaining on questionComments before length check */}
              {questionComments?.length > 0 && (
                <div className="mt-4 space-y-2">
                  {/* Since we checked length > 0, we can safely map */}
                  {questionComments.map((comment) => (
                    <div key={comment.id} className="pl-4 border-l-2 border-gray-300">
                      <p className="text-sm text-gray-700">{comment.content}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <span className="font-medium">{comment.author_id?.display_name}</span>
                        <span>{formatDistanceToNow(comment.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {commentTarget?.type === 'question' && commentTarget.id === question._id && (
                <form onSubmit={handlePostComment} className="mt-4">
                  <Textarea
                    placeholder="Add a comment..."
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    rows={2}
                  />
                  <div className="flex gap-2 mt-2">
                    <Button type="submit" size="sm">Post Comment</Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setCommentTarget(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </Card>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
          </h2>

          <div className="space-y-4">
            {answers.map((answer) => (
              <Card key={answer.id} className="p-6">
                <div className="flex gap-6">
                  <div className="flex flex-col items-center gap-3 min-w-[60px]">
                    <button
                      onClick={() => handleVote('like', 'answer', answer._id)}
                      className={`p-2 rounded-lg transition-all ${answer.user_vote === 'like'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                      <ThumbsUp className="w-5 h-5" />
                    </button>
                    <span className="text-lg font-bold text-gray-900">
                      {answer.vote_likes - answer.vote_dislikes}
                    </span>
                    <button
                      onClick={() => handleVote('dislike', 'answer', answer._id)}
                      className={`p-2 rounded-lg transition-all ${answer.user_vote === 'dislike'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                      <ThumbsDown className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex-1">
                    <p className="text-gray-700 whitespace-pre-wrap mb-4">{answer.content}</p>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">answered by</span>
                        <span className="text-sm font-medium text-gray-900">
                          {answer.author_id?.display_name}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Trophy className="w-3 h-3 text-yellow-500" />
                          {answer.author_id?.reputation}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(answer.created_at)}
                        </span>
                      </div>
                      {!commentTarget && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setCommentTarget({ type: 'answer', id: answer._id })}
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Add Comment
                        </Button>
                      )}
                    </div>

                    {/* FIX 3: Use optional chaining on answer.comments before length check */}
                    {answer.comments && answer.comments.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {answer.comments.map((comment) => (
                          <div key={comment.id} className="pl-4 border-l-2 border-gray-300">
                            <p className="text-sm text-gray-700">{comment.content}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                              <span className="font-medium">
                                {comment.author_id?.display_name}
                              </span>
                              <span>{formatDistanceToNow(comment.created_at)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {commentTarget?.type === 'answer' && commentTarget.id === answer._id && (
                      <form onSubmit={handlePostComment} className="mt-4">
                        <Textarea
                          placeholder="Add a comment..."
                          value={commentContent}
                          onChange={(e) => setCommentContent(e.target.value)}
                          rows={2}
                        />
                        <div className="flex gap-2 mt-2">
                          <Button type="submit" size="sm">Post Comment</Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setCommentTarget(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {user && (
          <Card className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Answer</h3>
            <form onSubmit={handlePostAnswer}>
              <Textarea
                placeholder="Write your answer..."
                value={answerContent}
                onChange={(e) => setAnswerContent(e.target.value)}
                rows={6}
                required
              />
              <Button type="submit" className="mt-4">
                Post Answer
              </Button>
            </form>
          </Card>
        )}

        {!user && (
          <Card className="p-6 text-center">
            <p className="text-gray-600 mb-4">Login to post an answer</p>
            <Button onClick={() => navigate('/login')}>Sign In</Button>
          </Card>
        )}
      </div>
    </div>
  );
};