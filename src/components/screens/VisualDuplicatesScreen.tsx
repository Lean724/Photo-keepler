import React, { useState, useMemo } from 'react';
import { Layers, Check, X, CheckCircle2 } from 'lucide-react';
import { FileRecord, ProjectConfig, ReviewStatus } from '../../types';
import { groupVisualDuplicates, computeHammingDistance } from '../../services/analysisEngine';
import { Language, translations } from '../../i18n/translations';

interface VisualDuplicatesScreenProps {
  records: FileRecord[];
  onSetDecision: (recordId: string, status: ReviewStatus) => void;
  config: ProjectConfig;
  language: Language;
}

export const VisualDuplicatesScreen: React.FC<VisualDuplicatesScreenProps> = ({
  records,
  onSetDecision,
  config,
  language,
}) => {
  const [maxHammingDistance, setMaxHammingDistance] = useState<number>(6);
  const t = translations[language];

  const visualGroups = useMemo(() => {
    return groupVisualDuplicates(records, maxHammingDistance);
  }, [records, maxHammingDistance]);

  return (
    <div className="flex flex-col h-[calc(100vh-94px)] bg-zinc-950 text-zinc-200">
      {/* Top Controls */}
      <div className="p-4 bg-zinc-900 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700/80 text-zinc-300">
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white font-sans">
              {t.visualDuplicates.title}
            </h2>
            <p className="text-zinc-400 text-xs mt-0.5">
              {t.visualDuplicates.subtitle}
            </p>
          </div>
        </div>

        {/* Distance Slider */}
        <div className="flex items-center gap-3 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
          <span className="text-zinc-400">{t.visualDuplicates.tolerance}:</span>
          <input
            type="range"
            min={0}
            max={12}
            value={maxHammingDistance}
            onChange={(e) => setMaxHammingDistance(Number(e.target.value))}
            className="w-24 accent-indigo-500 cursor-pointer"
          />
          <span className="font-mono font-semibold text-zinc-200 w-8">{maxHammingDistance} bits</span>
          <span className="text-[11px] text-zinc-500">
            ({t.visualDuplicates.groupsFound.replace('{count}', String(visualGroups.length))})
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {visualGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-3" />
            <p className="text-base font-semibold text-zinc-200">
              {t.visualDuplicates.noDuplicatesTitle}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              {t.visualDuplicates.noDuplicatesDesc}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {visualGroups.map((group, groupIdx) => {
              const primary = group.records[0];

              return (
                <div
                  key={group.groupId}
                  className="bg-zinc-900/70 rounded-2xl border border-zinc-800 overflow-hidden shadow-sm"
                >
                  <div className="bg-zinc-950 px-5 py-3 border-b border-zinc-800 flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-100">
                      {t.visualDuplicates.groupTitle
                        .replace('{index}', String(groupIdx + 1))
                        .replace('{count}', String(group.records.length))
                        .replace('{dist}', String(group.avgDistance))}
                    </span>

                    <button
                      onClick={() => {
                        onSetDecision(group.records[0].id, 'KEEP');
                        for (let i = 1; i < group.records.length; i++) {
                          onSetDecision(group.records[i].id, 'DISCARD');
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-medium text-xs cursor-pointer transition-colors"
                    >
                      {t.visualDuplicates.keepBestAction}
                    </button>
                  </div>

                  {/* Compare side by side */}
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.records.map((file, idx) => {
                      const distFromPrimary =
                        idx === 0
                          ? 0
                          : computeHammingDistance(primary.analysis?.dHash, file.analysis?.dHash);

                      return (
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
                          <div>
                            <div className="relative h-44 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 mb-2">
                              {file.thumbnailUrl ? (
                                <img
                                  src={file.thumbnailUrl}
                                  alt={file.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center font-mono text-zinc-500 text-xs">
                                  {file.format}
                                </div>
                              )}
                              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-zinc-900/90 text-zinc-300 text-[10px] font-mono border border-zinc-800">
                                {idx === 0
                                  ? t.visualDuplicates.reference
                                  : t.visualDuplicates.distance.replace('{dist}', String(distFromPrimary))}
                              </div>
                            </div>

                            <p className="font-medium text-zinc-100 text-xs truncate" title={file.name}>
                              {file.name}
                            </p>
                            <p className="text-[10px] text-zinc-500 truncate" title={file.relativePath}>
                              {file.relativePath}
                            </p>
                            <p className="text-[11px] text-zinc-400 font-mono mt-1">
                              {file.metadata?.width}×{file.metadata?.height} px • {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-2.5 border-t border-zinc-800 text-xs">
                            <span className="font-mono text-[10px] text-zinc-400">
                              {file.reviewStatus}
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
                      );
                    })}
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
