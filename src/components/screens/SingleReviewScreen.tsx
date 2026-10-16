import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Check,
  X,
  AlertCircle,
  Calendar,
  Camera,
  Layers,
  Sparkles,
  Info,
  Clock,
} from 'lucide-react';
import { FileRecord, ProjectConfig, ReviewStatus } from '../../types';
import { Language, translations } from '../../i18n/translations';

interface SingleReviewScreenProps {
  records: FileRecord[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  onSetDecision: (recordId: string, status: ReviewStatus, origin?: 'MANUAL_KEY' | 'MANUAL_CLICK') => void;
  onManualDateResolve: (recordId: string, manualDate: string) => void;
  config: ProjectConfig;
  language: Language;
}

export const SingleReviewScreen: React.FC<SingleReviewScreenProps> = ({
  records,
  currentIndex,
  onNavigate,
  onSetDecision,
  onManualDateResolve,
  config,
  language,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showMetadataDrawer, setShowMetadataDrawer] = useState(true);
  const [manualDateInput, setManualDateInput] = useState('');
  const [isEditingDate, setIsEditingDate] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const filmstripRef = useRef<HTMLDivElement>(null);

  const t = translations[language];
  const currentRecord = records[currentIndex];

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setIsEditingDate(false);
    setManualDateInput(currentRecord?.captureDate || '2026-05-01');

    if (filmstripRef.current) {
      const activeThumb = filmstripRef.current.children[currentIndex] as HTMLElement;
      if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentIndex, currentRecord]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const key = e.key.toLowerCase();
      if (key === config.keepKey.toLowerCase()) {
        e.preventDefault();
        if (currentRecord) {
          onSetDecision(currentRecord.id, 'KEEP', 'MANUAL_KEY');
          if (config.autoAdvanceOnDecision && currentIndex < records.length - 1) {
            onNavigate(currentIndex + 1);
          }
        }
      } else if (key === config.discardKey.toLowerCase()) {
        e.preventDefault();
        if (currentRecord) {
          onSetDecision(currentRecord.id, 'DISCARD', 'MANUAL_KEY');
          if (config.autoAdvanceOnDecision && currentIndex < records.length - 1) {
            onNavigate(currentIndex + 1);
          }
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentIndex > 0) onNavigate(currentIndex - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentIndex < records.length - 1) onNavigate(currentIndex + 1);
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        if (currentRecord) onSetDecision(currentRecord.id, 'PENDING');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, currentRecord, config, onSetDecision, onNavigate, records.length]);

  if (!currentRecord) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-zinc-400">
        <AlertCircle className="w-10 h-10 mb-3 text-zinc-600" />
        <p className="text-base font-semibold text-zinc-200">{t.review.noPhotosTitle}</p>
        <p className="text-xs text-zinc-500 mt-1">{t.review.noPhotosDesc}</p>
      </div>
    );
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    setZoom((prev) => Math.min(5, Math.max(0.5, prev + delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const getStatusBadge = (status: ReviewStatus) => {
    switch (status) {
      case 'KEEP':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold text-xs flex items-center gap-1.5">
            <Check className="w-3 h-3 text-emerald-400" /> {config.keepLabel}
          </span>
        );
      case 'DISCARD':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold text-xs flex items-center gap-1.5">
            <X className="w-3 h-3 text-rose-400" /> {config.discardLabel}
          </span>
        );
      case 'ERROR':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-800 font-semibold text-xs flex items-center gap-1.5">
            <AlertCircle className="w-3 h-3" /> Error
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 font-medium text-xs flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-amber-400" /> {t.app.pending}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-94px)] bg-zinc-950 select-none overflow-hidden text-zinc-200">
      {/* Top Toolbar */}
      <div className="h-11 px-4 bg-zinc-900 border-b border-zinc-800/80 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-400 font-mono">
            {currentIndex + 1} / {records.length}
          </span>
          <span className="text-zinc-700">•</span>
          <span className="text-xs font-medium text-zinc-100 truncate max-w-xs md:max-w-md">
            {currentRecord.name}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
            {currentRecord.format}
          </span>
          {getStatusBadge(currentRecord.reviewStatus)}
        </div>

        {/* Zoom & View Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-zinc-950 rounded-lg p-0.5 border border-zinc-800">
            <button
              onClick={() => setZoom((prev) => Math.max(0.5, prev - 0.25))}
              className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] px-2 font-mono text-zinc-300 w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((prev) => Math.min(5, prev + 0.25))}
              className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded cursor-pointer"
              title={t.review.fitToScreen}
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setShowMetadataDrawer(!showMetadataDrawer)}
            className={`px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1.5 cursor-pointer transition-colors ${
              showMetadataDrawer
                ? 'bg-zinc-800 border-zinc-700 text-white'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.review.metadataPanel}</span>
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Navigation Previous Button */}
        <button
          onClick={() => currentIndex > 0 && onNavigate(currentIndex - 1)}
          disabled={currentIndex === 0}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/60 text-white flex items-center justify-center shadow-xl backdrop-blur disabled:opacity-20 cursor-pointer transition-all active:scale-95"
          title={t.review.prevPhoto}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Navigation Next Button */}
        <button
          onClick={() => currentIndex < records.length - 1 && onNavigate(currentIndex + 1)}
          disabled={currentIndex === records.length - 1}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/60 text-white flex items-center justify-center shadow-xl backdrop-blur disabled:opacity-20 cursor-pointer transition-all active:scale-95"
          title={t.review.nextPhoto}
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Center Canvas */}
        <div
          ref={containerRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`flex-1 flex items-center justify-center overflow-hidden bg-zinc-950 p-6 ${
            zoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
          }`}
        >
          {currentRecord.previewUrl || currentRecord.thumbnailUrl ? (
            <img
              src={currentRecord.previewUrl || currentRecord.thumbnailUrl}
              alt={currentRecord.name}
              draggable={false}
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                maxWidth: '92%',
                maxHeight: '92%',
                objectFit: 'contain',
              }}
              className="rounded-lg shadow-2xl select-none"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-8 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-400">
              <Camera className="w-12 h-12 text-zinc-600 mb-3" />
              <p className="text-sm font-semibold text-zinc-300">{currentRecord.name}</p>
              <p className="text-xs text-zinc-500 mt-1">
                {currentRecord.analysis?.corruptReason || 'Formato sin vista previa directa.'}
              </p>
            </div>
          )}
        </div>

        {/* Metadata Sidebar */}
        {showMetadataDrawer && (
          <aside className="w-80 bg-zinc-900/95 border-l border-zinc-800/80 p-5 overflow-y-auto space-y-4 text-xs">
            <div>
              <h3 className="text-xs font-semibold text-zinc-200 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                <Camera className="w-3.5 h-3.5 text-zinc-400" />
                <span>{t.review.fileData}</span>
              </h3>
              <div className="bg-zinc-950 rounded-xl p-3 space-y-1.5 border border-zinc-800 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-zinc-500">{t.review.path}:</span>
                  <span className="text-zinc-300 truncate max-w-[170px]" title={currentRecord.relativePath}>
                    {currentRecord.relativePath}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">{t.review.size}:</span>
                  <span className="text-zinc-300">
                    {(currentRecord.size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">{t.review.dimensions}:</span>
                  <span className="text-zinc-300">
                    {currentRecord.metadata?.width || '—'} × {currentRecord.metadata?.height || '—'} px
                  </span>
                </div>
              </div>
            </div>

            {/* Capture Date info */}
            <div className="bg-zinc-950 rounded-xl p-3 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" /> {t.review.captureDate}:
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                  {currentRecord.captureDateSource || '—'}
                </span>
              </div>

              {currentRecord.captureDateValid ? (
                <div className="text-zinc-100 font-mono text-xs font-semibold">
                  {currentRecord.captureDate}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-amber-400 text-[11px] leading-relaxed">
                    {t.review.noValidDate}
                  </p>

                  {!isEditingDate ? (
                    <button
                      onClick={() => setIsEditingDate(true)}
                      className="w-full py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-medium text-xs cursor-pointer"
                    >
                      {t.review.assignDate}
                    </button>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <input
                        type="date"
                        value={manualDateInput}
                        onChange={(e) => setManualDateInput(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-zinc-200 text-xs"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (manualDateInput) {
                              onManualDateResolve(currentRecord.id, manualDateInput);
                              setIsEditingDate(false);
                            }
                          }}
                          className="flex-1 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium cursor-pointer"
                        >
                          {t.review.save}
                        </button>
                        <button
                          onClick={() => setIsEditingDate(false)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                        >
                          {t.review.cancel}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Camera settings */}
            {currentRecord.metadata?.make && (
              <div>
                <h4 className="text-zinc-400 font-medium mb-1.5">{t.review.cameraSettings}</h4>
                <div className="bg-zinc-950 rounded-xl p-3 space-y-1.5 border border-zinc-800 text-zinc-300 text-[11px]">
                  <p><strong>{t.review.camera}:</strong> {currentRecord.metadata.make} {currentRecord.metadata.model}</p>
                  {currentRecord.metadata.lens && <p><strong>{t.review.lens}:</strong> {currentRecord.metadata.lens}</p>}
                  <p><strong>{t.review.exposure}:</strong> {currentRecord.metadata.exposureTime || '—'}</p>
                  <p><strong>{t.review.aperture}:</strong> f/{currentRecord.metadata.fNumber || '—'}</p>
                  <p><strong>{t.review.iso}:</strong> {currentRecord.metadata.iso || '—'}</p>
                </div>
              </div>
            )}

            {/* Quality Metrics */}
            {currentRecord.analysis && (
              <div>
                <h4 className="text-zinc-400 font-medium mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{t.review.metrics}</span>
                </h4>
                <div className="bg-zinc-950 rounded-xl p-3 space-y-2 border border-zinc-800 font-mono text-[11px]">
                  <div>
                    <span className="text-zinc-500 block">{t.review.sharpness}:</span>
                    <span className={`font-semibold ${currentRecord.analysis.isBlurry ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {currentRecord.analysis.laplacianVariance ?? '—'}
                      {currentRecord.analysis.isBlurry && ` (${t.review.sharpnessAlert})`}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">SHA-256:</span>
                    <span className="text-zinc-400 break-all text-[10px]">
                      {currentRecord.analysis.sha256 ? currentRecord.analysis.sha256.substring(0, 24) + '...' : '—'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Sidecars / Associated Files */}
            {currentRecord.relationships.length > 0 && (
              <div>
                <h4 className="text-zinc-400 font-medium mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.review.associatedFiles}</span>
                </h4>
                <div className="bg-zinc-950 rounded-xl p-3 border border-zinc-800 space-y-1.5">
                  {currentRecord.relationships.map((rel, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-300 font-mono">{rel.relatedFileName}</span>
                      <span className="px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 text-[10px] border border-zinc-800">
                        {rel.relationshipType}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Floating Action Bar */}
      <div className="h-16 bg-zinc-900 border-t border-zinc-800/80 px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          {/* Keep Button */}
          <button
            onClick={() => {
              onSetDecision(currentRecord.id, 'KEEP', 'MANUAL_CLICK');
              if (config.autoAdvanceOnDecision && currentIndex < records.length - 1) {
                onNavigate(currentIndex + 1);
              }
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-all cursor-pointer active:scale-95"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>{config.keepLabel}</span>
            <kbd className="px-1.5 py-0.5 rounded bg-emerald-700/80 text-[10px] font-mono uppercase">
              {config.keepKey}
            </kbd>
          </button>

          {/* Discard Button */}
          <button
            onClick={() => {
              onSetDecision(currentRecord.id, 'DISCARD', 'MANUAL_CLICK');
              if (config.autoAdvanceOnDecision && currentIndex < records.length - 1) {
                onNavigate(currentIndex + 1);
              }
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md transition-all cursor-pointer active:scale-95"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
            <span>{config.discardLabel}</span>
            <kbd className="px-1.5 py-0.5 rounded bg-rose-700/80 text-[10px] font-mono uppercase">
              {config.discardKey}
            </kbd>
          </button>

          {/* Reset / Pending Button */}
          <button
            onClick={() => onSetDecision(currentRecord.id, 'PENDING')}
            className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors cursor-pointer"
            title={t.review.resetBtn}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Filmstrip at the bottom */}
        <div
          ref={filmstripRef}
          className="flex-1 max-w-xl mx-6 flex items-center gap-2 overflow-x-auto py-1 scrollbar-none"
        >
          {records.map((r, idx) => {
            const isSelected = idx === currentIndex;
            const borderCol =
              r.reviewStatus === 'KEEP'
                ? 'border-emerald-500'
                : r.reviewStatus === 'DISCARD'
                ? 'border-rose-500'
                : 'border-zinc-800';

            return (
              <button
                key={r.id}
                onClick={() => onNavigate(idx)}
                className={`w-12 h-10 shrink-0 rounded-md overflow-hidden border-2 transition-all cursor-pointer relative ${borderCol} ${
                  isSelected ? 'ring-2 ring-indigo-500 scale-105 z-10' : 'opacity-60 hover:opacity-100'
                }`}
              >
                {r.thumbnailUrl ? (
                  <img src={r.thumbnailUrl} alt={r.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-[9px] font-mono text-zinc-500">
                    {r.format}
                  </div>
                )}
                {r.reviewStatus === 'KEEP' && (
                  <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
                {r.reviewStatus === 'DISCARD' && (
                  <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-rose-400" />
                )}
              </button>
            );
          })}
        </div>

        <div className="text-[11px] text-zinc-500 hidden lg:block font-sans">
          {t.review.shortcutsHint
            .replace('{keepKey}', config.keepKey.toUpperCase())
            .replace('{discardKey}', config.discardKey.toUpperCase())}
        </div>
      </div>
    </div>
  );
};
