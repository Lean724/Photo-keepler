import React, { useState, useMemo } from 'react';
import { Sparkles, Check, X, CheckCircle2 } from 'lucide-react';
import { FileRecord, ProjectConfig, ReviewStatus } from '../../types';
import { groupVisualDuplicates } from '../../services/analysisEngine';
import { Language, translations } from '../../i18n/translations';

interface SimilarPhotosScreenProps {
  records: FileRecord[];
  onSetDecision: (recordId: string, status: ReviewStatus) => void;
  config: ProjectConfig;
  language: Language;
}

export const SimilarPhotosScreen: React.FC<SimilarPhotosScreenProps> = ({
  records,
  onSetDecision,
  config,
  language,
}) => {
  const [similarityThreshold, setSimilarityThreshold] = useState<number>(10);
  const t = translations[language];

  const similarGroups = useMemo(() => {
    return groupVisualDuplicates(records, similarityThreshold);
  }, [records, similarityThreshold]);

  return (
    <div className="flex flex-col h-[calc(100vh-94px)] bg-zinc-950 text-zinc-200">
      <div className="p-4 bg-zinc-900 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700/80 text-zinc-300">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white font-sans">
              {t.similar.title}
            </h2>
            <p className="text-zinc-400 text-xs mt-0.5">
              {t.similar.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
          <span className="text-zinc-400">{t.similar.threshold}:</span>
          <input
            type="range"
            min={4}
            max={16}
            value={similarityThreshold}
            onChange={(e) => setSimilarityThreshold(Number(e.target.value))}
            className="w-24 accent-indigo-500 cursor-pointer"
          />
          <span className="font-mono font-semibold text-zinc-200 w-12">{similarityThreshold} bits</span>
          <span className="text-[11px] text-zinc-500">
            ({t.similar.groupsFound.replace('{count}', String(similarGroups.length))})
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {similarGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-3" />
            <p className="text-base font-semibold text-zinc-200">
              {t.similar.noSimilarTitle}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              {t.similar.noSimilarDesc}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {similarGroups.map((group, groupIdx) => (
              <div
                key={group.groupId}
                className="bg-zinc-900/70 rounded-2xl border border-zinc-800 overflow-hidden shadow-sm"
              >
                <div className="bg-zinc-950 px-5 py-3 border-b border-zinc-800 flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-100">
                    {t.similar.groupTitle
                      .replace('{index}', String(groupIdx + 1))
                      .replace('{count}', String(group.records.length))}
                  </span>
                  <span className="text-zinc-400 font-mono text-[11px]">
                    {t.similar.similarityEst.replace(
                      '{pct}',
                      String(Math.max(0, 100 - group.avgDistance * 6).toFixed(0))
                    )}
                  </span>
                </div>

                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {group.records.map((file) => (
                    <div
                      key={file.id}
                      className={`p-3.5 rounded-xl border bg-zinc-950 flex flex-col justify-between space-y-2.5 ${
                        file.reviewStatus === 'KEEP'
                          ? 'border-emerald-600/60'
                          : file.reviewStatus === 'DISCARD'
                          ? 'border-rose-600/60'
                          : 'border-zinc-800'
                      }`}
                    >
                      <div>
                        <div className="h-36 rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden mb-2">
                          {file.thumbnailUrl ? (
                            <img src={file.thumbnailUrl} alt={file.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-mono text-zinc-500 text-xs">
                              {file.format}
                            </div>
                          )}
                        </div>
                        <p className="font-medium text-zinc-200 text-xs truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-[10px] text-zinc-500 truncate mt-0.5">{file.relativePath}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-xs">
                        <span className="text-[10px] text-zinc-400">{file.reviewStatus}</span>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => onSetDecision(file.id, 'KEEP')}
                            className={`px-2 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                              file.reviewStatus === 'KEEP'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onSetDecision(file.id, 'DISCARD')}
                            className={`px-2 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                              file.reviewStatus === 'DISCARD'
                                ? 'bg-rose-600 text-white'
                                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                            }`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
