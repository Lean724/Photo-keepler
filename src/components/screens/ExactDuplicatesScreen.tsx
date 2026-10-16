import React, { useMemo } from 'react';
import { Copy, Check, X, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { FileRecord, ProjectConfig, ReviewStatus } from '../../types';
import { groupExactDuplicates } from '../../services/analysisEngine';
import { Language, translations } from '../../i18n/translations';

interface ExactDuplicatesScreenProps {
  records: FileRecord[];
  onSetDecision: (recordId: string, status: ReviewStatus) => void;
  config: ProjectConfig;
  language: Language;
}

export const ExactDuplicatesScreen: React.FC<ExactDuplicatesScreenProps> = ({
  records,
  onSetDecision,
  config,
  language,
}) => {
  const t = translations[language];

  const duplicateGroups = useMemo(() => {
    return groupExactDuplicates(records);
  }, [records]);

  const groupEntries = Array.from(duplicateGroups.entries());

  return (
    <div className="flex flex-col h-[calc(100vh-94px)] bg-zinc-950 text-zinc-200">
      {/* Top Banner */}
      <div className="p-4 bg-zinc-900 border-b border-zinc-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700/80 text-zinc-300">
            <Copy className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white font-sans">
              {t.exactDuplicates.title}
            </h2>
            <p className="text-zinc-400 text-xs mt-0.5">
              {t.exactDuplicates.subtitle}
            </p>
          </div>
        </div>

        <div>
          <span className="px-3 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 font-mono text-xs">
            {t.exactDuplicates.groupsFound.replace('{count}', String(groupEntries.length))}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {groupEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-3" />
            <p className="text-base font-semibold text-zinc-200">
              {t.exactDuplicates.noDuplicatesTitle}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              {t.exactDuplicates.noDuplicatesDesc}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300 flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{t.exactDuplicates.safeBanner}</span>
            </div>

            {groupEntries.map(([sha256, files], groupIndex) => {
              return (
                <div
                  key={sha256}
                  className="bg-zinc-900/70 rounded-2xl border border-zinc-800 overflow-hidden shadow-sm"
                >
                  {/* Group Header */}
                  <div className="bg-zinc-950 px-5 py-3 border-b border-zinc-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-zinc-100">
                        {t.exactDuplicates.groupTitle
                          .replace('{index}', String(groupIndex + 1))
                          .replace('{count}', String(files.length))}
                      </span>
                      <span className="text-zinc-500 font-mono text-[10px] truncate max-w-sm" title={sha256}>
                        SHA-256: {sha256.substring(0, 24)}...
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        onSetDecision(files[0].id, 'KEEP');
                        for (let i = 1; i < files.length; i++) {
                          onSetDecision(files[i].id, 'DISCARD');
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-medium text-xs cursor-pointer transition-colors"
                    >
                      {t.exactDuplicates.keepFirstAction}
                    </button>
                  </div>

                  {/* Group Items Grid */}
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className={`p-3.5 rounded-xl border bg-zinc-950 flex flex-col justify-between space-y-3 ${
                          file.reviewStatus === 'KEEP'
                            ? 'border-emerald-600/60'
                            : file.reviewStatus === 'DISCARD'
                            ? 'border-rose-600/60'
                            : 'border-zinc-800'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {file.thumbnailUrl ? (
                            <img
                              src={file.thumbnailUrl}
                              alt={file.name}
                              className="w-16 h-16 rounded-lg object-cover shrink-0 border border-zinc-800"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-zinc-900 flex items-center justify-center font-mono text-[10px] text-zinc-500 shrink-0">
                              {file.format}
                            </div>
                          )}

                          <div className="truncate text-xs">
                            <p className="font-medium text-zinc-100 truncate" title={file.name}>
                              {file.name}
                            </p>
                            <p className="text-[10px] text-zinc-500 truncate mt-0.5" title={file.relativePath}>
                              {file.relativePath}
                            </p>
                            <p className="text-[11px] text-zinc-400 font-mono mt-1">
                              {(file.size / 1024).toFixed(1)} KB • {file.captureDate || '—'}
                            </p>
                          </div>
                        </div>

                        {/* Inline Actions */}
                        <div className="flex items-center justify-between pt-2.5 border-t border-zinc-800 text-xs">
                          <span className="font-mono text-[10px] text-zinc-400">
                            {t.exactDuplicates.state}:{' '}
                            <strong
                              className={
                                file.reviewStatus === 'KEEP'
                                  ? 'text-emerald-400'
                                  : file.reviewStatus === 'DISCARD'
                                  ? 'text-rose-400'
                                  : 'text-amber-400'
                              }
                            >
                              {file.reviewStatus}
                            </strong>
                          </span>

                          <div className="flex gap-1.5">
                            <button
                              onClick={() => onSetDecision(file.id, 'KEEP')}
                              className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer flex items-center gap-1 ${
                                file.reviewStatus === 'KEEP'
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                              }`}
                            >
                              <Check className="w-3 h-3" /> {config.keepLabel}
                            </button>
                            <button
                              onClick={() => onSetDecision(file.id, 'DISCARD')}
                              className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer flex items-center gap-1 ${
                                file.reviewStatus === 'DISCARD'
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                              }`}
                            >
                              <X className="w-3 h-3" /> {config.discardLabel}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
