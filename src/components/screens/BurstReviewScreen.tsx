import React, { useState, useMemo } from 'react';
import { Zap, Clock, Check, X, CheckCircle2, ChevronRight, Award } from 'lucide-react';
import { FileRecord, ProjectConfig, ReviewStatus } from '../../types';
import { detectBurstGroups } from '../../services/analysisEngine';
import { Language, translations } from '../../i18n/translations';

interface BurstReviewScreenProps {
  records: FileRecord[];
  onSetDecision: (recordId: string, status: ReviewStatus) => void;
  config: ProjectConfig;
  onUpdateConfig: (cfg: ProjectConfig) => void;
  language: Language;
}

export const BurstReviewScreen: React.FC<BurstReviewScreenProps> = ({
  records,
  onSetDecision,
  config,
  onUpdateConfig,
  language,
}) => {
  const [activeGroupId, setActiveGroupId] = useState<string>('');
  const t = translations[language];

  const burstGroups = useMemo(() => {
    return detectBurstGroups(records, config.burstIntervalSeconds, config.minBurstCount);
  }, [records, config.burstIntervalSeconds, config.minBurstCount]);

  const groupEntries = Array.from(burstGroups.entries());
  const currentGroup = groupEntries.find(([id]) => id === activeGroupId) || groupEntries[0];

  return (
    <div className="flex flex-col h-[calc(100vh-94px)] bg-zinc-950 text-zinc-200">
      {/* Top Banner & Config */}
      <div className="p-4 bg-zinc-900 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700/80 text-zinc-300">
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white font-sans">
              {t.bursts.title}
            </h2>
            <p className="text-zinc-400 text-xs mt-0.5">
              {t.bursts.subtitle.replace('{interval}', String(config.burstIntervalSeconds))}
            </p>
          </div>
        </div>

        {/* Interval Config Slider */}
        <div className="flex items-center gap-4 bg-zinc-950 px-3.5 py-1.5 rounded-lg border border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">{t.bursts.intervalLabel}:</span>
            <input
              type="range"
              min={1}
              max={15}
              value={config.burstIntervalSeconds}
              onChange={(e) =>
                onUpdateConfig({ ...config, burstIntervalSeconds: Number(e.target.value) })
              }
              className="w-24 accent-amber-500 cursor-pointer"
            />
            <span className="font-mono font-semibold text-zinc-200 w-8">
              {config.burstIntervalSeconds}s
            </span>
          </div>

          <span className="text-zinc-500 font-mono text-[11px]">
            ({t.bursts.groupsFound.replace('{count}', String(groupEntries.length))})
          </span>
        </div>
      </div>

      {groupEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-zinc-500 p-8">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-3" />
          <p className="text-base font-semibold text-zinc-200">
            {t.bursts.noBurstsTitle}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            {t.bursts.noBurstsDesc}
          </p>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Burst Groups List */}
          <div className="w-80 bg-zinc-900/50 border-r border-zinc-800/80 overflow-y-auto p-3 space-y-2">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              {t.bursts.burstsList}
            </h3>
            {groupEntries.map(([id, files], idx) => {
              const isSelected = (currentGroup && currentGroup[0] === id) || (!currentGroup && idx === 0);
              const firstFile = files[0];

              return (
                <button
                  key={id}
                  onClick={() => setActiveGroupId(id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-zinc-800 border-zinc-700 text-white shadow-sm'
                      : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                  }`}
                >
                  <div className="truncate mr-2">
                    <div className="font-semibold text-xs flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>{t.bursts.burstItem.replace('{index}', String(idx + 1)).replace('{count}', String(files.length))}</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono mt-1">
                      {firstFile.captureDate}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600" />
                </button>
              );
            })}
          </div>

          {/* Right Column: Active Burst Sequence Viewer */}
          {currentGroup && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800">
                <h3 className="font-semibold text-white text-sm">
                  {t.bursts.burstReviewTitle.replace('{count}', String(currentGroup[1].length))}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {t.bursts.burstReviewDesc}
                </p>
              </div>

              {/* Photos in burst sequence */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentGroup[1].map((file, idx) => {
                  return (
                    <div
                      key={file.id}
                      className={`p-3.5 rounded-xl border bg-zinc-900/60 flex flex-col justify-between space-y-3 shadow-sm ${
                        file.reviewStatus === 'KEEP'
                          ? 'border-emerald-600/60'
                          : file.reviewStatus === 'DISCARD'
                          ? 'border-rose-600/60'
                          : 'border-zinc-800'
                      }`}
                    >
                      <div>
                        <div className="relative h-48 rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800 mb-2">
                          {file.thumbnailUrl ? (
                            <img src={file.thumbnailUrl} alt={file.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-mono text-xs text-zinc-500">
                              {file.format}
                            </div>
                          )}

                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-zinc-900/90 text-zinc-300 font-mono text-[10px] border border-zinc-800">
                            {t.bursts.frame.replace('{index}', String(idx + 1))}
                          </div>

                          {file.analysis?.laplacianVariance && (
                            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-zinc-900/90 text-zinc-300 font-mono text-[10px] border border-zinc-800">
                              {t.bursts.sharpnessScore.replace('{score}', String(file.analysis.laplacianVariance))}
                            </div>
                          )}
                        </div>

                        <p className="font-medium text-zinc-100 text-xs truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-[11px] text-zinc-400 font-mono mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-500" /> {file.captureDate}
                        </p>
                      </div>

                      {/* Burst Actions */}
                      <div className="pt-2 border-t border-zinc-800 space-y-2">
                        {/* Best Shot Button */}
                        <button
                          onClick={() => {
                            onSetDecision(file.id, 'KEEP');
                            currentGroup[1].forEach((other) => {
                              if (other.id !== file.id) onSetDecision(other.id, 'DISCARD');
                            });
                          }}
                          className="w-full py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-medium text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Award className="w-3.5 h-3.5 text-amber-400" />
                          <span>{t.bursts.bestShotBtn}</span>
                        </button>

                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {file.reviewStatus}
                          </span>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => onSetDecision(file.id, 'KEEP')}
                              className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                                file.reviewStatus === 'KEEP'
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                              }`}
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => onSetDecision(file.id, 'DISCARD')}
                              className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
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
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
