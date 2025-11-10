import { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Input, Textarea } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import axios from 'axios';

interface AskQuestionProps {
  onNavigate: (page: string, id?: string) => void;
}

export const AskQuestion = ({ onNavigate }: AskQuestionProps) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Login Required
          </h2>
          <p className="text-gray-600 mb-6">
            You need to be logged in to ask a question.
          </p>
          <Button onClick={() => onNavigate('login')}>Sign In</Button>
        </Card>
      </div>
    );
  }

  const handleTagInput = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 5) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');

  if (!title.trim()) return setError('Please enter a title');
  if (!description.trim()) return setError('Please enter a description');
  if (tags.length === 0) return setError('Please add at least one tag');

  setLoading(true);

  try {
    const res = await axios.post("http://localhost:5000/Question/create", {
      title,
      description,
      tags,
      userId: user.id,   // sending logged in user id
    });

    onNavigate('question', res.data.questionId);
    
  } catch (err: any) {
    setError(err.response?.data?.message || "Failed to create question");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <Card className="p-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent mb-2">
            Ask a Question
          </h1>
          <p className="text-gray-600 mb-8">
            Be specific and clear in your question to get the best answers
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Input
              label="Title"
              placeholder="What's your question? Be specific."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <Textarea
              label="Description"
              placeholder="Provide more details about your question..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={10}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags (max 5)
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-sm font-medium"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-cyan-900"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a tag (press Enter or comma)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInput}
                  onBlur={addTag}
                  disabled={tags.length >= 5}
                  className="flex-1 px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all disabled:opacity-50"
                />
                <Button
                  type="button"
                  onClick={addTag}
                  disabled={tags.length >= 5}
                  variant="secondary"
                >
                  Add
                </Button>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {tags.length}/5 tags added
              </p>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? 'Posting...' : 'Post Question'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onNavigate('dashboard')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
