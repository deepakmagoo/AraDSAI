'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText, X, CheckCircle2, AlertCircle, ChevronRight,
  ArrowLeft, CloudUpload, Loader2, Sparkles, Zap, BookOpen, ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { ragAPI } from '@/services/api';

const LAMBDA_ENDPOINT =
  'https://dkiptx2dq6.execute-api.ap-northeast-1.amazonaws.com/dev/process';

// Example documents stored in /public/docs/
// Add your PDF filenames here as you upload them to the public/docs folder
const EXAMPLE_DOCS = [
  { name: 'Sample Document 1',  file: 'test.pdf',  tag: 'Demo' },
  { name: 'Sample Document 2',  file: 'test1.pdf', tag: 'Demo' },
  { name: 'Sample Document 3',  file: 'test2.pdf', tag: 'Demo' },
  { name: 'Sample Document 4',  file: 'test3.pdf', tag: 'Demo' },
];

const PROCESSING_STEPS = [
  { label: 'Reading and encoding document',           icon: FileText      },
  { label: 'Extracting text with AI OCR',             icon: CloudUpload   },
  { label: 'Identifying document sections',           icon: Sparkles      },
  { label: 'Evaluating against knowledge base',       icon: Zap           },
  { label: 'Saving results & generating report',      icon: CheckCircle2  },
];

function delay(ms) { return new Promise((r) => setTimeout(r, ms)); }

export default function UploadPage() {
  const router         = useRouter();
  const fileInputRef   = useRef(null);
  const { user }       = useAuth();

  const [file,           setFile]           = useState(null);
  const [isDragging,     setIsDragging]     = useState(false);
  const [processing,     setProcessing]     = useState(false);
  const [processingStep, setProcessingStep] = useState(-1);
  const [done,           setDone]           = useState(false);
  const [savedDocId,     setSavedDocId]     = useState(null);   // backend doc ID after save
  const [exampleOpen,    setExampleOpen]    = useState(false);
  const [loadingExample, setLoadingExample] = useState(null);   // filename being loaded

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (!f) return;
    if (f.type !== 'application/pdf') { toast.error('Please upload a PDF file'); return; }
    setFile(f);
  }, []);

  const handleFileInput = (e) => { const f = e.target.files?.[0]; if (f) setFile(f); };

  const handleExampleSelect = async (doc) => {
    setLoadingExample(doc.file);
    try {
      const res = await fetch(`/docs/${doc.file}`);
      if (!res.ok) throw new Error('File not found');
      const blob = await res.blob();
      const f = new File([blob], doc.file, { type: 'application/pdf' });
      setFile(f);
      setExampleOpen(false);
    } catch {
      toast.error(`Could not load "${doc.name}". Make sure the PDF is in public/docs/.`);
    } finally {
      setLoadingExample(null);
    }
  };

  const handleAnalyse = async () => {
    setProcessing(true);
    setProcessingStep(0);
    let timer = null;

    try {
      // Step 0: Read & base64 encode
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = () => {
          const bytes = new Uint8Array(reader.result);
          let binary = '';
          for (let i = 0; i < bytes.length; i += 8192)
            binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
          resolve(btoa(binary));
        };
        reader.onerror = reject;
      });
      setProcessingStep(1);

      // Step 1-3: Advance while Lambda processes
      timer = setInterval(() => setProcessingStep((p) => (p < 3 ? p + 1 : p)), 10000);

      const response = await fetch(LAMBDA_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: base64 }),
      });
      clearInterval(timer); timer = null;

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Server error: ${response.status}`);
      }

      const result = await response.json();
      // Parse Lambda proxy body
      const data = result.body
        ? (typeof result.body === 'string' ? JSON.parse(result.body) : result.body)
        : result;

      setProcessingStep(4);

      // Step 4: Save to backend for non-demo users
      const ragPayload = {
        name:       file.name,
        uploadDate: new Date().toISOString(),
        ...data,
      };

      // Always save to sessionStorage (fallback for demo + offline)
      sessionStorage.setItem('ragAnalysisResult', JSON.stringify(ragPayload));

      let navigateTo = '/analysis/result';

      if (!user?.isDemo) {
        try {
          const saveRes = await ragAPI.save(ragPayload);
          const docId   = saveRes.data?.document_id;
          if (docId) {
            setSavedDocId(docId);
            navigateTo = `/analysis/${docId}`;
          }
        } catch (saveErr) {
          console.warn('Backend save failed, falling back to sessionStorage:', saveErr);
          // navigate to /analysis/result as fallback
        }
      }

      await delay(600);
      setDone(true);
      // Store final navigate target
      setSavedDocId(navigateTo.replace('/analysis/', ''));
    } catch (err) {
      if (timer) clearInterval(timer);
      toast.error(err.message || 'Analysis failed. Please try again.');
      setProcessing(false);
      setProcessingStep(-1);
    }
  };

  const formatSize = (b) =>
    b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${(b / 1024).toFixed(0)} KB`;

  const navigateToReport = () => {
    const target = savedDocId ? `/analysis/${savedDocId}` : '/analysis/result';
    router.push(target);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
          <button onClick={() => router.push('/dashboard')}
            className="hover:text-slate-600 transition-colors flex items-center gap-1">
            <ArrowLeft size={14} /> Dashboard
          </button>
          <ChevronRight size={13} />
          <span className="text-slate-700 font-medium">Upload Document</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">New Compliance Analysis</h1>
        <p className="text-sm text-slate-500 mt-1">
          Upload your regulatory PDF — our AI will evaluate every section against the GMP knowledge base.
        </p>
      </div>

      {/* Upload view */}
      {!processing && (
        <div className="space-y-4">
          {/* Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !file && fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-indigo-400 bg-indigo-50'
                : file
                ? 'border-emerald-300 bg-emerald-50 cursor-default'
                : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 bg-white'
            }`}
          >
            <input ref={fileInputRef} type="file" className="hidden"
              accept=".pdf,application/pdf" onChange={handleFileInput} />
            {!file ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl flex items-center justify-center ring-1 ring-indigo-100">
                  <CloudUpload size={28} className="text-indigo-500" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-700">Drop your PDF here</p>
                  <p className="text-sm text-slate-400 mt-1">
                    or <span className="text-indigo-600 font-medium">browse files</span>
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                  <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-slate-300" /> PDF only</span>
                  <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-slate-300" /> Max 20 pages</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText size={22} className="text-emerald-600" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{file.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatSize(file.size)} · PDF</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Example Documents Dropdown */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <button
              type="button"
              onClick={() => setExampleOpen((o) => !o)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <BookOpen size={15} className="text-indigo-500" />
                Try an Example Document
              </span>
              <ChevronDown
                size={15}
                className={`text-slate-400 transition-transform duration-200 ${exampleOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {exampleOpen && (
              <div className="border-t border-slate-100 divide-y divide-slate-50">
                {EXAMPLE_DOCS.map((doc) => (
                  <button
                    key={doc.file}
                    type="button"
                    onClick={() => handleExampleSelect(doc)}
                    disabled={!!loadingExample}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-indigo-50 transition-colors disabled:opacity-50"
                  >
                    <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      {loadingExample === doc.file
                        ? <Loader2 size={14} className="text-indigo-500 animate-spin" />
                        : <FileText size={14} className="text-indigo-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{doc.name}</p>
                      <p className="text-xs text-slate-400">{doc.file}</p>
                    </div>
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full flex-shrink-0">
                      {doc.tag}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Documents are processed securely. Do not upload documents containing patient
              identifiers without proper de-identification.
            </p>
          </div>

          <div className="flex justify-end">
            <button disabled={!file} onClick={handleAnalyse}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl shadow-md shadow-indigo-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
              <Sparkles size={15} /> Analyse Document
            </button>
          </div>
        </div>
      )}

      {/* Processing view */}
      {processing && (
        <div className="animate-slide-up">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
            {!done ? (
              <div className="flex flex-col items-center gap-6">
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles size={24} className="text-indigo-500" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-slate-900 mb-1">Analysing Document</p>
                  <p className="text-sm text-slate-500">
                    AI is evaluating <span className="font-medium text-slate-700">{file?.name}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">This may take up to a minute</p>
                </div>
                <div className="w-full space-y-3 max-w-sm">
                  {PROCESSING_STEPS.map((s, i) => {
                    const Icon     = s.icon;
                    const isDone   = processingStep > i;
                    const isActive = processingStep === i;
                    return (
                      <div key={i}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                          isDone ? 'bg-emerald-50' : isActive ? 'bg-indigo-50' : 'bg-slate-50 opacity-40'
                        }`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                          isDone ? 'bg-emerald-100' : isActive ? 'bg-indigo-100' : 'bg-slate-100'
                        }`}>
                          {isDone
                            ? <CheckCircle2 size={14} className="text-emerald-600" />
                            : isActive
                            ? <Loader2 size={14} className="text-indigo-600 animate-spin" />
                            : <Icon size={14} className="text-slate-400" />}
                        </div>
                        <span className={`text-xs font-medium ${
                          isDone ? 'text-emerald-700' : isActive ? 'text-indigo-700' : 'text-slate-400'
                        }`}>{s.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 py-4">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-full flex items-center justify-center ring-4 ring-emerald-100">
                  <CheckCircle2 size={40} className="text-emerald-500" />
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-slate-900 mb-2">Analysis Complete!</p>
                  <p className="text-sm text-slate-500 max-w-xs">
                    {user?.isDemo
                      ? 'Your document has been analysed. View the compliance report below.'
                      : 'Results saved to your workspace. View the full compliance report below.'}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => router.push('/dashboard')}
                    className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                    Back to Dashboard
                  </button>
                  <button onClick={navigateToReport}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 rounded-xl shadow-sm transition-all">
                    View Report <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
