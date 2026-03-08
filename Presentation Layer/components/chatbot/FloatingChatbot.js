'use client';

import { useState, useRef, useEffect, useCallback, useId } from 'react';
import { X, Send, ChevronDown, RotateCcw, FileText, ExternalLink } from 'lucide-react';
import { chatAPI, documentsAPI } from '@/services/api';
import { DUMMY_DOCUMENTS } from '@/lib/dummyData';

// ── 3D Chubby Bee SVG ─────────────────────────────────────────────────────────
function BeeSVG({ size = 48 }) {
  // Unique IDs so multiple instances on the same page don't share gradient defs
  const uid = useId().replace(/:/g, '');
  const bg = `${uid}bg`;   // body gradient
  const hg = `${uid}hg`;   // head gradient
  const wg = `${uid}wg`;   // wing gradient
  const sg = `${uid}sg`;   // shadow filter
  const eg = `${uid}eg`;   // eye glow filter

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 115"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Bee chatbot"
    >
      <defs>
        {/* Body — warm 3-D yellow */}
        <radialGradient id={bg} cx="35%" cy="28%" r="68%">
          <stop offset="0%"   stopColor="#FFFDE7" />
          <stop offset="35%"  stopColor="#FDD835" />
          <stop offset="75%"  stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </radialGradient>

        {/* Head — soft cream-to-amber */}
        <radialGradient id={hg} cx="38%" cy="30%" r="65%">
          <stop offset="0%"   stopColor="#FFFDE7" />
          <stop offset="40%"  stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#D97706" />
        </radialGradient>

        {/* Wings — iridescent sky-blue */}
        <radialGradient id={wg} cx="50%" cy="40%" r="60%">
          <stop offset="0%"   stopColor="#E0F7FA" stopOpacity="0.95" />
          <stop offset="60%"  stopColor="#BAE6FD" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#7DD3FC" stopOpacity="0.25" />
        </radialGradient>

        {/* Drop shadow */}
        <filter id={sg} x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="1.5" dy="3" stdDeviation="3.5"
            floodColor="#92400E" floodOpacity="0.28" />
        </filter>

        {/* Eye depth */}
        <filter id={eg} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5"
            floodColor="#1C1917" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* ── Ground shadow ─────────────────────────────────── */}
      <ellipse cx="50" cy="112" rx="26" ry="4.5"
        fill="#78350F" fillOpacity="0.13" />

      {/* ── Wings (behind body) ───────────────────────────── */}
      {/* Left-back wing */}
      <ellipse cx="17" cy="58" rx="20" ry="9"
        fill={`url(#${wg})`} stroke="#BAE6FD" strokeWidth="0.8" strokeOpacity="0.7"
        transform="rotate(-35 17 58)" />
      {/* Right-back wing */}
      <ellipse cx="83" cy="58" rx="20" ry="9"
        fill={`url(#${wg})`} stroke="#BAE6FD" strokeWidth="0.8" strokeOpacity="0.7"
        transform="rotate(35 83 58)" />
      {/* Left-front wing (slightly larger, lighter) */}
      <ellipse cx="14" cy="50" rx="18" ry="8"
        fill={`url(#${wg})`} stroke="#E0F7FA" strokeWidth="1" strokeOpacity="0.9"
        transform="rotate(-28 14 50)" />
      {/* Right-front wing */}
      <ellipse cx="86" cy="50" rx="18" ry="8"
        fill={`url(#${wg})`} stroke="#E0F7FA" strokeWidth="1" strokeOpacity="0.9"
        transform="rotate(28 86 50)" />

      {/* ── Chubby abdomen ────────────────────────────────── */}
      <ellipse cx="50" cy="78" rx="29" ry="27"
        fill={`url(#${bg})`} filter={`url(#${sg})`} />

      {/* Stripes */}
      <path d="M23 71 Q50 66 77 71 L77 77 Q50 72 23 77 Z"
        fill="#1C1917" fillOpacity="0.72" />
      <path d="M21 82 Q50 77 79 82 L79 88 Q50 83 21 88 Z"
        fill="#1C1917" fillOpacity="0.72" />
      {/* Stripe shine edge */}
      <path d="M23 71 Q50 66 77 71" stroke="#FFF176" strokeWidth="0.8"
        fill="none" strokeOpacity="0.35" />
      <path d="M21 82 Q50 77 79 82" stroke="#FFF176" strokeWidth="0.8"
        fill="none" strokeOpacity="0.35" />

      {/* Body 3-D highlight */}
      <ellipse cx="37" cy="61" rx="13" ry="8"
        fill="white" fillOpacity="0.28" transform="rotate(-18 37 61)" />

      {/* Stinger */}
      <ellipse cx="50" cy="104" rx="5.5" ry="3" fill="#D97706" />
      <path d="M50 109 L44.5 103 L55.5 103 Z" fill="#92400E" />

      {/* ── Head ─────────────────────────────────────────── */}
      <circle cx="50" cy="42" r="23" fill={`url(#${hg})`} filter={`url(#${sg})`} />

      {/* Head 3-D highlight */}
      <ellipse cx="39" cy="30" rx="10" ry="6.5"
        fill="white" fillOpacity="0.32" transform="rotate(-22 39 30)" />

      {/* ── Antennae ─────────────────────────────────────── */}
      <path d="M43 21 Q34 10 26 5" stroke="#92400E" strokeWidth="2.2"
        fill="none" strokeLinecap="round" />
      <circle cx="25" cy="4" r="4" fill="#FDD835" stroke="#B45309" strokeWidth="1.2" />
      <circle cx="25" cy="4" r="2" fill="white" fillOpacity="0.6" />

      <path d="M57 21 Q66 10 74 5" stroke="#92400E" strokeWidth="2.2"
        fill="none" strokeLinecap="round" />
      <circle cx="75" cy="4" r="4" fill="#FDD835" stroke="#B45309" strokeWidth="1.2" />
      <circle cx="75" cy="4" r="2" fill="white" fillOpacity="0.6" />

      {/* ── Big cute eyes ────────────────────────────────── */}
      {/* Left eye */}
      <circle cx="39" cy="41" r="9.5" fill="white" filter={`url(#${eg})`} />
      <circle cx="40" cy="42" r="6.5" fill="#3B1F00" />
      <circle cx="40" cy="42" r="4.5" fill="#1C0D00" />
      <circle cx="42.5" cy="39"  r="2.5" fill="white" />   {/* main shine */}
      <circle cx="38"   cy="44"  r="1.2" fill="white" fillOpacity="0.65" /> {/* soft shine */}

      {/* Right eye */}
      <circle cx="61" cy="41" r="9.5" fill="white" filter={`url(#${eg})`} />
      <circle cx="62" cy="42" r="6.5" fill="#3B1F00" />
      <circle cx="62" cy="42" r="4.5" fill="#1C0D00" />
      <circle cx="64.5" cy="39"  r="2.5" fill="white" />
      <circle cx="60"   cy="44"  r="1.2" fill="white" fillOpacity="0.65" />

      {/* ── Blush cheeks ─────────────────────────────────── */}
      <ellipse cx="29" cy="49" rx="7" ry="4.5" fill="#F9A8D4" fillOpacity="0.42" />
      <ellipse cx="71" cy="49" rx="7" ry="4.5" fill="#F9A8D4" fillOpacity="0.42" />

      {/* ── Smile ────────────────────────────────────────── */}
      <path d="M41 53 Q50 60 59 53"
        stroke="#92400E" strokeWidth="2.2" fill="none" strokeLinecap="round" />

      {/* Little tongue for extra cuteness */}
      <ellipse cx="50" cy="58" rx="4.5" ry="3" fill="#FDA4AF" />
      <path d="M45.5 58 Q50 55 54.5 58" fill="#FB7185" />
    </svg>
  );
}

// ── Sample questions ──────────────────────────────────────────────────────────
const SAMPLE_QUESTIONS = [
  { label: 'Critical findings?', full: 'What are the critical compliance gaps in this document?' },
  { label: 'Summarize findings', full: 'Give me a summary of all findings and compliance status.' },
  { label: 'Which section first?', full: 'Which section needs the most urgent attention?' },
  { label: 'Compliance score?', full: 'What is the overall compliance score for this document?' },
  { label: 'Suggested fixes?', full: 'What are the suggested fixes for the top issues?' },
  { label: 'List all findings', full: 'List all findings in this document by severity.' },
];

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"
          style={{ animationDelay: `${delay}ms`, animationDuration: '0.8s' }}
        />
      ))}
    </div>
  );
}

// ── Inline markdown parser ────────────────────────────────────────────────────
// Handles: **bold**, *italic*, `code`, [Citation: ...], [Section X.Y]
function parseInline(text, key = 0) {
  if (!text) return null;
  const parts = [];
  // Pattern order matters — bold before italic
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|\[Citation:\s*([^\]]+)\]|\[Section\s+([\d.]+)\]|\[§([\d.]+)\])/g;
  let last = 0;
  let match;
  let idx = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(<span key={`t-${key}-${idx++}`}>{text.slice(last, match.index)}</span>);
    }
    if (match[2]) {
      // **bold**
      parts.push(<strong key={`b-${key}-${idx++}`} className="font-semibold">{match[2]}</strong>);
    } else if (match[3]) {
      // *italic*
      parts.push(<em key={`i-${key}-${idx++}`} className="italic">{match[3]}</em>);
    } else if (match[4]) {
      // `code`
      parts.push(
        <code key={`c-${key}-${idx++}`} className="bg-slate-200 text-rose-600 text-[11px] font-mono px-1 py-0.5 rounded">
          {match[4]}
        </code>
      );
    } else if (match[5]) {
      // [Citation: ...]
      parts.push(
        <span key={`cit-${key}-${idx++}`} className="inline-flex items-center gap-0.5 text-indigo-600 font-medium text-[11px] bg-indigo-50 border border-indigo-200 rounded px-1.5 py-0.5 mx-0.5">
          <ExternalLink size={10} />{match[5].trim()}
        </span>
      );
    } else if (match[6] || match[7]) {
      // [Section X.Y] or [§X.Y]
      const sec = match[6] || match[7];
      parts.push(
        <span key={`sec-${key}-${idx++}`} className="inline text-emerald-700 font-medium text-[11px] bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5 mx-0.5">
          §{sec}
        </span>
      );
    }
    last = regex.lastIndex;
  }

  if (last < text.length) {
    parts.push(<span key={`t-${key}-${idx++}`}>{text.slice(last)}</span>);
  }

  return parts.length > 0 ? parts : text;
}

// ── Full markdown renderer ────────────────────────────────────────────────────
function MarkdownContent({ content }) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let i = 0;
  let keyCounter = 0;

  const nextKey = () => keyCounter++;

  while (i < lines.length) {
    const line = lines[i];

    // ── Heading H2 (##)
    if (/^## (.+)/.test(line)) {
      const text = line.replace(/^## /, '');
      elements.push(
        <h2 key={nextKey()} className="text-[13px] font-bold text-slate-800 mt-3 mb-1 border-b border-slate-200 pb-0.5">
          {parseInline(text, nextKey())}
        </h2>
      );
      i++; continue;
    }

    // ── Heading H3 (###)
    if (/^### (.+)/.test(line)) {
      const text = line.replace(/^### /, '');
      elements.push(
        <h3 key={nextKey()} className="text-[12px] font-semibold text-slate-700 mt-2 mb-0.5">
          {parseInline(text, nextKey())}
        </h3>
      );
      i++; continue;
    }

    // ── Blockquote (>)
    if (/^> /.test(line)) {
      const quoteLines = [];
      while (i < lines.length && /^> /.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^> /, ''));
        i++;
      }
      elements.push(
        <blockquote key={nextKey()} className="border-l-2 border-amber-400 bg-amber-50 pl-3 py-1 my-1 text-[11px] text-slate-700 italic rounded-r">
          {quoteLines.map((q, qi) => (
            <p key={qi} className="mb-0.5 last:mb-0">{parseInline(q, qi)}</p>
          ))}
        </blockquote>
      );
      continue;
    }

    // ── Code block (```)
    if (/^```/.test(line)) {
      const codeLines = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(
        <pre key={nextKey()} className="bg-slate-800 text-slate-100 text-[11px] font-mono rounded-lg px-3 py-2 my-1.5 overflow-x-auto whitespace-pre-wrap leading-relaxed">
          {codeLines.join('\n')}
        </pre>
      );
      continue;
    }

    // ── Table (| col | col |)
    if (/^\|/.test(line) && i + 1 < lines.length && /^\|[-\s:|]+\|/.test(lines[i + 1])) {
      const headerCells = line.split('|').filter(c => c.trim()).map(c => c.trim());
      i += 2; // skip header and separator rows
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) {
        const cells = lines[i].split('|').filter(c => c.trim()).map(c => c.trim());
        rows.push(cells);
        i++;
      }
      elements.push(
        <div key={nextKey()} className="overflow-x-auto my-2 rounded-lg border border-slate-200">
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr className="bg-slate-100">
                {headerCells.map((h, hi) => (
                  <th key={hi} className="text-left text-slate-700 font-semibold px-2 py-1.5 border-b border-slate-200 whitespace-nowrap">
                    {parseInline(h, hi)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-2 py-1.5 border-b border-slate-100 align-top leading-snug">
                      {parseInline(cell, ci)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // ── Horizontal rule (---)
    if (/^---+$/.test(line.trim())) {
      elements.push(<hr key={nextKey()} className="border-slate-200 my-2" />);
      i++; continue;
    }

    // ── Bullet list (- or • or *)
    if (/^[-•*] /.test(line)) {
      const items = [];
      while (i < lines.length && /^[-•*] /.test(lines[i])) {
        items.push(lines[i].replace(/^[-•*] /, ''));
        i++;
      }
      elements.push(
        <ul key={nextKey()} className="list-none my-1 space-y-0.5 pl-1">
          {items.map((item, ii) => (
            <li key={ii} className="flex items-start gap-1.5 text-[12px] leading-relaxed text-slate-700">
              <span className="text-amber-500 font-bold mt-0.5 flex-shrink-0">•</span>
              <span>{parseInline(item, ii)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // ── Numbered list (1. 2. ...)
    if (/^\d+\. /.test(line)) {
      const items = [];
      let num = 1;
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push({ n: num++, text: lines[i].replace(/^\d+\. /, '') });
        i++;
      }
      elements.push(
        <ol key={nextKey()} className="my-1 space-y-0.5 pl-1">
          {items.map((item) => (
            <li key={item.n} className="flex items-start gap-1.5 text-[12px] leading-relaxed text-slate-700">
              <span className="text-indigo-500 font-semibold min-w-[16px] flex-shrink-0">{item.n}.</span>
              <span>{parseInline(item.text, item.n)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // ── Empty line → spacer
    if (line.trim() === '') {
      elements.push(<div key={nextKey()} className="h-1.5" />);
      i++; continue;
    }

    // ── Regular paragraph
    elements.push(
      <p key={nextKey()} className="text-[12px] leading-relaxed text-slate-700 mb-0.5">
        {parseInline(line, nextKey())}
      </p>
    );
    i++;
  }

  return <div className="space-y-0.5">{elements}</div>;
}

// ── Message bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-9 h-9 mb-0.5">
          <BeeSVG size={36} />
        </div>
      )}
      <div
        className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm ${
          isUser
            ? 'bg-indigo-600 text-white rounded-br-sm leading-relaxed whitespace-pre-line'
            : 'bg-slate-50 text-slate-800 rounded-bl-sm border border-slate-100'
        }`}
      >
        {isUser ? (
          msg.content
        ) : (
          <MarkdownContent content={msg.content} />
        )}
      </div>
    </div>
  );
}

// ── Citations panel ───────────────────────────────────────────────────────────
function CitationsPill({ sources }) {
  const [open, setOpen] = useState(false);
  if (!sources || sources.length === 0) return null;
  return (
    <div className="ml-9 mt-0.5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-[10px] text-indigo-500 hover:text-indigo-700 flex items-center gap-1 font-medium"
      >
        <ExternalLink size={10} />
        {sources.length} reference{sources.length > 1 ? 's' : ''}
        <ChevronDown size={10} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="mt-1 space-y-1">
          {sources.map((s, i) => (
            <div
              key={i}
              className={`text-[10px] px-2 py-1 rounded flex items-start gap-1 ${
                s.type === 'regulatory'
                  ? 'bg-indigo-50 border border-indigo-100 text-indigo-700'
                  : 'bg-emerald-50 border border-emerald-100 text-emerald-700'
              }`}
            >
              <span className="font-semibold flex-shrink-0">{s.type === 'regulatory' ? '⚖' : '§'}</span>
              <span>{s.reference}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────
const BTN_SZ    = 84;    // floating button diameter px
const PANEL_W   = 520;   // chat panel width px
const PANEL_H   = 680;   // chat panel height px
const SNAP_PAD  = 16;    // min distance from viewport edge px

// ── Main component ────────────────────────────────────────────────────────────
export default function FloatingChatbot() {
  const [open, setOpen] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "Hi! I'm **DocBot** 🐝\n\nSelect a document above and I'll help you understand its compliance findings, gaps, and suggested fixes.\n\nI can provide:\n- Detailed analysis of critical and major issues\n- Regulatory citations and references\n- Specific corrective actions\n- Compliance score breakdown",
      sources: [],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBadge, setShowBadge] = useState(true);
  const [docsLoaded, setDocsLoaded] = useState(false);

  // ── Drag state (Pointer Events + setPointerCapture for reliable free drag) ──
  const [btnPos, setBtnPos]     = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const btnRef  = useRef(null);
  const drag    = useRef({ active: false, moved: false, startCX: 0, startCY: 0, startX: 0, startY: 0 });

  // Set default position bottom-right on first client render
  useEffect(() => {
    setBtnPos({
      x: window.innerWidth  - BTN_SZ - SNAP_PAD,
      y: window.innerHeight - BTN_SZ - SNAP_PAD,
    });
  }, []);

  const onPointerDown = (e) => {
    // Capture pointer so move/up events keep firing even outside the element
    btnRef.current?.setPointerCapture(e.pointerId);
    drag.current = {
      active:  true,
      moved:   false,
      startCX: e.clientX,
      startCY: e.clientY,
      startX:  btnPos?.x ?? window.innerWidth  - BTN_SZ - SNAP_PAD,
      startY:  btnPos?.y ?? window.innerHeight - BTN_SZ - SNAP_PAD,
    };
    setIsDragging(true);
    e.preventDefault();
  };

  const onPointerMove = (e) => {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.startCX;
    const dy = e.clientY - drag.current.startCY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) drag.current.moved = true;
    setBtnPos({
      x: Math.max(SNAP_PAD, Math.min(window.innerWidth  - BTN_SZ - SNAP_PAD, drag.current.startX + dx)),
      y: Math.max(SNAP_PAD, Math.min(window.innerHeight - BTN_SZ - SNAP_PAD, drag.current.startY + dy)),
    });
  };

  const onPointerUp = () => {
    if (!drag.current.active) return;
    drag.current.active = false;
    setIsDragging(false);
    // Treat as click only if the pointer barely moved
    if (!drag.current.moved) {
      setOpen(true);
      setShowBadge(false);
    }
  };

  // Compute where the chat panel should appear relative to button
  const getPanelStyle = () => {
    if (!btnPos) return { bottom: BTN_SZ + 20, right: SNAP_PAD };
    const GAP = 14;
    let left = btnPos.x + BTN_SZ / 2 - PANEL_W / 2;
    let top  = btnPos.y - PANEL_H - GAP;
    // Clamp to viewport
    left = Math.max(SNAP_PAD, Math.min(window.innerWidth  - PANEL_W - SNAP_PAD, left));
    top  = Math.max(SNAP_PAD, Math.min(window.innerHeight - PANEL_H - SNAP_PAD, top));
    return { left, top, animation: 'slideUp 0.25s ease-out' };
  };

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Standalone doc loader — called on open and on manual refresh
  const loadDocs = useCallback(async () => {
    try {
      const res = await documentsAPI.list();
      const data = Array.isArray(res.data) && res.data.length > 0 ? res.data : DUMMY_DOCUMENTS;
      setDocuments(data);
      // Keep current selection if it still exists, otherwise pick first
      setSelectedDocId((prev) => data.find((d) => d.id === prev) ? prev : (data[0]?.id || ''));
    } catch {
      setDocuments(DUMMY_DOCUMENTS);
      setSelectedDocId(DUMMY_DOCUMENTS[0]?.id || '');
    }
    setDocsLoaded(true);
  }, []);

  // Load documents once when chatbot first opens
  useEffect(() => {
    if (!open || docsLoaded) return;
    loadDocs();
  }, [open, docsLoaded, loadDocs]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const sendMessage = useCallback(
    async (text) => {
      const msg = (text || input).trim();
      if (!msg || loading) return;
      setInput('');
      setMessages((prev) => [...prev, { role: 'user', content: msg, sources: [] }]);
      setLoading(true);

      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const docId = selectedDocId || DUMMY_DOCUMENTS[0]?.id || 'doc-001';

      try {
        const res = await chatAPI.chatWithDocument(docId, msg, history);
        const data = res.data;
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.response || 'Let me look into that for you…',
            sources: data.sources || [],
          },
        ]);
      } catch (error) {
        console.error('Chat error:', error);
        try {
          const res = await chatAPI.send(docId, msg, history);
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: res.data.response || 'Let me look into that for you…',
              sources: res.data.sources || [],
            },
          ]);
        } catch {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: getDemoResponse(msg), sources: [] },
          ]);
        }
      } finally {
        setLoading(false);
      }
    },
    [input, loading, messages, selectedDocId]
  );

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const [refreshing, setRefreshing] = useState(false);

  const resetChat = async () => {
    // Reset messages
    setMessages([
      {
        role: 'assistant',
        content: "Hi again! 🐝 Refreshing your documents…",
        sources: [],
      },
    ]);
    setInput('');

    // Re-fetch latest documents from the server
    setRefreshing(true);
    await loadDocs();
    setRefreshing(false);

    setMessages([
      {
        role: 'assistant',
        content: "Documents refreshed! 🐝 Select a document and ask me anything about its compliance analysis.",
        sources: [],
      },
    ]);
  };

  const selectedDoc = documents.find((d) => d.id === selectedDocId);

  return (
    <>
      {/* ── Animation keyframes ──────────────────────────────────────────────── */}
      <style>{`
        @keyframes bee-float {
          0%,100% { transform: translateY(0px) rotate(-1.5deg); }
          50%      { transform: translateY(-14px) rotate(1.5deg); }
        }
        @keyframes bee-float-shadow {
          0%,100% { transform: scaleX(1);    opacity: 0.14; }
          50%      { transform: scaleX(0.72); opacity: 0.07; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(18px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        .bee-floating     { animation: bee-float 2.8s ease-in-out infinite; }
        .bee-float-shadow { animation: bee-float-shadow 2.8s ease-in-out infinite; }
        .bee-dragging     { animation: none !important; cursor: grabbing !important; }
      `}</style>

      {/* ── Draggable floating button ─────────────────────────────────────────── */}
      {!open && btnPos && (
        <div
          ref={btnRef}
          className="z-50 select-none touch-none"
          style={{ position: 'fixed', left: btnPos.x, top: btnPos.y,
                   width: BTN_SZ, cursor: isDragging ? 'grabbing' : 'grab' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          aria-label="Open DocBot"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setOpen(true)}
        >
          <div className="relative flex flex-col items-center">
            {/* Pulse glow ring (only when not dragging) */}
            {!isDragging && (
              <span
                className="absolute rounded-full bg-amber-300 opacity-20 animate-ping pointer-events-none"
                style={{ width: BTN_SZ, height: BTN_SZ, top: 0, left: 0 }}
              />
            )}

            {/* Bee circle */}
            <div
              className={`relative bg-gradient-to-br from-amber-200 via-yellow-300 to-amber-400 rounded-full shadow-2xl flex items-center justify-center transition-shadow ${isDragging ? 'bee-dragging shadow-amber-400/40' : 'bee-floating shadow-amber-400/60 hover:shadow-amber-500/70'}`}
              style={{
                width: BTN_SZ, height: BTN_SZ,
                border: '3px solid rgba(251,191,36,0.65)',
                boxShadow: isDragging
                  ? '0 8px 30px rgba(217,119,6,0.35)'
                  : '0 12px 40px rgba(217,119,6,0.45), 0 0 0 4px rgba(253,224,71,0.18)',
              }}
            >
              {/* Inner gloss */}
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-yellow-100/45 to-transparent pointer-events-none" />
              <BeeSVG size={62} />
            </div>

            {/* Floating ground shadow */}
            {!isDragging && (
              <div
                className="bee-float-shadow rounded-full bg-amber-900 mt-1 pointer-events-none"
                style={{ width: BTN_SZ * 0.5, height: 8, filter: 'blur(5px)' }}
              />
            )}

            {/* "Drag me" hint shown while dragging */}
            {isDragging && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-medium px-2.5 py-1 rounded-lg whitespace-nowrap pointer-events-none shadow">
                dragging…
              </div>
            )}

            {/* Badge */}
            {showBadge && !isDragging && (
              <div className="absolute -top-14 right-0 bg-slate-900 text-white text-xs font-medium px-3 py-1.5 rounded-xl shadow-lg whitespace-nowrap pointer-events-none after:content-[''] after:absolute after:top-full after:right-5 after:border-4 after:border-transparent after:border-t-slate-900">
                Ask about your docs! 🐝
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Chat panel ───────────────────────────────────────────────────────── */}
      {open && (
        <div
          className="z-50 flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
          style={{ position: 'fixed', width: PANEL_W, height: PANEL_H, ...getPanelStyle() }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-300 flex-shrink-0">
            <div className="w-12 h-12 flex-shrink-0 drop-shadow-md">
              <BeeSVG size={48} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-amber-950 leading-tight">DocBot</p>
              <p className="text-xs text-amber-800 leading-tight">Compliance AI Assistant · Claude 4</p>
            </div>
            <button
              onClick={resetChat}
              title="Refresh documents"
              disabled={refreshing}
              className="p-1.5 text-amber-700 hover:text-amber-900 hover:bg-amber-200/50 rounded-lg transition-colors disabled:opacity-50"
            >
              <RotateCcw size={14} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 text-amber-700 hover:text-amber-900 hover:bg-amber-200/50 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Document selector */}
          <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/80 flex-shrink-0">
            <div className="flex items-center gap-2">
              <FileText size={13} className="text-slate-400 flex-shrink-0" />
              <select
                value={selectedDocId}
                onChange={(e) => {
                  setSelectedDocId(e.target.value);
                  // Only reset messages, don't re-fetch docs
                  setMessages([{ role: 'assistant', content: "Document switched! Ask me anything about this document.", sources: [] }]);
                  setInput('');
                }}
                className="flex-1 text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-300 min-w-0 truncate"
              >
                <option value="">— Select a document —</option>
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name || d.original_filename}
                  </option>
                ))}
              </select>
            </div>
            {selectedDoc && (
              <p className="text-[10px] text-slate-400 mt-1 pl-5 truncate">
                Status:{' '}
                <span
                  className={
                    selectedDoc.status === 'completed'
                      ? 'text-emerald-600 font-medium'
                      : 'text-amber-600 font-medium'
                  }
                >
                  {selectedDoc.status}
                </span>
                {selectedDoc.compliance_score
                  ? ` · ${selectedDoc.compliance_score}% compliant`
                  : ''}
              </p>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
            {messages.map((msg, i) => (
              <div key={i}>
                <MessageBubble msg={msg} />
                {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                  <CitationsPill sources={msg.sources} />
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-end gap-2">
                <div className="flex-shrink-0 w-9 h-9 mb-0.5">
                  <BeeSVG size={36} />
                </div>
                <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-3.5 py-2.5">
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Sample questions — shown when chat is fresh */}
          {messages.length <= 1 && (
            <div className="px-4 pb-3 flex-shrink-0">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
                Try asking:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q.full)}
                    className="text-[11px] bg-amber-50 text-amber-800 border border-amber-200 rounded-full px-3 py-1 hover:bg-amber-100 transition-colors font-medium leading-tight"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-3 border-t border-slate-100 flex gap-2 flex-shrink-0 bg-white">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about the document…"
              rows={1}
              className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent resize-none text-slate-800 placeholder:text-slate-300 bg-slate-50 focus:bg-white transition-colors"
              style={{ minHeight: '38px', maxHeight: '80px' }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="w-10 h-10 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-white rounded-xl flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ── Demo keyword responses ────────────────────────────────────────────────────
function getDemoResponse(message) {
  const q = message.toLowerCase();
  if (q.includes('critical') || q.includes('urgent') || q.includes('serious'))
    return [
      '## Critical Compliance Gaps',
      '',
      '**Executive Summary:** 2 critical findings require immediate attention before regulatory submission.',
      '',
      '| # | Section | Severity | Issue | Regulatory Basis |',
      '|---|---------|----------|-------|-----------------|',
      '| 1 | §4.2 | **CRITICAL** | Primary endpoint not explicitly defined | [Citation: ICH E6(R2) §6.9.4] |',
      '| 2 | §4.8 | **CRITICAL** | Missing research purpose in Informed Consent | [Citation: ICH E6(R2) §4.8.1] |',
      '',
      '## Recommended Actions',
      '',
      '1. Define the primary endpoint in §4.2 with specific measure and timepoint.',
      '2. Add explicit research purpose statement to the ICF §1.',
      '',
      '## References',
      '',
      '- [Citation: ICH E6(R2) §6.9.4] — Primary endpoint specification',
      '- [Citation: ICH E6(R2) §4.8.1] — Informed consent requirements',
    ].join('\n');

  if (q.includes('summar') || q.includes('overview') || q.includes('brief'))
    return [
      '## Document Summary',
      '',
      '**Executive Summary:** Analysis complete — 3 findings identified with an overall compliance score of **82%**.',
      '',
      '| Severity | Count |',
      '|----------|-------|',
      '| **CRITICAL** | 2 |',
      '| **MAJOR** | 1 |',
      '| **MINOR** | 0 |',
      '',
      '### Guidelines Checked',
      '- ICH E6(R2) — Good Clinical Practice',
      '- FDA GCP 21 CFR Part 312',
      '',
      '> Critical gaps must be resolved before regulatory submission to avoid a Request for Information (RFI).',
      '',
      '## References',
      '- [Citation: ICH E6(R2)] — Clinical trial conduct standard',
    ].join('\n');

  if (q.includes('fix') || q.includes('suggest') || q.includes('resolv'))
    return [
      '## Suggested Corrective Language',
      '',
      '**Executive Summary:** Three targeted text insertions will resolve the open findings.',
      '',
      '### 1. Primary Endpoint — §4.2',
      '',
      '```',
      '"The primary endpoint is [specific measure, e.g., change in HbA1c] assessed at [timepoint, e.g., Week 24]."',
      '```',
      '',
      '### 2. Informed Consent — §1',
      '',
      '```',
      '"This study is research designed to evaluate [purpose]. Participation is entirely voluntary and you may withdraw at any time without penalty."',
      '```',
      '',
      '### 3. Safety Monitoring — §5.3',
      '',
      '```',
      '"All Serious Adverse Events (SAEs) will be reported to the sponsor within 24 hours of the investigator becoming aware."',
      '```',
      '',
      '## References',
      '- [Citation: ICH E6(R2) §6.9.4]',
      '- [Citation: ICH E6(R2) §4.8.1]',
      '- [Citation: ICH E6(R2) §4.11.1]',
    ].join('\n');

  return [
    "I'm analyzing this document for you 🐝",
    '',
    'I can help you with:',
    '- **Critical & major findings** with regulatory citations',
    '- **Compliance score** breakdown by guideline',
    '- **Which sections** need immediate attention',
    '- **Suggested corrective language** for each gap',
    '',
    'What would you like to know?',
  ].join('\n');
}
