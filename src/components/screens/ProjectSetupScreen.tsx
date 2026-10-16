import React, { useRef } from 'react';
import {
  FolderOpen,
  Sparkles,
  HardDrive,
  Copy,
  Move,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { ApprovedFileMode, ProjectConfig } from '../../types';
import { Language, translations } from '../../i18n/translations';

interface ProjectSetupScreenProps {
  config: ProjectConfig;
  onUpdateConfig: (cfg: ProjectConfig) => void;
  onLoadSpecTestCollection: () => void;
  onScanLocalDirectory: (files: FileList) => void;
  isScanning: boolean;
  totalRecordsCount: number;
  language: Language;
}

export const ProjectSetupScreen: React.FC<ProjectSetupScreenProps> = ({
  config,
  onUpdateConfig,
  onLoadSpecTestCollection,
  onScanLocalDirectory,
  isScanning,
  totalRecordsCount,
  language,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[language];

  const handleModeChange = (mode: ApprovedFileMode) => {
    onUpdateConfig({ ...config, approvedMode: mode });
  };

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-8 text-zinc-200">
      {/* Top Banner Card */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-7 shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white tracking-tight font-sans">
              {t.project.title}
            </h1>
            <p className="text-zinc-400 text-sm max-w-2xl leading-relaxed">
              {t.project.subtitle}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
            <button
              onClick={onLoadSpecTestCollection}
              disabled={isScanning}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 font-medium text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{t.project.loadDemo}</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              // @ts-ignore
              webkitdirectory=""
              directory=""
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  onScanLocalDirectory(e.target.files);
                }
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isScanning}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <FolderOpen className="w-4 h-4" />
              <span>{t.project.scanFolder}</span>
            </button>
          </div>
        </div>

        {totalRecordsCount > 0 && (
          <div className="mt-5 pt-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-300">
            <span className="flex items-center gap-2 text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              {t.project.activeCollection.replace('{count}', String(totalRecordsCount))}
            </span>
            <span className="text-zinc-400">{t.project.collectionHint}</span>
          </div>
        )}
      </div>

      {/* Grid of Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Directories */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2.5 text-zinc-100 font-semibold text-sm border-b border-zinc-800 pb-3">
            <HardDrive className="w-4 h-4 text-indigo-400" />
            <span>{t.project.pathsTitle}</span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block text-zinc-400 font-medium mb-1">
                {t.project.projectName}
              </label>
              <input
                type="text"
                value={config.name}
                onChange={(e) => onUpdateConfig({ ...config, name: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-600"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1">
                {t.project.sourceDir}
              </label>
              <input
                type="text"
                value={config.sourceDirectory}
                onChange={(e) => onUpdateConfig({ ...config, sourceDirectory: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-300 font-mono text-[11px] focus:outline-none focus:border-zinc-600"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1">
                {t.project.approvedDir}
              </label>
              <input
                type="text"
                value={config.approvedDirectory}
                onChange={(e) => onUpdateConfig({ ...config, approvedDirectory: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-300 font-mono text-[11px] focus:outline-none focus:border-zinc-600"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1">
                {t.project.discardDir}
              </label>
              <input
                type="text"
                value={config.discardDirectory}
                onChange={(e) => onUpdateConfig({ ...config, discardDirectory: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-300 font-mono text-[11px] focus:outline-none focus:border-zinc-600"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1">
                {t.project.cacheDir}
              </label>
              <input
                type="text"
                value={config.cacheDirectory}
                onChange={(e) => onUpdateConfig({ ...config, cacheDirectory: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-300 font-mono text-[11px] focus:outline-none focus:border-zinc-600"
              />
            </div>
          </div>
        </div>

        {/* Operating Rules */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2.5 text-zinc-100 font-semibold text-sm border-b border-zinc-800 pb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{t.project.policiesTitle}</span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-zinc-300 font-medium mb-2">
                {t.project.approvedModeLabel}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleModeChange('COPY')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    config.approvedMode === 'COPY'
                      ? 'bg-zinc-800 border-zinc-600 text-white shadow-sm'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold text-xs mb-1">
                    <Copy className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{t.project.copyMode}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    {t.project.copyModeDesc}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleModeChange('MOVE')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    config.approvedMode === 'MOVE'
                      ? 'bg-zinc-800 border-zinc-600 text-white shadow-sm'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold text-xs mb-1">
                    <Move className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t.project.moveMode}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    {t.project.moveModeDesc}
                  </p>
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
              <span className="font-semibold text-zinc-200 block mb-1">
                {t.project.discardPolicyTitle}
              </span>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                {t.project.discardPolicyDesc}
              </p>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-zinc-800">
              <label className="flex items-center gap-2.5 text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.excludeOutputDirs}
                  onChange={(e) =>
                    onUpdateConfig({ ...config, excludeOutputDirs: e.target.checked })
                  }
                  className="rounded border-zinc-700 text-indigo-500 focus:ring-0"
                />
                <span>{t.project.excludeOutputs}</span>
              </label>

              <label className="flex items-center gap-2.5 text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.associateSidecars}
                  onChange={(e) =>
                    onUpdateConfig({ ...config, associateSidecars: e.target.checked })
                  }
                  className="rounded border-zinc-700 text-indigo-500 focus:ring-0"
                />
                <span>{t.project.associateSidecars}</span>
              </label>

              <label className="flex items-center gap-2.5 text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.autoAdvanceOnDecision}
                  onChange={(e) =>
                    onUpdateConfig({ ...config, autoAdvanceOnDecision: e.target.checked })
                  }
                  className="rounded border-zinc-700 text-indigo-500 focus:ring-0"
                />
                <span>{t.project.autoAdvance}</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
