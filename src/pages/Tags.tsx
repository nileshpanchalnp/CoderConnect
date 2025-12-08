import { useEffect, useState } from 'react';
import { Tag as TagIcon, FileQuestion, ArrowLeft } from 'lucide-react';
import { Card } from '../components/Card';
import axios from 'axios'; // 1. Import axios
import { Server } from '../Utills/Server';
import { Link } from 'react-router-dom';

// NOTE: Make sure you have your axios base URL and credentials set globally
// in your main app file (like App.tsx or index.tsx)
// axios.defaults.baseURL = 'http://localhost:5000/api'; // Your backend URL
// axios.defaults.withCredentials = true;

interface TagsProps {
  onNavigate: (page: string) => void;
  onTagSelect: (tag: string) => void;
}

// 2. This interface now matches our new API response
interface TagWithCount {
  name: string;
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
      const { data } = await axios.get<TagWithCount[]>(Server +'Question/tags');
      setTags(data);
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
         <div className="flex items-center justify-center w-full h-screen bg-white/50 backdrop-blur-sm">
       <div className="relative">
         {/* Outer Ring */}
         <div className="animate-spin h-20 w-20 rounded-full border-[6px] border-gray-300 border-t-blue-600"></div>

         {/* Glowing Center Dot */}
         <div className="absolute inset-0 flex items-center justify-center">
           <div className="h-6 w-6 bg-blue-600 rounded-full animate-pulse shadow-[0_0_20px_4px_rgba(37,99,235,0.6)]"></div>
         </div>

       {/* Floating Text */}
         <div className="absolute -bottom-10 -translate-x-1/2 w-max text-center text-sm font-semibold text-gray-600 animate-bounce">
           Loading tags...
         </div>
       </div>
     </div>;
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto pt-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tags</h1>
           
          {/* <p className="text-gray-600">
            Browse questions by tag. Click on a tag to see all related questions.
          </p> */}
        </div>
            {/* Back Button */}
        <Link
          to="/"
          className="inline-flex items-center text-gray-600 hover:text-blue-600 mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Questions
        </Link>

        {tags.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600">No tags yet</p>
          </Card>
        ) : (        
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* 6. Update map to use 'tag.name' as the key */}
            {tags.map((tag) => (
              <Card
                key={tag.name} 
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