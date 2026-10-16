import React from 'react';
import {
  History,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileCheck,
  Trash2,
} from 'lucide-react';
import { JournalEntry, OperationBatch } from '../../types';
import { Language, translations } from '../../i18n/translations';

interface HistoryJournalScreenProps {
  journal: JournalEntry[];
  batches: OperationBatch[];
  onUndoBatch: (batchId: string) => void;
  onClearJournal: () => void;
  language: Language;
}

export const HistoryJournalScreen: React.FC<HistoryJournalScreenProps> = ({
  journal,
  batches,
  onUndoBatch,
  onClearJournal,
  language,
}) => {
  const t = translations[language];

  return (
    <div className="flex flex-col h-[calc(100vh-94px)] bg-zinc-950 text-zinc-200">
      {/* Top Banner */}
      <div className="p-4 bg-zinc-900 border-b border-zinc-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700/80 text-zinc-300">
            <History className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white font-sans">
              {t.journal.title}
            </h2>
            <p className="text-zinc-400 text-xs mt-0.5">
              {t.journal.subtitle}
            </p>
          </div>
        </div>

        <button
          onClick={onClearJournal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 cursor-pointer transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{t.journal.clearBtn}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Batches with Undo section */}
        {batches.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span>{t.journal.recentBatches}</span>
            </h3>

            <div className="space-y-3">
              {batches.map((b) => (
                <div
                  key={b.id}
                  className="bg-zinc-900/70 p-4 rounded-2xl border border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-semibold text-zinc-100 font-mono text-xs">{b.id}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                        {b.state}
                      </span>
                      <span className="text-zinc-500 font-mono text-[11px]">{b.timestamp.replace('T', ' ').substring(0, 19)}</span>
                    </div>

                    <div className="flex items-center gap-3 text-zinc-400 mt-2">
                      <span>Modo: <strong className="text-zinc-200">{b.approvedMode}</strong></span>
                      <span>•</span>
                      <span>Aprobadas: <strong className="text-emerald-400">{b.totalApproved}</strong></span>
                      <span>•</span>
                      <span>Descartadas: <strong className="text-rose-400">{b.totalDiscarded}</strong></span>
                      <span>•</span>
                      <span>Total: <strong className="text-zinc-200">{b.items.length}</strong></span>
                    </div>
                  </div>

                  {b.canUndo && (
                    <button
                      onClick={() => onUndoBatch(b.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-zinc-700 font-medium text-xs cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                      <span>{t.journal.undoBatch}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audit Journal Timeline */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>{t.journal.timelineTitle}</span>
          </h3>

          <div className="bg-zinc-900/70 rounded-2xl border border-zinc-800 divide-y divide-zinc-800/80">
            {journal.map((entry) => (
              <div key={entry.id} className="p-4 flex items-start gap-3.5 text-xs">
                <div className="mt-0.5">
                  {entry.status === 'SUCCESS' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : entry.status === 'WARNING' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-200">{entry.action}</span>
                    <span className="text-zinc-500 font-mono text-[10px]">
                      {entry.timestamp.replace('T', ' ').substring(0, 19)}
                    </span>
                  </div>
                  <p className="text-zinc-400 mt-1 leading-relaxed">{entry.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
