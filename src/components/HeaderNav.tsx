import React from 'react';
import {
  FolderOpen,
  Image as ImageIcon,
  Grid,
  Info,
  Copy,
  Layers,
  Sparkles,
  Zap,
  Activity,
  AlertTriangle,
  PlayCircle,
  History,
  FileCode2,
  ShieldCheck,
  Globe,
  Settings,
} from 'lucide-react';
import { FileRecord, ProjectConfig, ViewMode } from '../types';
import { Language, translations } from '../i18n/translations';

interface HeaderNavProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  config: ProjectConfig;
  records: FileRecord[];
  onOpenSettings: () => void;
  language: Language;
  onToggleLanguage: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentView,
  onSelectView,
  config,
  records,
  onOpenSettings,
  language,
  onToggleLanguage,
}) => {
  const t = translations[language];

  const pendingCount = records.filter((r) => r.reviewStatus === 'PENDING').length;
  const keepCount = records.filter((r) => r.reviewStatus === 'KEEP').length;
  const discardCount = records.filter((r) => r.reviewStatus === 'DISCARD').length;
  const errorCount = records.filter((r) => r.reviewStatus === 'ERROR').length;

  const navItems: Array<{ id: ViewMode; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: 'PROJECT', label: t.nav.project, icon: <FolderOpen className="w-3.5 h-3.5" /> },
    { id: 'SINGLE_REVIEW', label: t.nav.review, icon: <ImageIcon className="w-3.5 h-3.5" />, badge: pendingCount },
    { id: 'GRID_VIEW', label: t.nav.grid, icon: <Grid className="w-3.5 h-3.5" /> },
    { id: 'METADATA', label: t.nav.metadata, icon: <Info className="w-3.5 h-3.5" /> },
    { id: 'EXACT_DUPLICATES', label: t.nav.exactDuplicates, icon: <Copy className="w-3.5 h-3.5" /> },
    { id: 'VISUAL_DUPLICATES', label: t.nav.visualDuplicates, icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'SIMILAR_PHOTOS', label: t.nav.similar, icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'BURSTS', label: t.nav.bursts, icon: <Zap className="w-3.5 h-3.5" /> },
    { id: 'QUALITY_BLUR', label: t.nav.quality, icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'DAMAGED_FILES', label: t.nav.damaged, icon: <AlertTriangle className="w-3.5 h-3.5" />, badge: errorCount },
    { id: 'OPERATION_PLANNER', label: t.nav.planner, icon: <PlayCircle className="w-3.5 h-3.5" /> },
    { id: 'HISTORY_JOURNAL', label: t.nav.journal, icon: <History className="w-3.5 h-3.5" /> },
    { id: 'QT_CPP_DOCS', label: t.nav.cpp, icon: <FileCode2 className="w-3.5 h-3.5 text-emerald-400" /> },
  ];

  return (
    <header className="bg-zinc-950 border-b border-zinc-800/80 text-zinc-100 sticky top-0 z-50">
      {/* Top Header */}
      <div className="px-5 py-2.5 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/60">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 via-orange-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md text-xs tracking-wider">
            PK
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-white font-sans">
                {t.app.name}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                {t.app.offlineBadge}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                {t.app.safeBadge}
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
              <span>{config.name}</span>
              <span className="text-zinc-600">•</span>
              <span>{t.app.modeLabel}: <strong className="text-zinc-300 font-mono text-[10px]">{config.approvedMode}</strong></span>
            </div>
          </div>
        </div>

        {/* Status Counters & Tools */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300">
            <span className="text-zinc-500">{t.app.total}:</span>
            <span className="font-semibold">{records.length}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-amber-300">
            <span className="text-zinc-500">{t.app.pending}:</span>
            <span className="font-semibold">{pendingCount}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-emerald-400">
            <span className="text-zinc-500">{config.keepLabel}:</span>
            <span className="font-semibold">{keepCount}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-rose-400">
            <span className="text-zinc-500">{config.discardLabel}:</span>
            <span className="font-semibold">{discardCount}</span>
          </div>

          {errorCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-950/40 border border-rose-800/60 text-rose-300">
              <span className="text-rose-400">{t.app.errors}:</span>
              <span className="font-semibold">{errorCount}</span>
            </div>
          )}

          <div className="h-4 w-[1px] bg-zinc-800 mx-1" />

          {/* Language Switcher */}
          <button
            onClick={onToggleLanguage}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors text-xs font-semibold cursor-pointer"
            title="Cambiar idioma / Change language"
          >
            <Globe className="w-3.5 h-3.5 text-zinc-400" />
            <span>{language.toUpperCase()}</span>
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors text-xs font-medium cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-zinc-400" />
            <span>{t.app.settings}</span>
          </button>
        </div>
      </div>

      {/* Clean Tab Navigation */}
      <nav className="flex items-center overflow-x-auto px-3 py-1 scrollbar-none gap-1 bg-zinc-950 text-xs">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-zinc-800 text-white shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {typeof item.badge === 'number' && item.badge > 0 && (
                <span
                  className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-zinc-700 text-zinc-200' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
