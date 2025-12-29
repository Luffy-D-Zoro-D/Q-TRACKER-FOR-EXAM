
import React from 'react';
import { Question, SubQuestion } from '../types';

interface QuestionCardProps {
  question: Question;
  linkingId: string | null;
  onCopySub: (sq: SubQuestion) => void;
  onDoneSub: (qId: string, sqId: string) => void;
  onLinkToggle: (sqId: string) => void;
  registerRef: (id: string, el: HTMLElement | null) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ 
  question, 
  linkingId, 
  onCopySub, 
  onDoneSub, 
  onLinkToggle,
  registerRef
}) => {
  const { number, subQuestions, id: qId } = question;

  return (
    <div className="relative group">
      <div className="flex items-start gap-6">
        <span className="text-base font-black text-gray-300 mt-1 min-w-[24px]">{number}.</span>
        <div className="flex-grow space-y-4">
          {subQuestions.map((sq) => (
            <div 
              key={sq.id} 
              id={`sq-${sq.id}`}
              ref={(el) => registerRef(sq.id, el)}
              className="relative"
            >
              {sq.isDone && (
                <div className="absolute -left-3 -right-3 top-1/2 -translate-y-1/2 h-[1px] bg-gray-900 z-10 pointer-events-none rounded-full opacity-60"></div>
              )}

              <div className={`group/item flex items-start gap-6 transition-all duration-300 ${sq.isDone ? 'opacity-25 grayscale' : ''}`}>
                <span className="text-base font-semibold text-gray-400 w-5 mt-0.5">{sq.label.replace(/[()]/g, '')}</span>
                <p className="text-[15px] leading-relaxed flex-grow font-medium text-gray-700 select-none">
                  {sq.text}
                </p>
                
                <div className="flex items-center gap-6 flex-shrink-0">
                  <span className="text-[12px] font-bold text-gray-400 mt-1 w-6 text-right">{sq.marks.replace(/[()]/g, '')}</span>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                    <button onClick={() => onLinkToggle(sq.id)} className={`p-2 rounded-xl transition-all ${linkingId === sq.id ? 'bg-blue-500 text-white shadow-md' : 'text-gray-300 hover:text-blue-500 hover:bg-blue-50'}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.826L10.242 9.242M10.172 13.828a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.102-1.101" /></svg>
                    </button>
                    <button onClick={() => onCopySub(sq)} className="p-2 text-gray-300 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                    </button>
                    <button onClick={() => onDoneSub(qId, sq.id)} className="p-2 text-gray-300 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
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
