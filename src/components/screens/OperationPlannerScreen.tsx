import React, { useState, useMemo } from 'react';
import {
  PlayCircle,
  Download,
  AlertCircle,
  CheckCircle2,
  Copy,
  Move,
  ArrowRight,
  Check,
} from 'lucide-react';
import { FileRecord, OperationBatch, ProjectConfig } from '../../types';
import {
  simulateOperationBatch,
  generateBashScript,
  generatePowerShellScript,
} from '../../services/operationPlanner';
import { Language, translations } from '../../i18n/translations';

interface OperationPlannerScreenProps {
  records: FileRecord[];
  config: ProjectConfig;
  onExecuteBatch: (batch: OperationBatch) => void;
  language: Language;
}

export const OperationPlannerScreen: React.FC<OperationPlannerScreenProps> = ({
  records,
  config,
  onExecuteBatch,
  language,
}) => {
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'APPROVED' | 'DISCARD'>('ALL');
  const [isExecuting, setIsExecuting] = useState(false);
  const [hasExecuted, setHasExecuted] = useState(false);

  const t = translations[language];

  const simulatedBatch = useMemo(() => {
    return simulateOperationBatch(records, config);
  }, [records, config]);

  const filteredItems = useMemo(() => {
    if (filterCategory === 'ALL') return simulatedBatch.items;
    return simulatedBatch.items.filter((item) => item.category === filterCategory);
  }, [simulatedBatch, filterCategory]);

  const handleDownloadBash = () => {
    const script = generateBashScript(simulatedBatch, config);
    const blob = new Blob([script], { type: 'text/x-sh;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `photo_keepler_lote_${Date.now()}.sh`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPowerShell = () => {
    const script = generatePowerShellScript(simulatedBatch, config);
    const blob = new Blob([script], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `photo_keepler_lote_${Date.now()}.ps1`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirmExecution = () => {
    setIsExecuting(true);
    setTimeout(() => {
      onExecuteBatch(simulatedBatch);
      setIsExecuting(false);
      setHasExecuted(true);
    }, 600);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-94px)] bg-zinc-950 text-zinc-200">
      {/* Top Banner / Summary */}
      <div className="p-4 bg-zinc-900 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700/80 text-zinc-300">
            <PlayCircle className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white font-sans">
              {t.planner.title}
            </h2>
            <p className="text-zinc-400 text-xs mt-0.5">
              {t.planner.subtitle}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadBash}
            disabled={simulatedBatch.items.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 cursor-pointer disabled:opacity-40 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.planner.downloadBash}</span>
          </button>

          <button
            onClick={handleDownloadPowerShell}
            disabled={simulatedBatch.items.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 cursor-pointer disabled:opacity-40 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.planner.downloadPs1}</span>
          </button>

          <button
            onClick={handleConfirmExecution}
            disabled={simulatedBatch.items.length === 0 || isExecuting}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md cursor-pointer disabled:opacity-50 transition-all"
          >
            {isExecuting ? (
              <span>{t.planner.executing}</span>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>{t.planner.executeBtn}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Metrics Simulation Cards */}
      <div className="bg-zinc-900/60 border-b border-zinc-800 px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800">
          <span className="text-zinc-400 block">{t.planner.approvedCard.replace('{mode}', config.approvedMode)}</span>
          <span className="text-emerald-400 text-lg font-bold font-mono">
            {simulatedBatch.totalApproved}
          </span>
          <span className="text-zinc-500 text-[10px] block mt-0.5">
            {t.planner.approvedTarget}
          </span>
        </div>

        <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800">
          <span className="text-zinc-400 block">{t.planner.discardCard}</span>
          <span className="text-rose-400 text-lg font-bold font-mono">
            {simulatedBatch.totalDiscarded}
          </span>
          <span className="text-zinc-500 text-[10px] block mt-0.5">
            {t.planner.discardTarget}
          </span>
        </div>

        <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800">
          <span className="text-zinc-400 block">{t.planner.pendingCard}</span>
          <span className="text-amber-400 text-lg font-bold font-mono">
            {simulatedBatch.totalPendingBlocked}
          </span>
          <span className="text-zinc-500 text-[10px] block mt-0.5">
            {t.planner.pendingBlocked}
          </span>
        </div>

        <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800">
          <span className="text-zinc-400 block">{t.planner.spaceCard}</span>
          <span className="text-zinc-100 text-lg font-bold font-mono">
            {(simulatedBatch.totalBytes / (1024 * 1024)).toFixed(2)} MB
          </span>
          <span className="text-zinc-500 text-[10px] block mt-0.5">
            {t.planner.spaceEst}
          </span>
        </div>
      </div>

      {hasExecuted && (
        <div className="bg-emerald-950/60 border-b border-emerald-800/80 p-3 px-6 text-xs text-emerald-200 flex items-center justify-between">
          <span className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {t.planner.successBanner}
          </span>
        </div>
      )}

      {/* Operations Table */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Filter bar */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">{t.planner.filterLabel}:</span>
            <button
              onClick={() => setFilterCategory('ALL')}
              className={`px-3 py-1 rounded-lg cursor-pointer ${
                filterCategory === 'ALL' ? 'bg-zinc-800 text-white font-medium' : 'bg-zinc-950 text-zinc-400'
              }`}
            >
              {t.planner.allOps.replace('{count}', String(simulatedBatch.items.length))}
            </button>
            <button
              onClick={() => setFilterCategory('APPROVED')}
              className={`px-3 py-1 rounded-lg cursor-pointer ${
                filterCategory === 'APPROVED' ? 'bg-zinc-800 text-emerald-400 font-medium' : 'bg-zinc-950 text-zinc-400'
              }`}
            >
              {t.planner.approvedOps.replace('{count}', String(simulatedBatch.totalApproved))}
            </button>
            <button
              onClick={() => setFilterCategory('DISCARD')}
              className={`px-3 py-1 rounded-lg cursor-pointer ${
                filterCategory === 'DISCARD' ? 'bg-zinc-800 text-rose-400 font-medium' : 'bg-zinc-950 text-zinc-400'
              }`}
            >
              {t.planner.discardOps.replace('{count}', String(simulatedBatch.totalDiscarded))}
            </button>
          </div>

          <div className="text-zinc-500 text-[11px]">
            {t.planner.conflictHint}
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
            <AlertCircle className="w-8 h-8 mb-2 text-zinc-600" />
            <p className="text-sm font-medium">{t.planner.noOpsTitle}</p>
            <p className="text-xs text-zinc-500 mt-1">{t.planner.noOpsDesc}</p>
          </div>
        ) : (
          <div className="bg-zinc-900/70 rounded-2xl border border-zinc-800 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 uppercase font-mono text-[10px]">
                  <th className="py-3 px-4">{t.planner.colOp}</th>
                  <th className="py-3 px-4">{t.planner.colSource}</th>
                  <th className="py-3 px-4">{t.planner.colTarget}</th>
                  <th className="py-3 px-4">{t.planner.colConflicts}</th>
                  <th className="py-3 px-4 text-right">{t.planner.colSize}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono text-[11px]">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      {item.category === 'APPROVED' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1 w-max text-[10px]">
                          {item.operationType === 'MOVE' ? <Move className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {item.operationType}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold flex items-center gap-1 w-max text-[10px]">
                          <Copy className="w-3 h-3" /> COPY
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-4 text-zinc-300 truncate max-w-xs" title={item.sourcePath}>
                      {item.fileName}
                    </td>

                    <td className="py-2.5 px-4 text-zinc-200">
                      <div className="flex items-center gap-1.5">
                        <ArrowRight className="w-3 h-3 text-zinc-600 shrink-0" />
                        <span className="text-zinc-300 truncate max-w-md" title={item.finalTargetPath}>
                          {item.finalTargetPath}
                        </span>
                      </div>
                    </td>

                    <td className="py-2.5 px-4">
                      {item.collisionResolved ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px]">
                          {t.planner.renamedTo.replace('{name}', item.targetFileName)}
                        </span>
                      ) : (
                        <span className="text-zinc-500 text-[10px]">{t.planner.noConflict}</span>
                      )}
                    </td>

                    <td className="py-2.5 px-4 text-right text-zinc-400">
                      {(item.fileSize / 1024).toFixed(1)} KB
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
