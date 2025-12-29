
import React, { useState, useEffect, useCallback } from 'react';
import { parsePYQText } from './services/geminiService';
import { SemesterGroup, SubQuestion } from './types';
import QuestionCard from './components/QuestionCard';
import { dummyData } from './data/dummyData';

const STORAGE_KEY = 'pyq_study_v2_data';

const App: React.FC = () => {
  const [rawText, setRawText] = useState('');
  const [data, setData] = useState<SemesterGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInput, setShowInput] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setData(parsed);
        if (parsed.length > 0) setShowInput(false);
      } catch (e) {
        console.error("Error loading saved data", e);
      }
    }
  }, []);

  useEffect(() => {
    if (data.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data]);

  const handleFormat = async () => {
    if (!rawText.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const formatted = await parsePYQText(rawText);
      setData(formatted.semesters);
      setShowInput(false);
    } catch (err: any) {
      console.error('API Error:', err);
      // Load dummy data as fallback when API fails
      setData(dummyData.semesters);
      setShowInput(false);
      setError('API unavailable. Showing sample data instead.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySub = useCallback((sq: SubQuestion) => {
    const textToCopy = `next q - ${sq.text}`;
    navigator.clipboard.writeText(textToCopy);
  }, []);

  const handleDoneSub = useCallback((qId: string, sqId: string) => {
    setData(prev => prev.map(sem => ({
      ...sem,
      questions: sem.questions.map(q => {
        if (q.id === qId) {
          return {
            ...q,
            subQuestions: q.subQuestions.map(sq =>
              sq.id === sqId ? { ...sq, isDone: true } : sq
            )
          };
        }
        return q;
      })
    })));
  }, []);

  const clearAll = () => {
    if (window.confirm('Clear all?')) {
      setData([]);
      setRawText('');
      setShowInput(true);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const doneCount = data.flatMap(s => s.questions.flatMap(q => q.subQuestions)).filter(sq => sq.isDone).length;
  const totalCount = data.flatMap(s => s.questions.flatMap(q => q.subQuestions)).length;

  return (
    <div className="w-full h-screen bg-[#FDFDFD] p-2 flex flex-col overflow-hidden">
      {/* Mini Controls Bar */}
      <div className="w-full max-w-xl mx-auto flex justify-between items-center mb-2 px-1">
        <div className="flex items-center gap-3">
          <span className="text-xs font-black tracking-tighter uppercase text-gray-400">Tracker</span>
          {totalCount > 0 && (
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded-full">
              {doneCount}/{totalCount} Done
            </span>
          )}
        </div>
        <div className="flex gap-4">
          {!showInput && (
            <button onClick={() => setShowInput(true)} className="text-[9px] font-black text-blue-500 hover:text-blue-700 uppercase tracking-widest transition-colors">
              + Add
            </button>
          )}
          {data.length > 0 && (
            <button onClick={clearAll} className="text-[9px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest transition-colors">
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Input Area */}
      {showInput && (
        <div className="mb-4 w-full max-w-lg mx-auto bg-white p-3 rounded border border-gray-200 shadow-sm animate-in fade-in slide-in-from-top-1">
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste raw text here..."
            className="w-full h-20 p-2 border border-gray-200 rounded text-[11px] focus:ring-1 focus:ring-yellow-400 outline-none resize-none bg-gray-50 mb-2"
          />
          <button
            onClick={handleFormat}
            disabled={isLoading || !rawText.trim()}
            className="w-full py-2 rounded font-black text-[10px] uppercase tracking-wider bg-yellow-400 text-gray-900 hover:bg-yellow-500 active:scale-[0.98] disabled:opacity-30 transition-all shadow-sm"
          >
            {isLoading ? 'Processing...' : 'Format Now'}
          </button>
          {error && <p className="mt-1 text-[8px] text-red-500 font-bold text-center uppercase">{error}</p>}
        </div>
      )}

      {/* Vertical List Display */}
      <main className="flex-grow overflow-y-auto w-full px-1">
        {data.length > 0 ? (
          <div className="w-full max-w-xl mx-auto space-y-4">
            {data.map((semester) => (
              <div key={semester.id} className="bg-[#FFF8D6] rounded-md p-3 border-b-2 border-yellow-200 flex flex-col">
                <div className="flex justify-between items-center mb-2 pb-1 border-b border-yellow-300/40">
                  <h2 className="text-sm font-black text-gray-800 italic uppercase">
                    {semester.title}
                  </h2>
                  <span className="text-[8px] font-bold text-yellow-600">
                    {Math.round((semester.questions.flatMap(q => q.subQuestions).filter(sq => sq.isDone).length / semester.questions.flatMap(q => q.subQuestions).length) * 100)}% Complete
                  </span>
                </div>

                <div className="space-y-2">
                  {semester.questions.map((q, idx) => (
                    <React.Fragment key={q.id}>
                      <QuestionCard
                        question={q}
                        onCopySub={handleCopySub}
                        onDoneSub={handleDoneSub}
                      />
                      {idx < semester.questions.length - 1 && (
                        <div className="flex items-center justify-center py-1">
                          <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest bg-yellow-300/20 px-4 rounded">OR</span>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : !isLoading && !showInput && (
          <div className="flex flex-col items-center justify-center h-full text-gray-300">
            <p className="text-[10px] font-black uppercase tracking-widest">Empty</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
