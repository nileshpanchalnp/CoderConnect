import { useEffect, useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, Eye, Tag, Trophy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { Question, Answer, Comment, Profile } from '../lib/supabase';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Textarea } from '../components/Input';
import { formatDistanceToNow } from '../utils/date';
import axios from 'axios';
import { Server } from '../Utills/Server';
import { useNavigate, useParams } from 'react-router-dom';

interface QuestionDetailProps {
  onNavigate: (page: string) => void;
}

interface QuestionWithDetails extends Question {
  _id: string;
  tags?: { name: string }[];
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
  comments?: Comment[]; 
  author_id?: Profile;
}

export const QuestionDetail = ({ }: QuestionDetailProps) => {
  const navigate = useNavigate();
  const { _id } = useParams();
  const { user } = useAuth();
  const [question, setQuestion] = useState<QuestionWithDetails | null>(null);
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
      setQuestion(res.data.question || null);
      console.log("Question data:", res.data.question);
      setQuestionComments(res.data.questionComments || []); 
      setAnswers(res.data.answers || []); 
    } catch (error) {
      console.error("Error loading question:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (type: 'like' | 'dislike', targetType: 'question' | 'answer', _id: string) => {
    if (!user) {
      toast.error('Please log in before voting.');
      return;
    }

    let url: string;
    if (targetType === 'question') {
      url = Server + `Vote/question/${_id}`;
    } else {
      url = Server + `Vote/answer/${_id}`;
    }

    try {
      await axios.post(url, {
        vote_type: type,
      });

      // 3. Refresh data
      // This function must be called to re-fetch the question/answers 
      // to update the vote counts and user's current vote status on the UI.
      loadQuestion();

    } catch (error) {
      console.error(`Error voting on ${targetType}:`, error);
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
    toast.success('Answer Create successful!');
    setAnswerContent("");
    loadQuestion();
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in before Comment.');
      return;
    }
    if (!user || !commentContent.trim() || !commentTarget) return;

    const content = commentContent.trim();
    const targetId = commentTarget.id;

    let url: string;
    let data: { content: string; author_id: string };


    if (commentTarget.type === 'question') {
      url = Server + `CommentQuestion/create/${targetId}`;
    } else {
      url = Server + `CommnetAnswer/create/${targetId}`;
    }

    data = {
      content: content,
      author_id: user.id
    };

    try {
      // 2. Use axios to post the data to the specific backend endpoint
      await axios.post(url, data);

      // 3. Clear state and reload data on success
      setCommentContent('');
      setCommentTarget(null);
      toast.success('comment Create successful!');
      loadQuestion();

    } catch (error) {
      console.error("Error posting comment:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 p-4">
        <div className="max-w-7xl mx-auto pt-4">
          <div className="flex items-center justify-center w-full h-screen bg-white/50 backdrop-blur-sm">

            {/* WRAPPER: Use flex-col to stack items vertically and center them */}
            <div className="flex flex-col items-center">

              {/* Spinner Container */}
              <div className="relative">
                {/* Outer Ring */}
                <div className="animate-spin h-20 w-20 rounded-full border-[6px] border-gray-300 border-t-blue-600"></div>

                {/* Glowing Center Dot */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-6 w-6 bg-blue-600 rounded-full animate-pulse shadow-[0_0_20px_4px_rgba(37,99,235,0.6)]"></div>
                </div>
              </div>

              {/* Text Container - No longer absolute. Used margin-top (mt-8) for spacing */}
              <div className="mt-8 text-sm font-semibold text-gray-600 animate-bounce text-center">
                Loading questions...
              </div>

            </div>

          </div>
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
                <span>asked {formatDistanceToNow(question.createdAt)}</span>
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
                    {tag.name}
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


              {questionComments?.length > 0 && (
                <div className="mt-4 space-y-2">
                  {questionComments.map((comment) => (
                    <div key={comment.id} className="pl-4 border-l-2 border-gray-300">
                      <p className="text-sm text-gray-700">{comment.content}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <span className="font-medium">{comment.author_id?.display_name}</span>
                        <span>{formatDistanceToNow(comment.createdAt)}</span>
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
                          {formatDistanceToNow(answer.createdAt)}
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
                              <span>{formatDistanceToNow(comment.createdAt)}</span>
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