import React, { useState } from 'react';
import { FileCode2, Copy, Check, Download } from 'lucide-react';
import { CPP_QT_CODEBASE } from '../../services/cppQtCodebase';
import { Language, translations } from '../../i18n/translations';

interface QtCppDocsScreenProps {
  language: Language;
}

export const QtCppDocsScreen: React.FC<QtCppDocsScreenProps> = ({ language }) => {
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const t = translations[language];

  const currentFile = CPP_QT_CODEBASE[selectedFileIndex] || CPP_QT_CODEBASE[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-94px)] bg-zinc-950 text-zinc-200">
      {/* Top Banner */}
      <div className="p-4 bg-zinc-900 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700/80 text-zinc-300">
            <FileCode2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white font-sans">
              {t.cpp.title}
            </h2>
            <p className="text-zinc-400 text-xs mt-0.5">
              {t.cpp.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 cursor-pointer font-medium text-xs transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? t.cpp.copied : t.cpp.copyBtn}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs cursor-pointer shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.cpp.downloadBtn.replace('{name}', currentFile.name)}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Files List */}
        <div className="w-72 bg-zinc-900/50 border-r border-zinc-800/80 overflow-y-auto p-3 space-y-1 text-xs">
          <span className="text-[10px] uppercase font-bold text-zinc-500 px-2 block mb-1">
            {t.cpp.filesList}
          </span>
          {CPP_QT_CODEBASE.map((file, idx) => (
            <button
              key={file.path}
              onClick={() => setSelectedFileIndex(idx)}
              className={`w-full text-left p-2.5 rounded-xl transition-colors cursor-pointer ${
                idx === selectedFileIndex
                  ? 'bg-zinc-800 border border-zinc-700 text-white font-medium'
                  : 'hover:bg-zinc-900 text-zinc-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileCode2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-mono text-xs truncate">{file.name}</span>
              </div>
              <span className="text-[10px] text-zinc-500 block truncate mt-0.5">
                {file.path}
              </span>
            </button>
          ))}
        </div>

        {/* Right Code Viewer */}
        <div className="flex-1 flex flex-col bg-zinc-950 overflow-hidden">
          <div className="p-3 bg-zinc-900/40 border-b border-zinc-800 flex items-center justify-between text-xs">
            <div>
              <span className="font-mono text-zinc-200 font-semibold">{currentFile.path}</span>
              <p className="text-zinc-500 text-[11px] mt-0.5">{currentFile.description}</p>
            </div>
            <span className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 font-mono text-[10px] border border-zinc-800">
              {currentFile.language.toUpperCase()}
            </span>
          </div>

          <div className="flex-1 overflow-auto p-4">
            <pre className="font-mono text-xs text-zinc-200 leading-relaxed bg-zinc-900/60 p-5 rounded-2xl border border-zinc-800/80 select-all overflow-x-auto">
              <code>{currentFile.content}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
