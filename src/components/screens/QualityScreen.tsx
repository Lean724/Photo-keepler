import React, { useState } from 'react';
import {
  Activity,
  Check,
  X,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { FileRecord, ProjectConfig, ReviewStatus } from '../../types';
import { Language, translations } from '../../i18n/translations';

interface QualityScreenProps {
  records: FileRecord[];
  onSetDecision: (recordId: string, status: ReviewStatus) => void;
  config: ProjectConfig;
  onUpdateConfig: (cfg: ProjectConfig) => void;
  language: Language;
}

export const QualityScreen: React.FC<QualityScreenProps> = ({
  records,
  onSetDecision,
  config,
  onUpdateConfig,
  language,
}) => {
  const [activeTab, setActiveTab] = useState<'BLUR' | 'DIMENSIONS'>('BLUR');
  const t = translations[language];

  const blurryPhotos = records.filter(
    (r) =>
      r.analysis?.laplacianVariance !== undefined &&
      r.analysis.laplacianVariance < config.blurThreshold
  );

  const smallPhotos = records.filter(
    (r) =>
      (r.metadata?.width && r.metadata.width < config.smallImageMaxWidth) ||
      (r.metadata?.height && r.metadata.height < config.smallImageMaxHeight) ||
      r.size < config.smallImageMaxBytes
  );

  return (
    <div className="flex flex-col h-[calc(100vh-94px)] bg-zinc-950 text-zinc-200">
      {/* Top Controls & Banner */}
      <div className="p-4 bg-zinc-900 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700/80 text-zinc-300">
            <Activity className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white font-sans">
              {t.quality.title}
            </h2>
            <p className="text-zinc-400 text-xs mt-0.5">
              {t.quality.subtitle}
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setActiveTab('BLUR')}
            className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
              activeTab === 'BLUR' ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {t.quality.blurryTab.replace('{count}', String(blurryPhotos.length))}
          </button>
          <button
            onClick={() => setActiveTab('DIMENSIONS')}
            className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
              activeTab === 'DIMENSIONS'
                ? 'bg-zinc-800 text-white font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {t.quality.dimensionsTab.replace('{count}', String(smallPhotos.length))}
          </button>
        </div>
      </div>

      {/* Threshold controls header */}
      <div className="bg-zinc-900/60 border-b border-zinc-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4 text-xs">
        {activeTab === 'BLUR' ? (
          <div className="flex items-center gap-4">
            <span className="text-zinc-400">{t.quality.blurThresholdLabel}:</span>
            <input
              type="range"
              min={20}
              max={150}
              step={5}
              value={config.blurThreshold}
              onChange={(e) =>
                onUpdateConfig({ ...config, blurThreshold: Number(e.target.value) })
              }
              className="w-32 accent-sky-500 cursor-pointer"
            />
            <span className="font-mono font-semibold text-zinc-200 w-12">{config.blurThreshold}</span>
            <span className="text-zinc-500 text-[11px]">
              {t.quality.blurHint}
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">{t.quality.maxWidth}:</span>
              <input
                type="number"
                value={config.smallImageMaxWidth}
                onChange={(e) =>
                  onUpdateConfig({ ...config, smallImageMaxWidth: Number(e.target.value) })
                }
                className="w-16 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-200 font-mono text-xs"
              />
              <span className="text-zinc-500">px</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-zinc-400">{t.quality.maxHeight}:</span>
              <input
                type="number"
                value={config.smallImageMaxHeight}
                onChange={(e) =>
                  onUpdateConfig({ ...config, smallImageMaxHeight: Number(e.target.value) })
                }
                className="w-16 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-200 font-mono text-xs"
              />
              <span className="text-zinc-500">px</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-zinc-400">{t.quality.maxBytes}:</span>
              <input
                type="number"
                value={Math.round(config.smallImageMaxBytes / 1024)}
                onChange={(e) =>
                  onUpdateConfig({ ...config, smallImageMaxBytes: Number(e.target.value) * 1024 })
                }
                className="w-16 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-200 font-mono text-xs"
              />
              <span className="text-zinc-500">KB</span>
            </div>
          </div>
        )}

        <div className="text-[11px] text-zinc-400 bg-zinc-950 px-3 py-1 rounded-lg border border-zinc-800 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-zinc-400" />
          <span>{t.quality.suggestionBanner}</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'BLUR' ? (
          blurryPhotos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-3" />
              <p className="text-base font-semibold text-zinc-200">
                {t.quality.allSharpTitle}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                {t.quality.allSharpDesc}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {blurryPhotos.map((file) => (
                <div
                  key={file.id}
                  className={`p-3.5 rounded-2xl border bg-zinc-900/70 flex flex-col justify-between space-y-3 ${
                    file.reviewStatus === 'KEEP'
                      ? 'border-emerald-600/60'
                      : file.reviewStatus === 'DISCARD'
                      ? 'border-rose-600/60'
                      : 'border-zinc-800'
                  }`}
                >
                  <div>
                    <div className="h-44 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden relative mb-2">
                      {file.thumbnailUrl ? (
                        <img src={file.thumbnailUrl} alt={file.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-mono text-xs text-zinc-500">
                          {file.format}
                        </div>
                      )}
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-zinc-900/90 text-amber-300 font-mono text-[10px] border border-zinc-800">
                        {t.quality.varianceScore.replace('{val}', String(file.analysis?.laplacianVariance))}
                      </div>
                    </div>

                    <p className="font-medium text-zinc-100 text-xs truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-[10px] text-zinc-500 truncate mt-0.5">{file.relativePath}</p>
                    <p className="text-[11px] text-zinc-400 font-mono mt-1">
                      {file.metadata?.exposureTime} • f/{file.metadata?.fNumber} • ISO {file.metadata?.iso}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-zinc-800 text-xs">
                    <span className="font-mono text-[10px] text-zinc-400">{file.reviewStatus}</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => onSetDecision(file.id, 'KEEP')}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                          file.reviewStatus === 'KEEP'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                        }`}
                      >
                        <Check className="w-3 h-3" /> {config.keepLabel}
                      </button>
                      <button
                        onClick={() => onSetDecision(file.id, 'DISCARD')}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
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
          )
        ) : (
          /* Dimensions Tab */
          smallPhotos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-3" />
              <p className="text-base font-semibold text-zinc-200">
                {t.quality.noSmallTitle}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {smallPhotos.map((file) => (
                <div
                  key={file.id}
                  className={`p-3.5 rounded-2xl border bg-zinc-900/70 flex flex-col justify-between space-y-3 ${
                    file.reviewStatus === 'KEEP'
                      ? 'border-emerald-600/60'
                      : file.reviewStatus === 'DISCARD'
                      ? 'border-rose-600/60'
                      : 'border-zinc-800'
                  }`}
                >
                  <div>
                    <div className="h-44 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden flex items-center justify-center mb-2">
                      {file.thumbnailUrl ? (
                        <img
                          src={file.thumbnailUrl}
                          alt={file.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <div className="font-mono text-xs text-zinc-500">{file.format}</div>
                      )}
                    </div>

                    <p className="font-medium text-zinc-100 text-xs truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-[10px] text-zinc-500 truncate mt-0.5">{file.relativePath}</p>
                    <p className="text-[11px] text-zinc-400 font-mono mt-1">
                      {file.metadata?.width || '—'} × {file.metadata?.height || '—'} px •{' '}
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-zinc-800 text-xs">
                    <span className="font-mono text-[10px] text-zinc-400">{file.reviewStatus}</span>
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
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};
