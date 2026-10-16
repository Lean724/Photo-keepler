import React, { useState } from 'react';
import {
  Layers,
  Link2,
  Camera,
  MapPin,
  Calendar,
  Hash,
  Sliders,
} from 'lucide-react';
import { FileRecord, ProjectConfig } from '../../types';
import { Language, translations } from '../../i18n/translations';

interface MetadataAndRelationsScreenProps {
  records: FileRecord[];
  config: ProjectConfig;
  onToggleAssociateSidecars: () => void;
  language: Language;
}

export const MetadataAndRelationsScreen: React.FC<MetadataAndRelationsScreenProps> = ({
  records,
  config,
  onToggleAssociateSidecars,
  language,
}) => {
  const [selectedRecordId, setSelectedRecordId] = useState<string>(records[0]?.id || '');
  const t = translations[language];

  const current = records.find((r) => r.id === selectedRecordId) || records[0];
  const relatedCount = records.filter((r) => r.relationships.length > 0).length;

  return (
    <div className="flex flex-col h-[calc(100vh-94px)] bg-zinc-950 text-zinc-200">
      {/* Top Banner */}
      <div className="p-4 bg-zinc-900 border-b border-zinc-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700/80 text-zinc-300">
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white font-sans">
              {t.metadata.title}
            </h2>
            <p className="text-zinc-400 text-xs mt-0.5">
              {t.metadata.subtitle.replace('{count}', String(relatedCount))}
            </p>
          </div>
        </div>

        {/* Global Toggle for Sidecars */}
        <div className="flex items-center gap-3 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
          <span className="text-zinc-400 text-xs">{t.metadata.sidecarAction}:</span>
          <button
            onClick={onToggleAssociateSidecars}
            className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
              config.associateSidecars
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            {config.associateSidecars ? t.metadata.enabled : t.metadata.disabled}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: File List */}
        <div className="w-80 bg-zinc-900/50 border-r border-zinc-800/80 overflow-y-auto p-2.5 space-y-1">
          {records.map((r) => {
            const isSelected = r.id === current?.id;
            const hasSidecars = r.relationships.length > 0;

            return (
              <button
                key={r.id}
                onClick={() => setSelectedRecordId(r.id)}
                className={`w-full text-left p-2.5 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-zinc-800 border border-zinc-700 text-white'
                    : 'hover:bg-zinc-900 text-zinc-400'
                }`}
              >
                <div className="truncate mr-2">
                  <div className="font-medium text-zinc-200 truncate">{r.name}</div>
                  <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                    {r.format} • {(r.size / 1024).toFixed(0)} KB
                  </div>
                </div>

                {hasSidecars && (
                  <span className="shrink-0 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-semibold flex items-center gap-1">
                    <Link2 className="w-2.5 h-2.5" /> {r.relationships.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Column: Detailed EXIF & Associations */}
        {current ? (
          <div className="flex-1 overflow-y-auto p-7 space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Image Preview */}
              <div className="w-full md:w-72 shrink-0">
                <div className="bg-zinc-900 p-3 rounded-2xl border border-zinc-800 text-center">
                  {current.thumbnailUrl ? (
                    <img
                      src={current.thumbnailUrl}
                      alt={current.name}
                      className="w-full h-48 object-cover rounded-xl mb-3 shadow-md"
                    />
                  ) : (
                    <div className="w-full h-48 bg-zinc-950 rounded-xl flex items-center justify-center font-mono text-xs text-zinc-500 mb-3 border border-zinc-800">
                      Sin previsualización
                    </div>
                  )}
                  <div className="text-xs font-semibold text-zinc-100 truncate">{current.name}</div>
                  <div className="text-[11px] text-zinc-500 font-mono mt-0.5 truncate">
                    {current.relativePath}
                  </div>
                </div>
              </div>

              {/* Core EXIF Grid */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                <div className="p-3.5 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-1">
                  <span className="text-zinc-500 text-xs flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-indigo-400" /> Cámara
                  </span>
                  <p className="font-semibold text-zinc-100 text-sm">
                    {current.metadata?.make || '—'}
                  </p>
                  <p className="text-xs text-zinc-400">{current.metadata?.model || '—'}</p>
                </div>

                <div className="p-3.5 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-1">
                  <span className="text-zinc-500 text-xs flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-sky-400" /> Lente
                  </span>
                  <p className="font-semibold text-zinc-100 text-sm truncate" title={current.metadata?.lens}>
                    {current.metadata?.lens || '—'}
                  </p>
                  <p className="text-xs text-zinc-400">{current.metadata?.focalLength || '—'}</p>
                </div>

                <div className="p-3.5 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-1">
                  <span className="text-zinc-500 text-xs flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Fecha de Captura
                  </span>
                  <p className="font-semibold text-zinc-100 text-sm font-mono">
                    {current.captureDate || '—'}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {current.captureDateSource || 'Sin metadato'}
                  </p>
                </div>

                <div className="p-3.5 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-1">
                  <span className="text-zinc-500 text-xs">Exposición & Apertura</span>
                  <p className="font-semibold text-zinc-100 text-sm">
                    {current.metadata?.exposureTime || '—'} @ f/{current.metadata?.fNumber || '—'}
                  </p>
                  <p className="text-xs text-zinc-400">ISO {current.metadata?.iso || '—'}</p>
                </div>

                <div className="p-3.5 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-1">
                  <span className="text-zinc-500 text-xs">Resolución y Tamaño</span>
                  <p className="font-semibold text-zinc-100 text-sm font-mono">
                    {current.metadata?.width || '—'} × {current.metadata?.height || '—'} px
                  </p>
                  <p className="text-xs text-zinc-400">
                    {(current.size / 1024).toFixed(1)} KB ({current.format})
                  </p>
                </div>

                <div className="p-3.5 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-1">
                  <span className="text-zinc-500 text-xs flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" /> Coordenadas GPS
                  </span>
                  <p className="font-semibold text-zinc-100 text-sm font-mono">
                    {current.metadata?.gpsLatitude
                      ? `${current.metadata.gpsLatitude.toFixed(4)}, ${current.metadata.gpsLongitude?.toFixed(4)}`
                      : 'Sin coordenadas'}
                  </p>
                  <p className="text-xs text-zinc-500">Geolocalización EXIF</p>
                </div>
              </div>
            </div>

            {/* Hashes */}
            <div className="bg-zinc-900/60 p-5 rounded-2xl border border-zinc-800 space-y-3">
              <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Hash className="w-4 h-4 text-indigo-400" />
                <span>{t.metadata.hashes}</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px] mb-1">{t.metadata.sha256}:</span>
                  <span className="text-zinc-200 break-all select-all">{current.analysis?.sha256 || '—'}</span>
                </div>
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px] mb-1">{t.metadata.dHash}:</span>
                  <span className="text-indigo-300 break-all select-all">{current.analysis?.dHash || '—'}</span>
                </div>
              </div>
            </div>

            {/* Associated Relationships Panel */}
            <div className="bg-zinc-900/60 p-5 rounded-2xl border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>{t.metadata.associatedTitle}</span>
                </h3>
                <span className="text-xs text-zinc-500">
                  {current.relationships.length} vinculados
                </span>
              </div>

              {current.relationships.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">
                  {t.metadata.noSidecars}
                </p>
              ) : (
                <div className="space-y-2">
                  {current.relationships.map((rel, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <Link2 className="w-4 h-4 text-amber-400" />
                        <div>
                          <p className="font-semibold text-zinc-200 font-mono">{rel.relatedFileName}</p>
                          <p className="text-zinc-500 text-[11px] mt-0.5">
                            Tipo: <strong className="text-zinc-300">{rel.relationshipType}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="px-2.5 py-1 rounded-md bg-zinc-900 text-zinc-400 text-[11px] border border-zinc-800">
                          {config.associateSidecars
                            ? t.metadata.willBeGrouped
                            : t.metadata.willBeIndependent}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-500 text-xs">
            Selecciona un archivo para ver sus metadatos.
          </div>
        )}
      </div>
    </div>
  );
};
