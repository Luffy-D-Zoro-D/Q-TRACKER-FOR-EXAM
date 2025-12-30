
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
  fontSize?: number;
  showFrequency?: boolean;
  questionGap?: number;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  linkingId,
  onCopySub,
  onDoneSub,
  onLinkToggle,
  registerRef,
  compactMode = false,
  questionFrequency = 1,
  fontSize = 13,
  showFrequency = true,
  questionGap = 8
}) => {
  const { number, subQuestions, id: qId } = question;

  // Derived sizes
  const markSize = Math.max(9, fontSize - 3);
  const labelSize = Math.max(10, fontSize - 2);
  const actionSize = Math.max(12, fontSize - 1);

  // Compact mode rendering
  if (compactMode) {
    return (
      <div className="relative group/q">
        <div className="flex items-start gap-3">
          <span className="text-xs font-black text-gray-300 mt-0.5 min-w-[24px]" style={{ fontSize: `${labelSize}px` }}>{number}.</span>
          <div className="flex-grow flex flex-col" style={{ gap: `${questionGap}px` }}>
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

                <div className={`group/item flex items-start gap-3 transition-all duration-300 ${sq.isDone ? 'opacity-30 grayscale' : ''}`}>
                  <span className="text-xs font-bold text-gray-400 w-4 mt-0.5" style={{ fontSize: `${labelSize}px` }}>{sq.label.replace(/[()]/g, '')}</span>

                  <p className="leading-snug flex-grow font-medium text-gray-700 select-none" style={{ fontSize: `${fontSize}px` }}>
                    {sq.text}
                  </p>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Frequency Badge */}
                    {showFrequency && questionFrequency > 1 && (
                      <span className={`px-1.5 py-0.5 rounded font-black`} style={{ fontSize: `${markSize - 1}px`, backgroundColor: questionFrequency >= 4 ? '#FEE2E2' : questionFrequency >= 3 ? '#FFEDD5' : '#FEF9C3', color: questionFrequency >= 4 ? '#DC2626' : questionFrequency >= 3 ? '#EA580C' : '#CA8A04' }} title={`Asked ${questionFrequency} times`}>
                        {questionFrequency >= 4 ? '🔥' : questionFrequency >= 3 ? '⚡' : '⭐'}
                      </span>
                    )}

                    {/* Marks Badge */}
                    <span className="px-2 py-0.5 font-black bg-blue-50 text-blue-600 rounded border border-blue-200" style={{ fontSize: `${markSize}px` }}>
                      {sq.marks.replace(/[()]/g, '')}M
                    </span>

                    {/* Action Buttons - Compact */}
                    <div className="flex items-center gap-1 transition-opacity">
                      <button onClick={() => onLinkToggle(sq.id)} className={`p-1 rounded-lg transition-all border ${linkingId === sq.id ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'text-blue-500 bg-blue-50/50 border-blue-100/50 hover:bg-blue-100 hover:text-blue-700'}`} style={{ width: `${actionSize + 10}px`, height: `${actionSize + 10}px` }} title="Link">
                        <svg style={{ width: `${actionSize}px`, height: `${actionSize}px` }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.826L10.242 9.242M10.172 13.828a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656" /></svg>
                      </button>
                      <button onClick={() => onCopySub(sq)} className="p-1 text-gray-500 bg-gray-50/80 border border-gray-100 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all" style={{ width: `${actionSize + 10}px`, height: `${actionSize + 10}px` }} title="Copy">
                        <svg style={{ width: `${actionSize}px`, height: `${actionSize}px` }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                      </button>
                      <button onClick={() => onDoneSub(qId, sq.id)} className={`p-1 border rounded-lg transition-all ${sq.isDone ? 'bg-green-600 text-white border-green-600 shadow-sm' : 'text-green-600 bg-green-50/80 border-green-200/50 hover:bg-green-100 hover:text-green-800'}`} style={{ width: `${actionSize + 10}px`, height: `${actionSize + 10}px` }} title="Done">
                        <svg style={{ width: `${actionSize}px`, height: `${actionSize}px` }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
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
        <span className="text-lg font-black text-gray-200 mt-1 min-w-[28px]" style={{ fontSize: `${fontSize + 2}px` }}>{number}.</span>
        <div className="flex-grow flex flex-col" style={{ gap: `${questionGap * 2}px` }}>
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
                <span className="text-base font-semibold text-gray-400 w-5 mt-0.5 text-center" style={{ fontSize: `${labelSize + 2}px` }}>{sq.label.replace(/[()]/g, '')}</span>
                <p className="leading-relaxed flex-grow font-medium text-gray-700 select-none" style={{ fontSize: `${fontSize + 2}px` }}>
                  {sq.text}
                </p>

                <div className="flex items-center gap-6 flex-shrink-0">
                  <span className="font-bold text-gray-400 mt-1 w-6 text-right" style={{ fontSize: `${markSize + 2}px` }}>{sq.marks.replace(/[()]/g, '')}</span>

                  <div className="flex items-center gap-2 transition-opacity">
                    <button onClick={() => onLinkToggle(sq.id)} className={`p-2 rounded-xl transition-all border ${linkingId === sq.id ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'text-blue-500 bg-blue-50 border-blue-100/50 hover:bg-blue-100 hover:text-blue-700'}`} style={{ width: `${actionSize + 16}px`, height: `${actionSize + 16}px` }}>
                      <svg style={{ width: `${actionSize + 6}px`, height: `${actionSize + 6}px` }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.826L10.242 9.242M10.172 13.828a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656" /></svg>
                    </button>
                    <button onClick={() => onCopySub(sq)} className="p-2 text-gray-500 bg-gray-50 border border-gray-100 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all" style={{ width: `${actionSize + 16}px`, height: `${actionSize + 16}px` }}>
                      <svg style={{ width: `${actionSize + 6}px`, height: `${actionSize + 6}px` }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                    </button>
                    <button onClick={() => onDoneSub(qId, sq.id)} className={`p-2 border rounded-xl transition-all ${sq.isDone ? 'bg-green-600 text-white border-green-600 shadow-md' : 'text-green-600 bg-green-50 border-green-200/50 hover:bg-green-100 hover:text-green-800'}`} style={{ width: `${actionSize + 16}px`, height: `${actionSize + 16}px` }}>
                      <svg style={{ width: `${actionSize + 6}px`, height: `${actionSize + 6}px` }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
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
