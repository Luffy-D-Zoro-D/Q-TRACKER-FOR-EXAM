

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { parsePYQText } from './services/geminiService';
import { SemesterGroup, SubQuestion, LinkEdge } from './types';
import QuestionCard from './components/QuestionCard';
import { dummyData } from './data/dummyData';


const STORAGE_KEY = 'pyq_tracker_v15_dynamic';
const SETTINGS_KEY = 'pyq_tracker_settings_v1';
const COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Orange', value: '#F59E0B' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Pink', value: '#EC4899' }
];

function hashCode(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return h;
}

const App: React.FC = () => {
  // State initializers for robust persistence
  const [data, setData] = useState<SemesterGroup[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.data)) return parsed.data;
      } catch (e) { console.error("Data load failed", e); }
    }
    return [];
  });

  const [links, setLinks] = useState<LinkEdge[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.links || [];
      } catch (e) { console.error("Links load failed", e); }
    }
    return [];
  });

  const [history, setHistory] = useState<HistoryState[]>([]);
  const [redoHistory, setRedoHistory] = useState<HistoryState[]>([]);

  const [rawText, setRawText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInput, setShowInput] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return !(Array.isArray(parsed.data) && parsed.data.length > 0);
      } catch (e) { return true; }
    }
    return true;
  });
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [lineCoords, setLineCoords] = useState<any[]>([]);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [compactMode, setCompactMode] = useState(true);

  const [twoColumnLayout, setTwoColumnLayout] = useState(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      try { return JSON.parse(saved).twoColumnLayout ?? false; } catch (e) { return false; }
    }
    return false;
  });

  // Dynamic UI Customization State with persistent initializers
  const [cardWidth, setCardWidth] = useState(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      try { return JSON.parse(saved).cardWidth ?? 800; } catch (e) { return 800; }
    }
    return 800;
  });

  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      try { return JSON.parse(saved).fontSize ?? 16; } catch (e) { return 16; }
    }
    return 16;
  });

  const [cardPadding, setCardPadding] = useState(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      try { return JSON.parse(saved).cardPadding ?? 2; } catch (e) { return 2; }
    }
    return 2;
  });

  const [showFrequency, setShowFrequency] = useState(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      try { return JSON.parse(saved).showFrequency ?? true; } catch (e) { return true; }
    }
    return true;
  });

  const [showSettings, setShowSettings] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  const [pendingLink, setPendingLink] = useState<{ from: string, to: string } | null>(null);
  const [linkConfig, setLinkConfig] = useState<{ type: 'solid' | 'dotted', color: string }>({
    type: 'solid',
    color: COLORS[0].value
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const sqRefs = useRef(new Map<string, HTMLElement>());

  const registerSqRef = useCallback((id: string, el: HTMLElement | null) => {
    if (el) sqRefs.current.set(id, el);
    else sqRefs.current.delete(id);
  }, []);

  // Save logic in effects
  useEffect(() => {
    if (data.length === 0 && links.length === 0 && !showInput) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ data, links }));
  }, [data, links, showInput]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ cardWidth, fontSize, cardPadding, showFrequency, twoColumnLayout }));
  }, [cardWidth, fontSize, cardPadding, showFrequency, twoColumnLayout]);

  const pushState = useCallback((newData: SemesterGroup[], newLinks: LinkEdge[]) => {
    setHistory(prev => [...prev, { data, links }].slice(-50));
    setRedoHistory([]);
    setData(newData);
    setLinks(newLinks);
  }, [data, links, history]);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setRedoHistory(prev => [...prev, { data, links }]);
    setHistory(prev => prev.slice(0, -1));
    setData(last.data);
    setLinks(last.links);
  }, [history, data, links]);

  const redo = useCallback(() => {
    if (redoHistory.length === 0) return;
    const next = redoHistory[redoHistory.length - 1];
    setHistory(prev => [...prev, { data, links }]);
    setRedoHistory(prev => prev.slice(0, -1));
    setData(next.data);
    setLinks(next.links);
  }, [redoHistory, data, links]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) redo(); else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const getAllComponents = useCallback((edges: LinkEdge[]) => {
    const adjacency = new Map<string, Set<string>>();
    const allNodes = new Set<string>();
    edges.forEach(e => {
      if (!adjacency.has(e.from)) adjacency.set(e.from, new Set());
      if (!adjacency.has(e.to)) adjacency.set(e.to, new Set());
      adjacency.get(e.from)!.add(e.to);
      adjacency.get(e.to)!.add(e.from);
      allNodes.add(e.from);
      allNodes.add(e.to);
    });
    const components: Set<string>[] = [];
    const visited = new Set<string>();
    allNodes.forEach(node => {
      if (!visited.has(node)) {
        const component = new Set<string>();
        const stack = [node];
        while (stack.length) {
          const cur = stack.pop()!;
          if (visited.has(cur)) continue;
          visited.add(cur);
          component.add(cur);
          adjacency.get(cur)?.forEach(neighbor => stack.push(neighbor));
        }
        components.push(component);
      }
    });
    return components;
  }, []);

  const getPaddingClass = (level: number) => {
    switch (level) {
      case 1: return compactMode ? 'p-2' : 'p-4';
      case 2: return compactMode ? 'p-4' : 'p-8';
      case 3: return compactMode ? 'p-6' : 'p-12';
      case 4: return compactMode ? 'p-8' : 'p-16';
      case 5: return compactMode ? 'p-10' : 'p-20';
      default: return compactMode ? 'p-4' : 'p-8';
    }
  };

  const getGapClass = (level: number) => {
    switch (level) {
      case 1: return compactMode ? 'space-y-2' : 'space-y-5';
      case 2: return compactMode ? 'space-y-4' : 'space-y-10';
      case 3: return compactMode ? 'space-y-6' : 'space-y-16';
      case 4: return compactMode ? 'space-y-8' : 'space-y-20';
      case 5: return compactMode ? 'space-y-10' : 'space-y-24';
      default: return compactMode ? 'space-y-4' : 'space-y-10';
    }
  };

  const updateLines = useCallback(() => {
    if (!containerRef.current || links.length === 0) {
      setLineCoords([]);
      return;
    }
    const containerRect = containerRef.current.getBoundingClientRect();
    const components = getAllComponents(links);
    const newCoords = components.map((group) => {
      const nodeIds = Array.from(group);
      const elements = nodeIds.map(id => sqRefs.current.get(id)).filter(Boolean) as HTMLElement[];
      if (elements.length < 2) return null;
      const rects = elements.map(el => el.getBoundingClientRect());
      const minTop = Math.min(...rects.map(r => r.top)) - containerRect.top + rects[0].height / 2;
      const maxTop = Math.max(...rects.map(r => r.top)) - containerRect.top + rects[0].height / 2;
      const sortedIds = nodeIds.sort().join(',');
      const spineX = 10 + (Math.abs(hashCode(sortedIds)) % 30);
      const branches = nodeIds.map(id => {
        const el = sqRefs.current.get(id);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { y: r.top - containerRect.top + r.height / 2, tx: r.left - containerRect.left };
      }).filter(Boolean);
      const primaryEdge = links.find(e => group.has(e.from) || group.has(e.to))!;
      return { id: sortedIds, spineX, spineY1: minTop, spineY2: maxTop, branches, color: primaryEdge.visual.color, style: primaryEdge.visual.style };
    }).filter(Boolean);
    setLineCoords(newCoords);
  }, [links, data, showInput, getAllComponents]);

  useEffect(() => {
    updateLines();
    const timer = setTimeout(updateLines, 200);
    window.addEventListener('resize', updateLines);
    return () => { window.removeEventListener('resize', updateLines); clearTimeout(timer); };
  }, [updateLines, data, links, showInput]);

  const handleFormat = async () => {
    if (!rawText.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const formatted = await parsePYQText(rawText);
      pushState(formatted.semesters, []);
      setShowInput(false);
      setRawText('');
    } catch (err: any) {
      console.error('API Error:', err);
      // Load dummy data as fallback when API fails
      pushState(dummyData.semesters, []);
      setShowInput(false);
      setRawText('');
      setError('API unavailable. Showing sample data instead.');
    }
    finally { setIsLoading(false); }
  };


  const handleCopySub = useCallback((sq: SubQuestion) => {
    navigator.clipboard.writeText(`next q - ${sq.text}`);
  }, []);

  const handleDoneSub = useCallback((qId: string, sqId: string) => {
    let currentStatus = false;
    for (const sem of data) {
      for (const q of sem.questions) {
        const sq = q.subQuestions.find(s => s.id === sqId);
        if (sq) { currentStatus = sq.isDone; break; }
      }
    }
    const newState = !currentStatus;
    const syncEdges = links.filter(l => l.sync);
    const adjacency = new Map<string, Set<string>>();
    syncEdges.forEach(e => {
      if (!adjacency.has(e.from)) adjacency.set(e.from, new Set());
      if (!adjacency.has(e.to)) adjacency.set(e.to, new Set());
      adjacency.get(e.from)!.add(e.to);
      adjacency.get(e.to)!.add(e.from);
    });
    const group = new Set<string>([sqId]);
    const stack = [sqId];
    const visited = new Set<string>();
    while (stack.length) {
      const cur = stack.pop()!;
      if (visited.has(cur)) continue;
      visited.add(cur);
      group.add(cur);
      adjacency.get(cur)?.forEach(n => stack.push(n));
    }
    const updatedData = data.map(sem => ({
      ...sem,
      questions: sem.questions.map(q => ({
        ...q,
        subQuestions: q.subQuestions.map(sq => group.has(sq.id) ? { ...sq, isDone: newState } : sq)
      }))
    }));
    pushState(updatedData, links);
  }, [data, links, pushState]);

  const handleLinkToggle = (sqId: string) => {
    if (!linkingId) { setLinkingId(sqId); }
    else { if (linkingId === sqId) { setLinkingId(null); } else { setPendingLink({ from: linkingId, to: sqId }); setLinkingId(null); } }
  };

  const finalizeLink = () => {
    if (!pendingLink) return;
    const newEdge: LinkEdge = { id: crypto.randomUUID(), from: pendingLink.from, to: pendingLink.to, visual: { style: linkConfig.type, color: linkConfig.color }, sync: linkConfig.type === 'solid' };
    pushState(data, [...links, newEdge]);
    setPendingLink(null);
  };

  const executeReset = () => {
    setHistory(prev => [...prev, { data, links }].slice(-50));
    setRedoHistory([]);
    setData([]);
    setLinks([]);
    setRawText('');
    setShowInput(true);
    localStorage.removeItem(STORAGE_KEY);
    setShowResetConfirm(false);
  };

  const doneCount = data.flatMap(s => s.questions.flatMap(q => q.subQuestions)).filter(sq => sq.isDone).length;
  const totalCount = data.flatMap(s => s.questions.flatMap(q => q.subQuestions)).length;

  return (
    <div className="w-full h-screen bg-[#FDFDFD] flex flex-col overflow-hidden text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-2 flex items-center z-30 shadow-sm relative gap-4">
        {/* Undo/Redo - Subtle */}
        <div className="flex gap-1 bg-gray-50/50 p-1 rounded-lg border border-gray-50">
          <button onClick={undo} disabled={history.length === 0} className="p-1.5 disabled:opacity-20 text-gray-400 hover:text-gray-900 transition-all"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg></button>
          <button onClick={redo} disabled={redoHistory.length === 0} className="p-1.5 disabled:opacity-20 text-gray-400 hover:text-gray-900 transition-all"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" /></svg></button>
        </div>

        {/* Major Progress Section */}
        <div className="flex-grow flex flex-col gap-1.5">
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Overall Tracker</span>
              {totalCount > 0 && <span className="text-xs font-black text-blue-600 px-2 py-0.5 bg-blue-50 rounded-full">{Math.round((doneCount / totalCount) * 100)}%</span>}
            </div>
            {totalCount > 0 && <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">{doneCount} DONE / {totalCount} TOTAL</span>}
          </div>
          <div className="w-full h-3 bg-gray-50 rounded-full overflow-hidden border border-gray-100/50">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(59,130,246,0.3)]"
              style={{ width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        {/* 3-Dot Actions Menu */}
        <div className="relative">
          <button
            onClick={() => setShowActionsMenu(!showActionsMenu)}
            className={`p-2 rounded-xl transition-all ${showActionsMenu ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>

          {showActionsMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowActionsMenu(false)}></div>
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => { setTwoColumnLayout(!twoColumnLayout); setShowActionsMenu(false); }}
                  className="w-full px-4 py-3 text-left text-[11px] font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-3"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" /><path d="M10 4v16" /></svg>
                  {twoColumnLayout ? "SWITCH TO 1 COLUMN" : "SWITCH TO 2 COLUMNS"}
                </button>
                <div className="h-[1px] bg-gray-50 mx-2"></div>
                <button
                  onClick={() => { setShowInput(true); setShowActionsMenu(false); }}
                  className="w-full px-4 py-3 text-left text-[11px] font-bold text-blue-600 hover:bg-blue-50 flex items-center gap-3"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  IMPORT MATERIAL
                </button>
                <button
                  onClick={() => { setShowSettings(true); setShowActionsMenu(false); }}
                  className="w-full px-4 py-3 text-left text-[11px] font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-3"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  DISPLAY SETTINGS
                </button>
                <div className="h-[1px] bg-gray-50 mx-2"></div>
                <button
                  onClick={() => { setShowResetConfirm(true); setShowActionsMenu(false); }}
                  className="w-full px-4 py-3 text-left text-[11px] font-bold text-red-500 hover:bg-red-50 flex items-center gap-3"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  RESET TRACKER
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Input Overlay */}
      {showInput && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-md z-40 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white p-10 rounded-3xl border border-gray-100 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">Import Material</h3>
              {data.length > 0 && <button onClick={() => setShowInput(false)} className="text-gray-300 hover:text-gray-900 transition-colors"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>}
            </div>
            <textarea value={rawText} onChange={(e) => setRawText(e.target.value)} placeholder="Paste PDF/Exam text here..." className="w-full h-64 p-6 border border-gray-100 rounded-2xl text-sm outline-none bg-gray-50 mb-6 font-mono leading-relaxed" />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  pushState(dummyData.semesters, []);
                  setShowInput(false);
                }}
                className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-wider bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
              >
                📚 Load Sample Data
              </button>
              <button onClick={handleFormat} disabled={isLoading || !rawText.trim()} className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-wider bg-blue-600 text-white shadow-xl hover:bg-blue-700 disabled:opacity-30 transition-all">{isLoading ? 'Processing...' : 'Generate Tracker'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-sm w-full border border-gray-50 text-center animate-in zoom-in-95">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h4 className="text-lg font-black text-gray-900 mb-2">Reset Workspace?</h4>
            <p className="text-sm text-gray-500 mb-8">This will clear all your progress and imported questions. This action can be undone via Ctrl+Z.</p>
            <div className="flex gap-4">
              <button onClick={() => setShowResetConfirm(false)} className="flex-1 py-4 text-xs font-black text-gray-500 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors">CANCEL</button>
              <button onClick={executeReset} className="flex-1 py-4 text-xs font-black text-white bg-red-500 rounded-2xl hover:bg-red-600 shadow-lg transition-all">YES, RESET</button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Overlay - Sidebar style */}
      {showSettings && (
        <div className="fixed inset-y-0 right-0 w-80 bg-white border-l border-gray-100 z-50 shadow-2xl p-8 transition-all animate-in slide-in-from-right duration-300 flex flex-col">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400">Environment Config</h3>
            <button onClick={() => setShowSettings(false)} className="text-gray-300 hover:text-gray-900 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="space-y-10 flex-grow">
            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">Workspace Width</label>
                <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{cardWidth}px</span>
              </div>
              <input type="range" min="400" max="1400" step="50" value={cardWidth} onChange={(e) => setCardWidth(parseInt(e.target.value))} className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
              <div className="flex justify-between text-[8px] font-bold text-gray-300 uppercase">
                <span>Narrow</span>
                <span>Wide</span>
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">Content Size</label>
                <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{fontSize}px</span>
              </div>
              <input type="range" min="12" max="24" step="1" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
              <div className="flex justify-between text-[8px] font-bold text-gray-300 uppercase">
                <span>Compact</span>
                <span>Large</span>
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">Visual Density</label>
                <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Level {cardPadding}</span>
              </div>
              <input type="range" min="1" max="5" step="1" value={cardPadding} onChange={(e) => setCardPadding(parseInt(e.target.value))} className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
              <div className="flex justify-between text-[8px] font-bold text-gray-300 uppercase">
                <span>Tight</span>
                <span>Spacious</span>
              </div>
            </div>

            <div className="pt-8 border-t border-gray-50 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">Show Insights</span>
                  <span className="text-[9px] text-gray-400 font-medium">Frequency & priority markers</span>
                </div>
                <button
                  onClick={() => setShowFrequency(!showFrequency)}
                  className={`w-12 h-6 rounded-full transition-all relative ${showFrequency ? 'bg-blue-600 shadow-lg shadow-blue-100' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${showFrequency ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-8 border-t border-gray-50 text-center">
            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-relaxed">
              PYQ Exam Master<br />v1.4 Dynamic Engine
            </p>
          </div>
        </div>
      )}

      {/* Linking Modal */}
      {pendingLink && (
        <div className="fixed inset-0 bg-gray-900/10 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm border border-gray-50">
            <div className="text-center mb-8">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400">Connect Questions</h4>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <button onClick={() => setLinkConfig({ ...linkConfig, type: 'solid' })} className={`py-5 text-[10px] font-black rounded-2xl border transition-all ${linkConfig.type === 'solid' ? 'bg-gray-900 text-white border-gray-900 shadow-lg' : 'bg-gray-50 text-gray-400'}`}>SOLID (SYNC)</button>
              <button onClick={() => setLinkConfig({ ...linkConfig, type: 'dotted' })} className={`py-5 text-[10px] font-black rounded-2xl border transition-all ${linkConfig.type === 'dotted' ? 'bg-gray-900 text-white border-gray-900 shadow-lg' : 'bg-gray-50 text-gray-400'}`}>DOTTED (VISUAL)</button>
            </div>
            <div className="grid grid-cols-6 gap-3 mb-8">
              {COLORS.map(c => <button key={c.value} onClick={() => setLinkConfig({ ...linkConfig, color: c.value })} className={`w-full aspect-square rounded-full transition-transform hover:scale-110 ${linkConfig.color === c.value ? 'ring-2 ring-gray-900 ring-offset-2' : ''}`} style={{ backgroundColor: c.value }} />)}
            </div>
            <button onClick={finalizeLink} className="w-full py-5 bg-blue-600 text-white text-[11px] font-black rounded-2xl uppercase shadow-lg">Confirm Connection</button>
          </div>
        </div>
      )}

      {/* 2-Column Grid Workspace */}
      <main ref={containerRef} className="flex-grow overflow-y-auto w-full p-6 relative scrollbar-hide">
        <svg className="absolute inset-0 pointer-events-none w-full h-full min-h-screen z-10">
          {lineCoords.map((l) => (
            <g key={l.id} className="pointer-events-auto">
              <line x1={l.spineX} y1={l.spineY1} x2={l.spineX} y2={l.spineY2} stroke={l.color} strokeWidth="2.5" strokeDasharray={l.style === 'dotted' ? '5 4' : 'none'} opacity="0.4" strokeLinecap="round" />
              {l.branches.map((b: any, bi: number) => <line key={bi} x1={l.spineX} y1={b.y} x2={b.tx} y2={b.y} stroke={l.color} strokeWidth="2.5" strokeDasharray={l.style === 'dotted' ? '5 4' : 'none'} opacity="0.4" strokeLinecap="round" />)}
            </g>
          ))}
        </svg>

        {data.length > 0 ? (
          <div className={`w-full mx-auto grid ${twoColumnLayout ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'} gap-8 pb-32 transition-all duration-500`} style={{ maxWidth: `${twoColumnLayout ? cardWidth * 2 : cardWidth}px` }}>
            {data.map((semester) => (
              <div key={semester.id} className={`bg-white rounded-${compactMode ? '2xl' : '3xl'} ${getPaddingClass(cardPadding)} border border-gray-100 shadow-sm relative group h-fit flex gap-${compactMode ? '3' : '5'} transition-all duration-300 hover:shadow-md`}>
                {/* Semester Title - Gray Box on Left (Centered) */}
                <div className="flex-shrink-0 flex items-center pr-2 border-r border-gray-50">
                  <div className={`bg-gray-100 ${compactMode ? 'px-2 py-3' : 'px-3 py-4'} rounded-lg min-w-[40px] flex items-center justify-center`}>
                    <h2 className={`${compactMode ? 'text-base' : 'text-xl'} font-black text-gray-700 handwritten italic tracking-tight leading-none rotate-180 [writing-mode:vertical-lr]`}>
                      {semester.title}
                    </h2>
                  </div>
                </div>

                {/* Questions Container */}
                <div className={`flex-grow ${getGapClass(cardPadding)}`}>
                  {semester.questions.map((q, idx) => (
                    <React.Fragment key={q.id}>
                      <QuestionCard
                        question={q}
                        linkingId={linkingId}
                        onCopySub={handleCopySub}
                        onDoneSub={handleDoneSub}
                        onLinkToggle={handleLinkToggle}
                        registerRef={registerSqRef}
                        compactMode={compactMode}
                        fontSize={fontSize}
                        showFrequency={showFrequency}
                      />
                      {idx < semester.questions.length - 1 && (
                        <div className="flex items-center gap-4 py-1">
                          <div className="h-[1px] bg-gray-50 flex-grow"></div>
                          <span className="text-[9px] font-black text-gray-200 uppercase tracking-[0.6em]">OR</span>
                          <div className="h-[1px] bg-gray-50 flex-grow"></div>
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
            <p className="text-sm font-black uppercase tracking-widest mb-8">Workspace Empty</p>
            <button onClick={() => setShowInput(true)} className="px-12 py-5 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl">Initialize Tracker</button>
          </div>
        )}
      </main>

      {/* Target Mode UI */}
      {linkingId && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-10 py-5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-[0_25px_70px_-15px_rgba(0,0,0,0.6)] z-50 flex items-center gap-6 animate-bounce">
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-blue-400 animate-ping absolute"></div>
            <div className="w-3 h-3 rounded-full bg-blue-400 relative"></div>
          </div>
          Select matching question
          <button onClick={() => setLinkingId(null)} className="ml-4 text-gray-500 hover:text-white transition-colors">✕</button>
        </div>
      )}
    </div>
  );
};

interface HistoryState {
  data: SemesterGroup[];
  links: LinkEdge[];
}

export default App;
