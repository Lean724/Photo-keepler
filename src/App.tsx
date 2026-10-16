import React, { useState, useEffect, useCallback } from 'react';
import {
  FileRecord,
  JournalEntry,
  OperationBatch,
  ProjectConfig,
  ReviewStatus,
  ViewMode,
} from './types';
import {
  loadSavedProjectConfig,
  saveProjectConfig,
  loadJournal,
  addJournalEntry,
  loadBatches,
  saveBatch,
  saveDecision,
  loadSavedDecisions,
} from './services/catalogStorage';
import { generateSpecTestCollection } from './services/mockDataGenerator';
import { processLocalFileList } from './services/localDirectoryScanner';
import { HeaderNav } from './components/HeaderNav';
import { ProjectSetupScreen } from './components/screens/ProjectSetupScreen';
import { SingleReviewScreen } from './components/screens/SingleReviewScreen';
import { GridViewScreen } from './components/screens/GridViewScreen';
import { MetadataAndRelationsScreen } from './components/screens/MetadataAndRelationsScreen';
import { ExactDuplicatesScreen } from './components/screens/ExactDuplicatesScreen';
import { VisualDuplicatesScreen } from './components/screens/VisualDuplicatesScreen';
import { SimilarPhotosScreen } from './components/screens/SimilarPhotosScreen';
import { BurstReviewScreen } from './components/screens/BurstReviewScreen';
import { QualityScreen } from './components/screens/QualityScreen';
import { DamagedFilesScreen } from './components/screens/DamagedFilesScreen';
import { OperationPlannerScreen } from './components/screens/OperationPlannerScreen';
import { HistoryJournalScreen } from './components/screens/HistoryJournalScreen';
import { QtCppDocsScreen } from './components/screens/QtCppDocsScreen';
import { SettingsModal } from './components/modals/SettingsModal';
import { Language } from './i18n/translations';

export default function App() {
  const [language, setLanguage] = useState<Language>('es');
  const [config, setConfig] = useState<ProjectConfig>(() => {
    const saved = loadSavedProjectConfig();
    return {
      ...saved,
      name: saved.name || 'Photo Keepler Library',
    };
  });
  const [records, setRecords] = useState<FileRecord[]>([]);
  const [currentView, setCurrentView] = useState<ViewMode>('PROJECT');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [journal, setJournal] = useState<JournalEntry[]>(loadJournal);
  const [batches, setBatches] = useState<OperationBatch[]>(loadBatches);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Load initial demo collection on mount
  useEffect(() => {
    let isMounted = true;
    generateSpecTestCollection().then((initialRecords) => {
      if (!isMounted) return;
      const savedDecisions = loadSavedDecisions(config.id);
      const merged = initialRecords.map((r) => {
        if (savedDecisions[r.id]) {
          return {
            ...r,
            reviewStatus: savedDecisions[r.id].status,
            reviewDate: savedDecisions[r.id].date,
          };
        }
        return r;
      });
      setRecords(merged);
    });

    return () => {
      isMounted = false;
    };
  }, [config.id]);

  const handleToggleLanguage = () => {
    setLanguage((prev) => (prev === 'es' ? 'en' : 'es'));
  };

  const handleUpdateConfig = (newCfg: ProjectConfig) => {
    setConfig(newCfg);
    saveProjectConfig(newCfg);
    const updatedJournal = addJournalEntry({
      action: 'CONFIG_UPDATE',
      description: `Configuración guardada: Modo=${newCfg.approvedMode}, Intervalo Ráfaga=${newCfg.burstIntervalSeconds}s`,
      status: 'SUCCESS',
    });
    setJournal((prev) => [updatedJournal, ...prev]);
  };

  const handleLoadSpecTestCollection = async () => {
    setIsScanning(true);
    const testRecords = await generateSpecTestCollection();
    setRecords(testRecords);
    setCurrentIndex(0);
    setIsScanning(false);
    setCurrentView('SINGLE_REVIEW');

    const entry = addJournalEntry({
      action: 'RECOVERY_SCAN',
      description: `Colección de ejemplo cargada con ${testRecords.length} imágenes.`,
      status: 'SUCCESS',
    });
    setJournal((prev) => [entry, ...prev]);
  };

  const handleScanLocalDirectory = async (fileList: FileList) => {
    setIsScanning(true);
    try {
      const scanned = await processLocalFileList(fileList, config);
      setRecords(scanned);
      setCurrentIndex(0);
      setIsScanning(false);
      setCurrentView('GRID_VIEW');

      const entry = addJournalEntry({
        action: 'RECOVERY_SCAN',
        description: `Escaneo local completado: ${scanned.length} archivos indexados.`,
        status: 'SUCCESS',
      });
      setJournal((prev) => [entry, ...prev]);
    } catch (err: any) {
      setIsScanning(false);
      const entry = addJournalEntry({
        action: 'RECOVERY_SCAN',
        description: `Error al indexar archivos locales: ${err?.message || 'Error desconocido'}`,
        status: 'ERROR',
      });
      setJournal((prev) => [entry, ...prev]);
    }
  };

  const handleSetDecision = useCallback(
    (
      recordId: string,
      status: ReviewStatus,
      origin: 'MANUAL_KEY' | 'MANUAL_CLICK' | 'BATCH_SELECTION' = 'MANUAL_CLICK'
    ) => {
      setRecords((prev) =>
        prev.map((r) => {
          if (r.id === recordId) {
            saveDecision(config.id, r.id, status, origin);
            return {
              ...r,
              reviewStatus: status,
              reviewDate: new Date().toISOString(),
              reviewOrigin: origin,
            };
          }
          return r;
        })
      );
    },
    [config.id]
  );

  const handleBatchDecision = useCallback(
    (recordIds: string[], status: ReviewStatus) => {
      const idSet = new Set(recordIds);
      setRecords((prev) =>
        prev.map((r) => {
          if (idSet.has(r.id)) {
            saveDecision(config.id, r.id, status, 'BATCH_SELECTION');
            return {
              ...r,
              reviewStatus: status,
              reviewDate: new Date().toISOString(),
              reviewOrigin: 'BATCH_SELECTION',
            };
          }
          return r;
        })
      );

      const entry = addJournalEntry({
        action: 'DECISION_CHANGE',
        description: `Clasificación por lote: ${recordIds.length} archivos marcados como ${status}.`,
        status: 'SUCCESS',
      });
      setJournal((prev) => [entry, ...prev]);
    },
    [config.id]
  );

  const handleManualDateResolve = useCallback((recordId: string, manualDate: string) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id === recordId) {
          return {
            ...r,
            manualCaptureDate: manualDate,
            captureDateValid: true,
            captureDateSource: 'MANUAL_RESOLUTION',
          };
        }
        return r;
      })
    );

    const entry = addJournalEntry({
      action: 'DECISION_CHANGE',
      description: `Fecha asignada manualmente para foto ${recordId}: ${manualDate}`,
      status: 'SUCCESS',
    });
    setJournal((prev) => [entry, ...prev]);
  }, []);

  const handleExecuteBatch = (batch: OperationBatch) => {
    const executedBatch: OperationBatch = {
      ...batch,
      state: 'COMPLETED',
      canUndo: true,
    };
    saveBatch(executedBatch);
    setBatches((prev) => [executedBatch, ...prev]);

    const entry = addJournalEntry({
      action: 'BATCH_EXECUTE',
      batchId: batch.id,
      itemCount: batch.items.length,
      description: `Lote ${batch.id} ejecutado: ${batch.totalApproved} aprobadas organizadas, ${batch.totalDiscarded} descartes resguardados.`,
      status: 'SUCCESS',
    });
    setJournal((prev) => [entry, ...prev]);
  };

  const handleUndoBatch = (batchId: string) => {
    setBatches((prev) =>
      prev.map((b) => (b.id === batchId ? { ...b, state: 'CANCELLED', canUndo: false } : b))
    );

    const entry = addJournalEntry({
      action: 'UNDO',
      batchId,
      description: `Lote ${batchId} revertido. Estado restaurado a PENDING.`,
      status: 'WARNING',
    });
    setJournal((prev) => [entry, ...prev]);
  };

  const handleClearJournal = () => {
    localStorage.removeItem('photo_organizer_journal');
    setJournal([]);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Pro Header & Clean Tabs */}
      <HeaderNav
        currentView={currentView}
        onSelectView={setCurrentView}
        config={config}
        records={records}
        onOpenSettings={() => setIsSettingsOpen(true)}
        language={language}
        onToggleLanguage={handleToggleLanguage}
      />

      {/* Main View Area */}
      <main className="flex-1 overflow-hidden">
        {currentView === 'PROJECT' && (
          <ProjectSetupScreen
            config={config}
            onUpdateConfig={handleUpdateConfig}
            onLoadSpecTestCollection={handleLoadSpecTestCollection}
            onScanLocalDirectory={handleScanLocalDirectory}
            isScanning={isScanning}
            totalRecordsCount={records.length}
            language={language}
          />
        )}

        {currentView === 'SINGLE_REVIEW' && (
          <SingleReviewScreen
            records={records}
            currentIndex={currentIndex}
            onNavigate={setCurrentIndex}
            onSetDecision={handleSetDecision}
            onManualDateResolve={handleManualDateResolve}
            config={config}
            language={language}
          />
        )}

        {currentView === 'GRID_VIEW' && (
          <GridViewScreen
            records={records}
            onOpenSingleReview={(idx) => {
              setCurrentIndex(idx);
              setCurrentView('SINGLE_REVIEW');
            }}
            onSetDecision={handleSetDecision}
            onBatchDecision={handleBatchDecision}
            config={config}
            language={language}
          />
        )}

        {currentView === 'METADATA' && (
          <MetadataAndRelationsScreen
            records={records}
            config={config}
            onToggleAssociateSidecars={() =>
              handleUpdateConfig({ ...config, associateSidecars: !config.associateSidecars })
            }
            language={language}
          />
        )}

        {currentView === 'EXACT_DUPLICATES' && (
          <ExactDuplicatesScreen
            records={records}
            onSetDecision={handleSetDecision}
            config={config}
            language={language}
          />
        )}

        {currentView === 'VISUAL_DUPLICATES' && (
          <VisualDuplicatesScreen
            records={records}
            onSetDecision={handleSetDecision}
            config={config}
            language={language}
          />
        )}

        {currentView === 'SIMILAR_PHOTOS' && (
          <SimilarPhotosScreen
            records={records}
            onSetDecision={handleSetDecision}
            config={config}
            language={language}
          />
        )}

        {currentView === 'BURSTS' && (
          <BurstReviewScreen
            records={records}
            onSetDecision={handleSetDecision}
            config={config}
            onUpdateConfig={handleUpdateConfig}
            language={language}
          />
        )}

        {currentView === 'QUALITY_BLUR' && (
          <QualityScreen
            records={records}
            onSetDecision={handleSetDecision}
            config={config}
            onUpdateConfig={handleUpdateConfig}
            language={language}
          />
        )}

        {currentView === 'DAMAGED_FILES' && (
          <DamagedFilesScreen records={records} language={language} />
        )}

        {currentView === 'OPERATION_PLANNER' && (
          <OperationPlannerScreen
            records={records}
            config={config}
            onExecuteBatch={handleExecuteBatch}
            language={language}
          />
        )}

        {currentView === 'HISTORY_JOURNAL' && (
          <HistoryJournalScreen
            journal={journal}
            batches={batches}
            onUndoBatch={handleUndoBatch}
            onClearJournal={handleClearJournal}
            language={language}
          />
        )}

        {currentView === 'QT_CPP_DOCS' && <QtCppDocsScreen language={language} />}
      </main>

      {/* Preferences & Shortcuts Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSaveConfig={handleUpdateConfig}
        language={language}
      />
    </div>
  );
}
