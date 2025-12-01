import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
  MessageSquare,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Tag,
  ChevronLeft,
  ChevronRight, 
} from 'lucide-react';
import { Card } from '../components/Card';
import { formatDistanceToNow } from '../utils/date';
import { Server } from '../Utills/Server';
import { useNavigate } from 'react-router-dom';

// --- PAGINATION HELPER LOGIC (Added) ---
export const DOTS = '...';

const range = (start: number, end: number) => {
  let length = end - start + 1;
  return Array.from({ length }, (_, idx) => idx + start);
};

interface PaginationHookProps {
  totalPages: number;
  siblingCount?: number;
  currentPage: number;
}

export const usePagination = ({
  totalPages,
  siblingCount = 1, // Number of pages to show on each side of the current page
  currentPage,
}: PaginationHookProps) => {
  const paginationRange = useMemo(() => {
    // Pages to show: 1 (first) + 1 (last) + 1 (current) + 2*siblings + 2 (dots)
    const totalPageNumbers = siblingCount + 5;
    // Case 1: If total pages is less than what we want to show, just show all.
    if (totalPageNumbers >= totalPages) {
      return range(1, totalPages);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(
      currentPage + siblingCount,
      totalPages
    );

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

    const firstPageIndex = 1;
    const lastPageIndex = totalPages;

    // Case 2: No left dots, but right dots
    if (!shouldShowLeftDots && shouldShowRightDots) {
      let leftItemCount = 3 + 2 * siblingCount;
      let leftRange = range(1, leftItemCount);
      return [...leftRange, DOTS, totalPages];
    }
    // Case 3: Left dots, but no right dots
    if (shouldShowLeftDots && !shouldShowRightDots) {
      let rightItemCount = 3 + 2 * siblingCount;
      let rightRange = range(totalPages - rightItemCount + 1, totalPages);
      return [firstPageIndex, DOTS, ...rightRange];
    }

    // Case 4: Both left and right dots
    if (shouldShowLeftDots && shouldShowRightDots) {
      let middleRange = range(leftSiblingIndex, rightSiblingIndex);
      return [firstPageIndex, DOTS, ...middleRange, DOTS, lastPageIndex];
    }
    // Fallback (shouldn't be reached)
    return range(1, totalPages);
  }, [totalPages, siblingCount, currentPage]);

  return paginationRange;
};

interface DashboardProps {
  onNavigate: (page: string, id?: string) => void;
  searchQuery?: string;
  filterMode?: 'search' | 'tag' | null;
}

interface QuestionWithStats {
  views: number;
  id: String;
  _id: string;
  title: string;
  description: string;
  createdAt: string;
  author_id: { username: string; display_name: string; reputation: number };
  answer_count: number;
  vote_likes: number;
  vote_dislikes: number;
  tags: { name: string }[];
}

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (size: number) => void;
}

const PaginationControls = ({
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}: PaginationControlsProps) => {
  // Use the new hook
  const paginationRange = usePagination({
    currentPage,
    totalPages,
    siblingCount: 1, 
  });

  if (totalPages <= 1) {
    return null; 
  }

  const handleNext = () => {
    onPageChange(currentPage + 1);
  };

  const handlePrevious = () => {
    onPageChange(currentPage - 1);
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 py-4">
      {/* Items per page selector */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <label htmlFor="itemsPerPage" className="font-medium">
          Show:
        </label>
        <select
          id="itemsPerPage"
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          className="px-2 py-1 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value={3}>3</option>
          <option value={5}>5</option>
          <option value={10}>10</option>
        </select>
        <span className="hidden sm:inline">per page</span>
      </div>

      {/* Pagination navigation */}
      <nav aria-label="Pagination">
        <ul className="flex items-center gap-1">
          {/* Previous Button */}
          <li>
            <button
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className="flex items-center justify-center h-9 w-9 rounded-md bg-white text-gray-600 shadow-sm border border-gray-200 enabled:hover:bg-cyan-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Go to previous page"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </li>

          {/* Page Number Buttons */}
          {paginationRange?.map((pageNumber, index) => {
            // If it's the DOTS (...)
            if (pageNumber === DOTS) {
              return (
                <li
                  key={index}
                  className="flex items-end justify-center h-9 w-9 text-gray-500"
                >
                  &#8230;
                </li>
              );
            }

            // If it's a page number
            const isActive = pageNumber === currentPage;
            return (
              <li key={index}>
                <button
                  onClick={() => onPageChange(pageNumber as number)}
                  className={`flex items-center justify-center h-9 w-9 rounded-md font-medium text-sm transition-colors
                    ${isActive
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'bg-white text-gray-600 shadow-sm border border-gray-200 hover:bg-cyan-50'
                    }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {pageNumber}
                </button>
              </li>
            );
          })}

          {/* Next Button */}
          <li>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="flex items-center justify-center h-9 w-9 rounded-md bg-white text-gray-600 shadow-sm border border-gray-200 enabled:hover:bg-cyan-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Go to next page"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export const Dashboard = ({ searchQuery, filterMode }: DashboardProps) => {
  const navigate = useNavigate();

  const [allQuestions, setAllQuestions] = useState<QuestionWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(3); 

  useEffect(() => {
    const loadQuestions = async () => {
      setLoading(true);
      try {
        const response = await axios.get(Server + `question/getAll`, {
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
        });
        const data = response.data.questions || [];
        console.log('Fetched questions:', data);
        setAllQuestions(data); 
      } catch (error) {
        console.error('Error loading questions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, []); 

  const filteredQuestions = useMemo(() => {
    let data: QuestionWithStats[] = [...allQuestions];

    if (filterMode === 'tag' && searchQuery) {
      const tagQuery = searchQuery.toLowerCase();
      data = data.filter((item) =>
        item.tags?.some((t) => t.name.toLowerCase() === tagQuery)
      );
    } else if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q)
      );
    }

    data.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return data;
  }, [allQuestions, searchQuery, filterMode]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterMode, itemsPerPage]);

  const paginatedQuestions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredQuestions.slice(startIndex, endIndex);
  }, [filteredQuestions, currentPage, itemsPerPage]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredQuestions.length / itemsPerPage)
  );

  const handleQuestionClick = (_id: string) => {
    navigate(`/question/${_id}`);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (size: number) => {
    setItemsPerPage(size);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 p-4">
        <div className="max-w-7xl mx-auto pt-4">
        <div className="flex items-center justify-center w-full h-screen bg-white/50 backdrop-blur-sm">
       <div className="relative">
       {/* Outer Ring */}
         <div className="animate-spin h-20 w-20 rounded-full border-[6px] border-gray-300 border-t-blue-600"></div>

        {/* Glowing Center Dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-6 w-6 bg-blue-600 rounded-full animate-pulse shadow-[0_0_20px_4px_rgba(37,99,235,0.6)]"></div>
       </div>

       {/* Floating Text */}
         <div className="absolute -bottom-10 w-full text-center text-sm font-semibold text-gray-600 animate-bounce">
           Loading questions...
         </div>
      </div>
     </div>;
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto pt-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              All Questions
            </h1>
            <p className="text-gray-600">
              {filteredQuestions.length} questions
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {filteredQuestions.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-600">
                {searchQuery
                  ? 'No questions found matching your search.'
                  : 'No questions yet. Be the first to ask!'}
              </p>
            </Card>
          ) : (
            paginatedQuestions.map((question) => (
              <Card key={question._id}>
                <div
                  className="p-6 cursor-pointer hover:shadow-md transition-all rounded-2xl"
                   onClick={() => handleQuestionClick(question._id)}
                >
                  <div className="flex gap-6">

                    {/* Stats */}
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
                      <h2
                       
                        className="text-xl font-semibold text-gray-900 mb-2 hover:text-cyan-600 transition-colors"
                      >
                        {question.title}
                      </h2>

                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {question.description.substring(0, 200)}…
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
                          asked by{" "}
                          <span className="font-medium text-gray-700">
                            {question.author_id?.display_name}
                          </span>
                        </span>
                        <span>{formatDistanceToNow(question.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

            ))
          )}
        </div>

        {/* Only show pagination if there are questions */}
        {filteredQuestions.length > 0 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        )}
      </div>
    </div>
  );
};