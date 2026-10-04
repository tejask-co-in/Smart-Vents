import React, { useState } from 'react';
import { ShieldCheck, FileText, Check, AlertCircle } from 'lucide-react';
import { LegalConfig } from '../../types/vent';
import { defaultLegalConfig, legalDocuments, LegalDocument } from './legalContent';

export const LegalCenter: React.FC = () => {
  const [selectedDocId, setSelectedDocId] = useState<string>('privacy_policy');
  const [legalConfig, setLegalConfig] = useState<LegalConfig>(defaultLegalConfig);
  const [showConfigEditor, setShowConfigEditor] = useState(false);

  const selectedDoc = legalDocuments.find((d) => d.id === selectedDocId) || legalDocuments[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Legal, Privacy & Compliance Center</span>
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Transparent policies engineered for statutory compliance (DPDP, GDPR principles) without deceptive badges.
          </p>
        </div>

        <button
          onClick={() => setShowConfigEditor(!showConfigEditor)}
          className="text-xs text-neutral-400 hover:text-white px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 self-start sm:self-auto"
        >
          {showConfigEditor ? 'Hide Legal Placeholders' : 'Configure Entity Details'}
        </button>
      </div>

      {/* Placeholders Editor */}
      {showConfigEditor && (
        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
          <div className="text-xs font-semibold text-neutral-200">
            Legal Entity Configuration Placeholders
          </div>
          <p className="text-[11px] text-neutral-400">
            Before public launch or enterprise deployment, update these placeholders with verified entity counsel data.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[10px] font-mono text-neutral-400 uppercase">Entity / Developer Name</label>
              <input
                type="text"
                value={legalConfig.legalEntityName}
                onChange={(e) => setLegalConfig({ ...legalConfig, legalEntityName: e.target.value })}
                className="mt-1 w-full p-2 rounded bg-neutral-900 border border-neutral-800 text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-neutral-400 uppercase">Privacy Email</label>
              <input
                type="text"
                value={legalConfig.privacyEmail}
                onChange={(e) => setLegalConfig({ ...legalConfig, privacyEmail: e.target.value })}
                className="mt-1 w-full p-2 rounded bg-neutral-900 border border-neutral-800 text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-neutral-400 uppercase">Governing Law Jurisdiction</label>
              <input
                type="text"
                value={legalConfig.governingLaw}
                onChange={(e) => setLegalConfig({ ...legalConfig, governingLaw: e.target.value })}
                className="mt-1 w-full p-2 rounded bg-neutral-900 border border-neutral-800 text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-neutral-400 uppercase">Grievance Officer</label>
              <input
                type="text"
                value={legalConfig.grievanceContact}
                onChange={(e) => setLegalConfig({ ...legalConfig, grievanceContact: e.target.value })}
                className="mt-1 w-full p-2 rounded bg-neutral-900 border border-neutral-800 text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Document Selector & Reader */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Navigation list of all 10 documents */}
        <div className="space-y-1.5">
          {legalDocuments.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setSelectedDocId(doc.id)}
              className={`w-full text-left p-2.5 rounded-lg text-xs transition flex flex-col ${
                selectedDocId === doc.id
                  ? 'bg-neutral-800 text-white font-medium shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
              }`}
            >
              <span>{doc.title}</span>
              <span className="text-[10px] text-neutral-400 line-clamp-1">{doc.description}</span>
            </button>
          ))}
        </div>

        {/* Document Content Viewport */}
        <div className="md:col-span-2 p-5 rounded-xl bg-neutral-950 border border-neutral-800/80 max-h-[600px] overflow-y-auto">
          <div className="prose prose-invert prose-xs max-w-none text-neutral-300 leading-relaxed space-y-3 font-sans">
            <div className="whitespace-pre-wrap font-sans text-xs">
              {selectedDoc.getContent(legalConfig)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
