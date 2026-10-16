import React, { useState } from 'react';
import { X, Settings, Keyboard, Sliders } from 'lucide-react';
import { ProjectConfig } from '../../types';
import { Language, translations } from '../../i18n/translations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ProjectConfig;
  onSaveConfig: (cfg: ProjectConfig) => void;
  language: Language;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  language,
}) => {
  const [form, setForm] = useState<ProjectConfig>({ ...config });
  const t = translations[language];

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-zinc-200">
        {/* Header */}
        <div className="p-5 px-6 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-white font-sans">{t.settingsModal.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto text-xs">
          {/* Keyboard Shortcuts & Labels */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-800 pb-2">
              <Keyboard className="w-4 h-4 text-emerald-400" />
              <span>{t.settingsModal.controlsTitle}</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
                <label className="block text-zinc-400 font-medium">{t.settingsModal.keepLabel}</label>
                <div>
                  <input
                    type="text"
                    value={form.keepLabel}
                    onChange={(e) => setForm({ ...form, keepLabel: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-zinc-100 font-medium text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block mb-1">{t.settingsModal.shortcutKey}:</span>
                  <input
                    type="text"
                    maxLength={1}
                    value={form.keepKey}
                    onChange={(e) => setForm({ ...form, keepKey: e.target.value.toLowerCase() })}
                    className="w-12 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-emerald-400 font-mono font-bold text-center uppercase text-xs"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
                <label className="block text-zinc-400 font-medium">{t.settingsModal.discardLabel}</label>
                <div>
                  <input
                    type="text"
                    value={form.discardLabel}
                    onChange={(e) => setForm({ ...form, discardLabel: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-zinc-100 font-medium text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block mb-1">{t.settingsModal.shortcutKey}:</span>
                  <input
                    type="text"
                    maxLength={1}
                    value={form.discardKey}
                    onChange={(e) => setForm({ ...form, discardKey: e.target.value.toLowerCase() })}
                    className="w-12 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-rose-400 font-mono font-bold text-center uppercase text-xs"
                  />
                </div>
              </div>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={form.autoAdvanceOnDecision}
                onChange={(e) => setForm({ ...form, autoAdvanceOnDecision: e.target.checked })}
                className="rounded border-zinc-700 text-indigo-500 focus:ring-0"
              />
              <span className="text-zinc-300">
                {t.settingsModal.autoAdvance}
              </span>
            </label>
          </div>

          {/* Algorithm Thresholds */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-800 pb-2">
              <Sliders className="w-4 h-4 text-sky-400" />
              <span>{t.settingsModal.thresholdsTitle}</span>
            </h3>

            <div className="space-y-3 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-zinc-200">{t.settingsModal.burstWindow}</span>
                  <p className="text-[10px] text-zinc-500">{t.settingsModal.burstHint}</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={form.burstIntervalSeconds}
                    onChange={(e) =>
                      setForm({ ...form, burstIntervalSeconds: Number(e.target.value) })
                    }
                    className="w-16 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-zinc-100 font-mono text-center text-xs"
                  />
                  <span className="text-zinc-500">s</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2.5 border-t border-zinc-800">
                <div>
                  <span className="font-semibold text-zinc-200">{t.settingsModal.sharpnessThreshold}</span>
                  <p className="text-[10px] text-zinc-500">{t.settingsModal.sharpnessHint}</p>
                </div>
                <input
                  type="number"
                  min={10}
                  max={300}
                  value={form.blurThreshold}
                  onChange={(e) => setForm({ ...form, blurThreshold: Number(e.target.value) })}
                  className="w-16 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-zinc-100 font-mono text-center text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 bg-zinc-950 border-t border-zinc-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium cursor-pointer transition-colors"
          >
            {t.settingsModal.cancel}
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold cursor-pointer shadow-md transition-colors"
          >
            {t.settingsModal.save}
          </button>
        </div>
      </div>
    </div>
  );
};
