import React from 'react';
import { AlertTriangle, Download, FileX, CheckCircle2 } from 'lucide-react';
import { FileRecord } from '../../types';
import { Language, translations } from '../../i18n/translations';

interface DamagedFilesScreenProps {
  records: FileRecord[];
  language: Language;
}

export const DamagedFilesScreen: React.FC<DamagedFilesScreenProps> = ({ records, language }) => {
  const t = translations[language];

  const damagedFiles = records.filter(
    (r) => r.analysis?.isCorrupt || r.reviewStatus === 'ERROR'
  );

  const exportErrorReport = () => {
    const lines = [
      '# Photo Keepler — Reporte de Archivos Ilegibles o Dañados',
      `# Fecha de Auditoría: ${new Date().toISOString()}`,
      `# Total de Archivos Afectados: ${damagedFiles.length}`,
      '--------------------------------------------------------------------------------',
      '',
    ];

    damagedFiles.forEach((f, idx) => {
      lines.push(`[${idx + 1}] Archivo: ${f.name}`);
      lines.push(`    Ruta: ${f.relativePath}`);
      lines.push(`    Formato: ${f.format}`);
      lines.push(`    Tamaño: ${f.size} bytes`);
      lines.push(`    Diagnóstico: ${f.analysis?.corruptReason || 'Error de decodificación'}`);
      lines.push('');
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `photo_keepler_reporte_danados_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-94px)] bg-zinc-950 text-zinc-200">
      {/* Top Banner */}
      <div className="p-4 bg-zinc-900 border-b border-zinc-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700/80 text-zinc-300">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white font-sans">
              {t.damaged.title}
            </h2>
            <p className="text-zinc-400 text-xs mt-0.5">
              {t.damaged.subtitle}
            </p>
          </div>
        </div>

        {damagedFiles.length > 0 && (
          <button
            onClick={exportErrorReport}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 cursor-pointer font-medium text-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.damaged.exportBtn}</span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {damagedFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-3" />
            <p className="text-base font-semibold text-zinc-200">
              {t.damaged.allOkTitle}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              {t.damaged.allOkDesc}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300">
              <span>{t.damaged.safeNote}</span>
            </div>

            <div className="space-y-3">
              {damagedFiles.map((file) => (
                <div
                  key={file.id}
                  className="p-4 bg-zinc-900/70 rounded-2xl border border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-rose-400 shrink-0">
                      <FileX className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-100 text-sm font-mono">{file.name}</p>
                      <p className="text-zinc-500 font-mono text-[11px] mt-0.5">{file.relativePath}</p>
                      <div className="flex items-center gap-2 mt-1 text-[11px]">
                        <span className="px-1.5 py-0.5 rounded bg-zinc-950 text-zinc-400 font-mono border border-zinc-800">
                          {file.format}
                        </span>
                        <span className="text-zinc-500">{file.size} bytes</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-950 px-3.5 py-2.5 rounded-xl border border-zinc-800 max-w-md w-full md:w-auto">
                    <span className="text-zinc-500 block text-[10px] font-semibold uppercase">
                      {t.damaged.diagnostic}:
                    </span>
                    <span className="text-rose-400 font-mono text-[11px]">
                      {file.analysis?.corruptReason || 'Error de lectura de archivo'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
