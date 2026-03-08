'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, Clock } from 'lucide-react';

export default function SOPIntelligencePage() {
  const router = useRouter();

  return (
    <div className="p-6 max-w-3xl mx-auto animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <button
          onClick={() => router.push('/dashboard')}
          className="hover:text-slate-600 transition-colors flex items-center gap-1"
        >
          <ArrowLeft size={14} /> Dashboard
        </button>
        <span>/</span>
        <span className="text-slate-700 font-medium">SOPintelligence</span>
      </div>

      {/* Under Development Banner */}
      <div className="flex flex-col items-center text-center mb-8 gap-3">
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-4 py-1.5 rounded-full">
          <Clock size={13} />
          Under Development
        </div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <Sparkles size={26} className="text-indigo-500" />
          SOPintelligence
        </h1>
        <p className="text-slate-500 text-sm max-w-xl">
          AI-powered Standard Operating Procedure management is coming soon.
          This feature will automate SOP creation, compliance monitoring, and
          employee guidance — end-to-end.
        </p>
      </div>

      {/* Feature Preview Image */}
      <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-md mb-8">
        <Image
          src="/image.png"
          alt="SOPintelligence feature preview"
          width={900}
          height={506}
          className="w-full h-auto"
          priority
        />
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { title: 'Automated SOP Creation',          desc: 'Generate and update SOPs with AI-driven precision.' },
          { title: 'Smart Workflow Automation',        desc: 'Streamline processes with intelligent task automation.' },
          { title: 'Real-Time Compliance Monitoring',  desc: 'Ensure adherence to regulations with live tracking.' },
          { title: 'Advanced Analytics & Insights',    desc: 'Gain data-driven insights for continuous improvement.' },
          { title: 'Employee Training & Guidance',     desc: 'AI-powered training and on-the-job support.' },
        ].map((item) => (
          <div key={item.title}
            className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-sm font-semibold text-slate-800 mb-1">{item.title}</p>
            <p className="text-xs text-slate-500">{item.desc}</p>
          </div>
        ))}
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 shadow-sm flex flex-col justify-center items-center text-center gap-1">
          <Sparkles size={18} className="text-indigo-400" />
          <p className="text-sm font-semibold text-indigo-700">More coming soon</p>
          <p className="text-xs text-indigo-400">Optimizing SOPs with cutting-edge AI</p>
        </div>
      </div>
    </div>
  );
}
