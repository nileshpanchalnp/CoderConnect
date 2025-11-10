import { useEffect, useState } from 'react';
import { Tag as TagIcon, FileQuestion } from 'lucide-react';
import { supabase, Tag } from '../lib/supabase';
import { Card } from '../components/Card';

interface TagsProps {
  onNavigate: (page: string) => void;
  onTagSelect: (tag: string) => void;
}

interface TagWithCount extends Tag {
  question_count: number;
}

export const Tags = ({ onTagSelect }: TagsProps) => {
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    setLoading(true);
    try {
      const { data: tagsData, error } = await supabase
        .from('tags')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      const tagsWithCount = await Promise.all(
        (tagsData || []).map(async (tag) => {
          const { count } = await supabase
            .from('question_tags')
            .select('*', { count: 'exact', head: true })
            .eq('tag_id', tag.id);

          return {
            ...tag,
            question_count: count || 0,
          };
        })
      );

      setTags(tagsWithCount.filter((t) => t.question_count > 0));
    } catch (error) {
      console.error('Error loading tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTagClick = (tagName: string) => {
    onTagSelect(tagName);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 p-4">
        <div className="max-w-6xl mx-auto pt-8">
          <div className="text-center text-gray-600">Loading tags...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto pt-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tags</h1>
          <p className="text-gray-600">
            Browse questions by tag. Click on a tag to see all related questions.
          </p>
        </div>

        {tags.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600">No tags yet</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tags.map((tag) => (
              <Card
                key={tag.id}
                hover
                className="p-6 cursor-pointer"
                onClick={() => handleTagClick(tag.name)}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
                    <TagIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {tag.name}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <FileQuestion className="w-4 h-4" />
                      <span>{tag.question_count} {tag.question_count === 1 ? 'question' : 'questions'}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
