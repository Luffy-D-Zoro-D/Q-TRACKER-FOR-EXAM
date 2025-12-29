
import React from 'react';
import { Question, SubQuestion } from '../types';

interface QuestionCardProps {
  question: Question;
  linkingId: string | null;
  onCopySub: (sq: SubQuestion) => void;
  onDoneSub: (qId: string, sqId: string) => void;
  onLinkToggle: (sqId: string) => void;
  registerRef: (id: string, el: HTMLElement | null) => void;
  compactMode?: boolean;
  questionFrequency?: number; // How many times this question appears across semesters
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  linkingId,
  onCopySub,
  onDoneSub,
  onLinkToggle,
  registerRef,
  compactMode = false,
  questionFrequency = 1
}) => {
  const { number, subQuestions, id: qId } = question;

  // Compact mode rendering
  if (compactMode) {
    return (
      <div className="relative group/q">
        <div className="flex items-start gap-3">
          <span className="text-sm font-black text-gray-300 mt-0.5 min-w-[24px]">{number}.</span>
          <div className="flex-grow space-y-1">
            {subQuestions.map((sq) => (
              <div
                key={sq.id}
                id={`sq-${sq.id}`}
                ref={(el) => registerRef(sq.id, el)}
                className="relative"
              >
                {sq.isDone && (
                  <div className="absolute -left-3 -right-3 top-1/2 -translate-y-1/2 h-[1px] bg-gray-900 z-10 pointer-events-none rounded-full opacity-40"></div>
                )}

                <div className={`group/item flex items-start gap-3 py-0.5 transition-all duration-300 ${sq.isDone ? 'opacity-30 grayscale' : ''}`}>
                  <span className="text-xs font-bold text-gray-400 w-4 mt-0.5">{sq.label.replace(/[()]/g, '')}</span>

                  <p className="text-[13px] leading-snug flex-grow font-medium text-gray-700 select-none">
                    {sq.text}
                  </p>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Frequency Badge */}
                    {questionFrequency > 1 && (
                      <span className={`px-1.5 py-0.5 text-[9px] font-black rounded ${questionFrequency >= 4 ? 'bg-red-100 text-red-600' :
                        questionFrequency >= 3 ? 'bg-orange-100 text-orange-600' :
                          'bg-yellow-100 text-yellow-600'
                        }`} title={`Asked ${questionFrequency} times`}>
                        {questionFrequency >= 4 ? '🔥' : questionFrequency >= 3 ? '⚡' : '⭐'}
                      </span>
                    )}

                    {/* Marks Badge */}
                    <span className="px-2 py-0.5 text-[10px] font-black bg-blue-50 text-blue-600 rounded border border-blue-200">
                      {sq.marks.replace(/[()]/g, '')}M
                    </span>

                    {/* Action Buttons - Compact */}
                    <div className="flex items-center gap-0.5 transition-opacity">
                      <button onClick={() => onLinkToggle(sq.id)} className={`p-1.5 rounded-lg transition-all ${linkingId === sq.id ? 'bg-blue-500 text-white' : 'text-gray-300 hover:text-blue-500 hover:bg-blue-50'}`} title="Link">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.826L10.242 9.242M10.172 13.828a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656" /></svg>
                      </button>
                      <button onClick={() => onCopySub(sq)} className="p-1.5 text-gray-300 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all" title="Copy">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                      </button>
                      <button onClick={() => onDoneSub(qId, sq.id)} className="p-1.5 text-gray-300 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all" title="Done">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Full mode rendering (original)
  return (
    <div className="relative group/q">
      <div className="flex items-start gap-6">
        <span className="text-lg font-black text-gray-200 mt-1 min-w-[28px]">{number}.</span>
        <div className="flex-grow space-y-5">
          {subQuestions.map((sq) => (
            <div
              key={sq.id}
              id={`sq-${sq.id}`}
              ref={(el) => registerRef(sq.id, el)}
              className="relative"
            >
              {sq.isDone && (
                <div className="absolute -left-4 -right-4 top-1/2 -translate-y-1/2 h-[1px] bg-gray-900 z-10 pointer-events-none rounded-full opacity-60"></div>
              )}

              <div className={`group/item flex items-start gap-6 transition-all duration-300 ${sq.isDone ? 'opacity-25 grayscale' : ''}`}>
                <span className="text-base font-semibold text-gray-400 w-5 mt-0.5 text-center">{sq.label.replace(/[()]/g, '')}</span>
                <p className="text-[16px] leading-relaxed flex-grow font-medium text-gray-700 select-none">
                  {sq.text}
                </p>

                <div className="flex items-center gap-6 flex-shrink-0">
                  <span className="text-[13px] font-bold text-gray-400 mt-1 w-6 text-right">{sq.marks.replace(/[()]/g, '')}</span>

                  <div className="flex items-center gap-1 transition-opacity">
                    <button onClick={() => onLinkToggle(sq.id)} className={`p-2 rounded-xl transition-all ${linkingId === sq.id ? 'bg-blue-500 text-white shadow-md' : 'text-gray-300 hover:text-blue-500 hover:bg-blue-50'}`}>
                      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.826L10.242 9.242M10.172 13.828a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656" /></svg>
                    </button>
                    <button onClick={() => onCopySub(sq)} className="p-2 text-gray-300 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all">
                      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                    </button>
                    <button onClick={() => onDoneSub(qId, sq.id)} className="p-2 text-gray-300 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all">
                      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;
