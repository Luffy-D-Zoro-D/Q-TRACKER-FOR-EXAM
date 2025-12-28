
import React from 'react';
import { Question, SubQuestion } from '../types';

interface QuestionCardProps {
  question: Question;
  onCopySub: (sq: SubQuestion) => void;
  onDoneSub: (qId: string, sqId: string) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, onCopySub, onDoneSub }) => {
  const { number, subQuestions, id: qId } = question;

  return (
    <div className="bg-white rounded border border-gray-100 p-1.5 mb-1 last:mb-0 shadow-sm">
      <div className="flex items-start gap-1.5">
        <div className="flex-shrink-0 pt-0.5">
          <span className="text-[10px] font-bold text-gray-400">{number}.</span>
        </div>

        <div className="flex-grow space-y-1.5">
          {subQuestions.map((sq) => (
            <div key={sq.id} className={`group flex items-start gap-1.5 transition-opacity ${sq.isDone ? 'opacity-25' : ''}`}>
              <span className={`text-[11px] font-bold whitespace-nowrap min-w-[18px] ${sq.isDone ? 'text-gray-300' : 'text-gray-800'}`}>
                {sq.label}
              </span>
              
              <div className="flex-grow min-w-0">
                <div className="flex justify-between items-start gap-1.5">
                  <p className={`text-[11px] leading-tight break-words ${sq.isDone ? 'line-through text-gray-300 italic' : 'text-gray-700'}`}>
                    {sq.text}
                  </p>
                  <span className="text-[8px] font-bold text-gray-400 bg-gray-50 border border-gray-100 rounded px-1">
                    {sq.marks.replace(/[()]/g, '')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-0.5 flex-shrink-0">
                {!sq.isDone ? (
                  <>
                    <button
                      onClick={() => onCopySub(sq)}
                      className="p-1 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDoneSub(qId, sq.id)}
                      className="p-1 text-green-400 hover:text-green-600 hover:bg-green-50 rounded"
                    >
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  </>
                ) : (
                  <svg className="w-2.5 h-2.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;
