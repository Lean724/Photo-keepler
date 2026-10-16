import React, { useState, useMemo } from 'react';
import {
  Check,
  X,
  ArrowUpDown,
  Filter,
  CheckSquare,
  Square,
  AlertCircle,
} from 'lucide-react';
import { FileRecord, ProjectConfig, ReviewStatus } from '../../types';
import { Language, translations } from '../../i18n/translations';

interface GridViewScreenProps {
  records: FileRecord[];
  onOpenSingleReview: (index: number) => void;
  onSetDecision: (recordId: string, status: ReviewStatus) => void;
  onBatchDecision: (recordIds: string[], status: ReviewStatus) => void;
  config: ProjectConfig;
  language: Language;
}

export const GridViewScreen: React.FC<GridViewScreenProps> = ({
  records,
  onOpenSingleReview,
  onSetDecision,
  onBatchDecision,
  config,
  language,
}) => {
  const [thumbSize, setThumbSize] = useState<number>(180);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [formatFilter, setFormatFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size' | 'variance'>('date');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const t = translations[language];

  const uniqueFormats = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => set.add(r.format));
    return Array.from(set);
  }, [records]);

  const filteredRecords = useMemo(() => {
    let result = [...records];

    if (statusFilter !== 'ALL') {
      result = result.filter((r) => r.reviewStatus === statusFilter);
    }

    if (formatFilter !== 'ALL') {
      result = result.filter((r) => r.format === formatFilter);
    }

    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        const da = a.captureDate ? new Date(a.captureDate).getTime() : 0;
        const db = b.captureDate ? new Date(b.captureDate).getTime() : 0;
        comparison = da - db;
      } else if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'size') {
        comparison = a.size - b.size;
      } else if (sortBy === 'variance') {
        const va = a.analysis?.laplacianVariance ?? 0;
        const vb = b.analysis?.laplacianVariance ?? 0;
        comparison = va - vb;
      }
      return sortAsc ? comparison : -comparison;
    });

    return result;
  }, [records, statusFilter, formatFilter, sortBy, sortAsc]);

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredRecords.map((r) => r.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleApplyBatchStatus = (status: ReviewStatus) => {
    if (selectedIds.size === 0) return;
    onBatchDecision(Array.from(selectedIds), status);
    clearSelection();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-94px)] bg-zinc-950 text-zinc-200">
      {/* Top Filter Bar */}
      <div className="p-3.5 bg-zinc-900 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Status Filter Chips */}
          <div className="flex items-center rounded-lg bg-zinc-950 p-1 border border-zinc-800">
            <span className="text-zinc-500 px-2 flex items-center gap-1">
              <Filter className="w-3 h-3" /> {t.grid.filterStatus}:
            </span>
            {['ALL', 'PENDING', 'KEEP', 'DISCARD', 'ERROR'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                  statusFilter === st
                    ? 'bg-zinc-800 text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {st === 'ALL'
                  ? t.grid.all
                  : st === 'PENDING'
                  ? t.grid.pending
                  : st === 'KEEP'
                  ? config.keepLabel
                  : st === 'DISCARD'
                  ? config.discardLabel
                  : t.app.errors}
              </button>
            ))}
          </div>

          {/* Format Filter */}
          {uniqueFormats.length > 1 && (
            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-zinc-300 text-xs focus:outline-none"
            >
              <option value="ALL">{t.grid.allFormats}</option>
              {uniqueFormats.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          )}

          {/* Sort By */}
          <div className="flex items-center gap-1.5 bg-zinc-950 rounded-lg px-2.5 py-1 border border-zinc-800">
            <span className="text-zinc-500">{t.grid.sortBy}:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-zinc-300 text-xs focus:outline-none cursor-pointer"
            >
              <option value="date">{t.grid.date}</option>
              <option value="name">{t.grid.name}</option>
              <option value="size">{t.grid.size}</option>
              <option value="variance">{t.grid.sharpness}</option>
            </select>
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="p-0.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Thumbnail Size Slider */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">{t.grid.thumbSize}:</span>
            <input
              type="range"
              min={120}
              max={320}
              step={20}
              value={thumbSize}
              onChange={(e) => setThumbSize(Number(e.target.value))}
              className="w-20 accent-indigo-500 cursor-pointer"
            />
          </div>

          <div className="text-zinc-400 font-mono text-[11px]">
            {t.grid.showing
              .replace('{shown}', String(filteredRecords.length))
              .replace('{total}', String(records.length))}
          </div>
        </div>
      </div>

      {/* Bulk Selection Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-zinc-900 border-b border-zinc-800 px-5 py-2 flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-zinc-200">
              {t.grid.selectedCount.replace('{count}', String(selectedIds.size))}
            </span>
            <button
              onClick={selectAll}
              className="text-indigo-400 hover:text-indigo-300 cursor-pointer font-medium"
            >
              {t.grid.selectAll.replace('{count}', String(filteredRecords.length))}
            </button>
            <button
              onClick={clearSelection}
              className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
            >
              {t.grid.deselect}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleApplyBatchStatus('KEEP')}
              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1 cursor-pointer"
            >
              <Check className="w-3 h-3" />
              <span>{t.grid.markKeep}</span>
            </button>
            <button
              onClick={() => handleApplyBatchStatus('DISCARD')}
              className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>{t.grid.markDiscard}</span>
            </button>
            <button
              onClick={() => handleApplyBatchStatus('PENDING')}
              className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 cursor-pointer"
            >
              {t.grid.markPending}
            </button>
          </div>
        </div>
      )}

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
            <AlertCircle className="w-8 h-8 mb-2 text-zinc-600" />
            <p className="text-sm font-medium">{t.grid.noMatches}</p>
          </div>
        ) : (
          <div
            className="grid gap-3.5"
            style={{
              gridTemplateColumns: `repeat(auto-fill, minmax(${thumbSize}px, 1fr))`,
            }}
          >
            {filteredRecords.map((record) => {
              const isSelected = selectedIds.has(record.id);
              const originalIndex = records.findIndex((r) => r.id === record.id);

              return (
                <div
                  key={record.id}
                  onClick={() => onOpenSingleReview(originalIndex >= 0 ? originalIndex : 0)}
                  className={`group relative bg-zinc-900/80 rounded-xl overflow-hidden border transition-all cursor-pointer hover:shadow-lg flex flex-col ${
                    isSelected
                      ? 'border-indigo-500 ring-2 ring-indigo-500/40'
                      : record.reviewStatus === 'KEEP'
                      ? 'border-emerald-700/60'
                      : record.reviewStatus === 'DISCARD'
                      ? 'border-rose-700/60'
                      : 'border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  {/* Thumbnail Image Container */}
                  <div
                    className="relative bg-zinc-950 flex items-center justify-center overflow-hidden"
                    style={{ height: `${thumbSize * 0.8}px` }}
                  >
                    {record.thumbnailUrl ? (
                      <img
                        src={record.thumbnailUrl}
                        alt={record.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 text-xs p-2 text-center">
                        <span className="font-mono font-bold text-zinc-400">{record.format}</span>
                        <span className="text-[10px] text-zinc-600 mt-1 line-clamp-2">
                          {record.name}
                        </span>
                      </div>
                    )}

                    {/* Selection Checkbox */}
                    <button
                      onClick={(e) => toggleSelect(record.id, e)}
                      className={`absolute top-2 left-2 p-1 rounded-md backdrop-blur transition-opacity cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-zinc-900/80 text-zinc-400 hover:text-white opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {isSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                    </button>

                    {/* Status Indicator Badge */}
                    <div className="absolute top-2 right-2">
                      {record.reviewStatus === 'KEEP' && (
                        <span className="p-1 rounded-md bg-emerald-600 text-white shadow block">
                          <Check className="w-3 h-3 stroke-[2.5]" />
                        </span>
                      )}
                      {record.reviewStatus === 'DISCARD' && (
                        <span className="p-1 rounded-md bg-rose-600 text-white shadow block">
                          <X className="w-3 h-3 stroke-[2.5]" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info Footer */}
                  <div className="p-2.5 bg-zinc-900 flex-1 flex flex-col justify-between text-[11px]">
                    <div className="truncate font-medium text-zinc-200" title={record.name}>
                      {record.name}
                    </div>

                    <div className="flex items-center justify-between text-zinc-500 mt-1">
                      <span className="font-mono">{(record.size / 1024).toFixed(0)} KB</span>
                      <span className="font-mono truncate max-w-[90px]">
                        {record.captureDate ? record.captureDate.substring(0, 10) : t.grid.noDate}
                      </span>
                    </div>

                    {/* Quick Inline Actions */}
                    <div className="mt-2 pt-2 border-t border-zinc-800 flex items-center justify-between gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSetDecision(record.id, 'KEEP');
                        }}
                        className={`flex-1 py-1 rounded text-[10px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                          record.reviewStatus === 'KEEP'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-zinc-800 hover:bg-emerald-950/60 text-zinc-400 hover:text-emerald-300'
                        }`}
                      >
                        <Check className="w-3 h-3" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSetDecision(record.id, 'DISCARD');
                        }}
                        className={`flex-1 py-1 rounded text-[10px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                          record.reviewStatus === 'DISCARD'
                            ? 'bg-rose-600 text-white'
                            : 'bg-zinc-800 hover:bg-rose-950/60 text-zinc-400 hover:text-rose-300'
                        }`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
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
