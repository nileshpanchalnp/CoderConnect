import { useEffect, useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, Eye, Tag, Trophy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Question, Answer, Comment } from '../lib/supabase';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Textarea } from '../components/Input';
import { formatDistanceToNow } from '../utils/date';

interface QuestionDetailProps {
  questionId: string;
  onNavigate: (page: string) => void;
}

interface QuestionWithDetails extends Question {
  tags: { name: string }[];
  vote_likes: number;
  vote_dislikes: number;
  user_vote?: 'like' | 'dislike' | null;
}

interface AnswerWithDetails extends Answer {
  vote_likes: number;
  vote_dislikes: number;
  user_vote?: 'like' | 'dislike' | null;
  comments: Comment[];
}

export const QuestionDetail = ({ questionId, onNavigate }: QuestionDetailProps) => {
  const { user, profile } = useAuth();
  const [question, setQuestion] = useState<QuestionWithDetails | null>(null);
  const [answers, setAnswers] = useState<AnswerWithDetails[]>([]);
  const [questionComments, setQuestionComments] = useState<Comment[]>([]);
  const [answerContent, setAnswerContent] = useState('');
  const [commentContent, setCommentContent] = useState('');
  const [commentTarget, setCommentTarget] = useState<{ type: 'question' | 'answer'; id: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuestion();
    incrementViews();
  }, [questionId]);

  const incrementViews = async () => {
    await supabase.rpc('increment', { row_id: questionId });

    const { error } = await supabase
      .from('questions')
      .update({ views: supabase.raw('views + 1') })
      .eq('id', questionId);

    if (!error) {
      console.log('View incremented');
    }
  };

  const loadQuestion = async () => {
    setLoading(true);
    try {
      const { data: questionData, error: questionError } = await supabase
        .from('questions')
        .select('*, profiles (*)')
        .eq('id', questionId)
        .single();

      if (questionError) throw questionError;

      const { data: tags } = await supabase
        .from('question_tags')
        .select('tags (name)')
        .eq('question_id', questionId);

      const { data: votes } = await supabase
        .from('votes')
        .select('vote_type, user_id')
        .eq('question_id', questionId);

      const voteLikes = votes?.filter((v) => v.vote_type === 'like').length || 0;
      const voteDislikes = votes?.filter((v) => v.vote_type === 'dislike').length || 0;
      const userVote = user ? votes?.find((v) => v.user_id === user.id)?.vote_type : null;

      setQuestion({
        ...questionData,
        tags: tags?.map((t: { tags: { name: string } }) => ({ name: t.tags.name })) || [],
        vote_likes: voteLikes,
        vote_dislikes: voteDislikes,
        user_vote: userVote as 'like' | 'dislike' | null,
      });

      const { data: commentsData } = await supabase
        .from('comments')
        .select('*, profiles (*)')
        .eq('question_id', questionId)
        .order('created_at', { ascending: true });

      setQuestionComments(commentsData || []);

      const { data: answersData } = await supabase
        .from('answers')
        .select('*, profiles (*)')
        .eq('question_id', questionId)
        .order('created_at', { ascending: false });

      const answersWithDetails = await Promise.all(
        (answersData || []).map(async (answer) => {
          const { data: answerVotes } = await supabase
            .from('votes')
            .select('vote_type, user_id')
            .eq('answer_id', answer.id);

          const answerLikes = answerVotes?.filter((v) => v.vote_type === 'like').length || 0;
          const answerDislikes = answerVotes?.filter((v) => v.vote_type === 'dislike').length || 0;
          const answerUserVote = user ? answerVotes?.find((v) => v.user_id === user.id)?.vote_type : null;

          const { data: answerComments } = await supabase
            .from('comments')
            .select('*, profiles (*)')
            .eq('answer_id', answer.id)
            .order('created_at', { ascending: true });

          return {
            ...answer,
            vote_likes: answerLikes,
            vote_dislikes: answerDislikes,
            user_vote: answerUserVote as 'like' | 'dislike' | null,
            comments: answerComments || [],
          };
        })
      );

      setAnswers(answersWithDetails);
    } catch (error) {
      console.error('Error loading question:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (type: 'like' | 'dislike', targetType: 'question' | 'answer', targetId: string) => {
    if (!user) {
      onNavigate('login');
      return;
    }

    const voteData = {
      user_id: user.id,
      vote_type: type,
      ...(targetType === 'question' ? { question_id: targetId } : { answer_id: targetId }),
    };

    const { data: existingVote } = await supabase
      .from('votes')
      .select('*')
      .eq('user_id', user.id)
      .eq(targetType === 'question' ? 'question_id' : 'answer_id', targetId)
      .maybeSingle();

    if (existingVote) {
      if (existingVote.vote_type === type) {
        await supabase.from('votes').delete().eq('id', existingVote.id);
      } else {
        await supabase.from('votes').update({ vote_type: type }).eq('id', existingVote.id);
      }
    } else {
      await supabase.from('votes').insert(voteData);
    }

    loadQuestion();
  };

  const handlePostAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !answerContent.trim()) return;

    const { error } = await supabase.from('answers').insert({
      question_id: questionId,
      author_id: user.id,
      content: answerContent.trim(),
    });

    if (!error) {
      setAnswerContent('');
      loadQuestion();
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !commentContent.trim() || !commentTarget) return;

    const commentData = {
      content: commentContent.trim(),
      author_id: user.id,
      ...(commentTarget.type === 'question'
        ? { question_id: commentTarget.id }
        : { answer_id: commentTarget.id }),
    };

    const { error } = await supabase.from('comments').insert(commentData);

    if (!error) {
      setCommentContent('');
      setCommentTarget(null);
      loadQuestion();
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
                onClick={() => handleVote('like', 'question', question.id)}
                className={`p-2 rounded-lg transition-all ${
                  question.user_vote === 'like'
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
                onClick={() => handleVote('dislike', 'question', question.id)}
                className={`p-2 rounded-lg transition-all ${
                  question.user_vote === 'dislike'
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

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">asked by</span>
                  <span className="text-sm font-medium text-gray-900">
                    {question.profiles?.display_name}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Trophy className="w-3 h-3 text-yellow-500" />
                    {question.profiles?.reputation}
                  </span>
                </div>
                {!commentTarget && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setCommentTarget({ type: 'question', id: question.id })}
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Add Comment
                  </Button>
                )}
              </div>

              {questionComments.length > 0 && (
                <div className="mt-4 space-y-2">
                  {questionComments.map((comment) => (
                    <div key={comment.id} className="pl-4 border-l-2 border-gray-300">
                      <p className="text-sm text-gray-700">{comment.content}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <span className="font-medium">{comment.profiles?.display_name}</span>
                        <span>{formatDistanceToNow(comment.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {commentTarget?.type === 'question' && commentTarget.id === question.id && (
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
                      onClick={() => handleVote('like', 'answer', answer.id)}
                      className={`p-2 rounded-lg transition-all ${
                        answer.user_vote === 'like'
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
                      onClick={() => handleVote('dislike', 'answer', answer.id)}
                      className={`p-2 rounded-lg transition-all ${
                        answer.user_vote === 'dislike'
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
                          {answer.profiles?.display_name}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Trophy className="w-3 h-3 text-yellow-500" />
                          {answer.profiles?.reputation}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(answer.created_at)}
                        </span>
                      </div>
                      {!commentTarget && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setCommentTarget({ type: 'answer', id: answer.id })}
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Add Comment
                        </Button>
                      )}
                    </div>

                    {answer.comments.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {answer.comments.map((comment) => (
                          <div key={comment.id} className="pl-4 border-l-2 border-gray-300">
                            <p className="text-sm text-gray-700">{comment.content}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                              <span className="font-medium">
                                {comment.profiles?.display_name}
                              </span>
                              <span>{formatDistanceToNow(comment.created_at)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {commentTarget?.type === 'answer' && commentTarget.id === answer.id && (
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
            <Button onClick={() => onNavigate('login')}>Sign In</Button>
          </Card>
        )}
      </div>
    </div>
  );
};
