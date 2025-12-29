
export interface SubQuestion {
  id: string;
  label: string; // e.g., "(a)"
  text: string;
  marks: string; // e.g., "7"
  isDone: boolean;
}

export interface Question {
  id: string;
  number: string; // e.g., "5"
  subQuestions: SubQuestion[];
}

export interface SemesterGroup {
  id: string;
  title: string; // e.g., "S25"
  questions: Question[];
}

export interface LinkEdge {
  id: string;
  from: string;
  to: string;
  visual: {
    style: 'solid' | 'dotted';
    color: string;
  };
  sync: boolean; // Functional synchronization flag
}

export interface FormattedData {
  semesters: SemesterGroup[];
  links: LinkEdge[];
}
