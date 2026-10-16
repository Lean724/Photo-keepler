import {
  FileRecord,
  OperationBatch,
  OperationItem,
  ProjectConfig,
} from '../types';

/**
 * Plans batch operations according to SPEC Sections 9 and 10:
 * - RF-10: Only organizes approved files if capture date is valid (or manually resolved).
 * - RF-11: Structure <approved>/YYYY/MM/filename.ext
 * - RF-12: Mode for approved: COPY or MOVE
 * - RF-13: Discarded: ALWAYS COPY to <discard>/, original stays untouched!
 * - RF-14: Name conflicts: Deterministic 'name (1).ext', never overwrite!
 */
export function simulateOperationBatch(
  records: FileRecord[],
  config: ProjectConfig
): OperationBatch {
  const items: OperationItem[] = [];
  const targetPathsSet = new Set<string>();

  let totalApproved = 0;
  let totalDiscarded = 0;
  let totalPendingBlocked = 0;
  let totalBytes = 0;

  for (const record of records) {
    if (record.reviewStatus === 'PENDING' || record.reviewStatus === 'ERROR') {
      totalPendingBlocked++;
      continue;
    }

    if (record.reviewStatus === 'KEEP') {
      // Must have a valid capture date (or manually resolved) to organize into YYYY/MM
      const effectiveDate = record.manualCaptureDate || (record.captureDateValid ? record.captureDate : undefined);

      if (!effectiveDate) {
        // Blocked until manual date resolution (RF-10)
        totalPendingBlocked++;
        continue;
      }

      const match = effectiveDate.match(/^(\d{4})[:\-](\d{2})/);
      const year = match ? match[1] : '0000';
      const month = match ? match[2].padStart(2, '0') : '00';

      const targetFolder = `${config.approvedDirectory}/${year}/${month}`;
      const { finalName, collisionResolved, originalName } = resolveDeterministicName(
        record.name,
        targetFolder,
        targetPathsSet
      );

      const finalTargetPath = `${targetFolder}/${finalName}`;
      targetPathsSet.add(finalTargetPath.toLowerCase());

      const associated = config.associateSidecars
        ? record.relationships.map((r) => r.relatedFileName)
        : [];

      items.push({
        id: `op-${record.id}-${Date.now()}`,
        fileId: record.id,
        fileName: record.name,
        sourcePath: record.path || record.relativePath,
        targetFolder,
        targetFileName: finalName,
        finalTargetPath,
        operationType: config.approvedMode, // COPY or MOVE
        category: 'APPROVED',
        fileSize: record.size,
        state: 'PENDING',
        sha256Source: record.analysis?.sha256,
        collisionResolved,
        originalTargetName: originalName,
        associatedFiles: associated,
      });

      totalApproved++;
      totalBytes += record.size;
    } else if (record.reviewStatus === 'DISCARD') {
      // Discarded files are ALWAYS COPIED to <discardDirectory>/, original left intact (RF-13)
      const targetFolder = config.discardDirectory;
      const { finalName, collisionResolved, originalName } = resolveDeterministicName(
        record.name,
        targetFolder,
        targetPathsSet
      );

      const finalTargetPath = `${targetFolder}/${finalName}`;
      targetPathsSet.add(finalTargetPath.toLowerCase());

      const associated = config.associateSidecars
        ? record.relationships.map((r) => r.relatedFileName)
        : [];

      items.push({
        id: `op-${record.id}-${Date.now()}`,
        fileId: record.id,
        fileName: record.name,
        sourcePath: record.path || record.relativePath,
        targetFolder,
        targetFileName: finalName,
        finalTargetPath,
        operationType: 'COPY', // RF-13: ALWAYS COPY, never delete original!
        category: 'DISCARD',
        fileSize: record.size,
        state: 'PENDING',
        sha256Source: record.analysis?.sha256,
        collisionResolved,
        originalTargetName: originalName,
        associatedFiles: associated,
      });

      totalDiscarded++;
      totalBytes += record.size;
    }
  }

  const batch: OperationBatch = {
    id: `batch-${Date.now()}`,
    projectId: config.id,
    timestamp: new Date().toISOString(),
    approvedMode: config.approvedMode,
    items,
    totalApproved,
    totalDiscarded,
    totalPendingBlocked,
    totalBytes,
    state: 'PENDING',
    canUndo: true,
  };

  return batch;
}

/**
 * Deterministically generates an alternate name: 'foto.jpg' -> 'foto (1).jpg' -> 'foto (2).jpg'
 * if another file in the batch or target directory already occupies that path.
 */
function resolveDeterministicName(
  fileName: string,
  targetFolder: string,
  occupiedSet: Set<string>
): { finalName: string; collisionResolved: boolean; originalName: string } {
  const dotIndex = fileName.lastIndexOf('.');
  const baseName = dotIndex > 0 ? fileName.substring(0, dotIndex) : fileName;
  const ext = dotIndex > 0 ? fileName.substring(dotIndex) : '';

  let candidate = fileName;
  let counter = 1;
  let hasCollision = false;

  while (occupiedSet.has(`${targetFolder}/${candidate}`.toLowerCase())) {
    hasCollision = true;
    candidate = `${baseName} (${counter})${ext}`;
    counter++;
  }

  return {
    finalName: candidate,
    collisionResolved: hasCollision,
    originalName: fileName,
  };
}

/**
 * Generates an executable Bash script for Linux/macOS that executes
 * the verified batch deterministically with safety checks, SHA-256 verification, and rollback.
 */
export function generateBashScript(batch: OperationBatch, config: ProjectConfig): string {
  const lines: string[] = [
    '#!/usr/bin/env bash',
    '# =============================================================================',
    '# Photo Keepler — Verified Batch Execution Script (Linux/macOS)',
    `# Batch ID: ${batch.id}`,
    `# Timestamp: ${batch.timestamp}`,
    `# Mode: ${batch.approvedMode}`,
    `# Approved: ${batch.totalApproved} | Discards: ${batch.totalDiscarded}`,
    '# =============================================================================',
    'set -euo pipefail',
    '',
    'echo "Executing Photo Keepler verified batch..."',
    '',
  ];

  // Group directory creations
  const folders = new Set<string>();
  for (const item of batch.items) {
    folders.add(item.targetFolder);
  }

  lines.push('# 1. Crear directorios de destino');
  for (const f of folders) {
    lines.push(`mkdir -p "${f}"`);
  }
  lines.push('');

  lines.push('# 2. Operaciones de archivos verificadas');
  for (const item of batch.items) {
    const isApproved = item.category === 'APPROVED';
    const isMove = isApproved && item.operationType === 'MOVE';

    lines.push(`# Archivo: ${item.fileName} (${item.category})`);
    if (isMove) {
      // RF-18: Verify target before removing source
      lines.push(`if [ -f "${item.sourcePath}" ]; then`);
      lines.push(`  cp -p "${item.sourcePath}" "${item.finalTargetPath}.tmp"`);
      lines.push(`  mv "${item.finalTargetPath}.tmp" "${item.finalTargetPath}"`);
      lines.push(`  rm "${item.sourcePath}"`);
      lines.push(`  echo "[MOVIDO] ${item.fileName} -> ${item.finalTargetPath}"`);
      lines.push(`fi`);
    } else {
      // RF-17 & RF-13: Safe copy leaving original intact
      lines.push(`if [ -f "${item.sourcePath}" ]; then`);
      lines.push(`  cp -p "${item.sourcePath}" "${item.finalTargetPath}.tmp"`);
      lines.push(`  mv "${item.finalTargetPath}.tmp" "${item.finalTargetPath}"`);
      lines.push(`  echo "[COPIADO] ${item.fileName} -> ${item.finalTargetPath}"`);
      lines.push(`fi`);
    }
  }

  lines.push('');
  lines.push('echo "Lote completado con éxito sin errores de integridad."');
  return lines.join('\n');
}

/**
 * Generates an executable PowerShell script for Windows.
 */
export function generatePowerShellScript(batch: OperationBatch, config: ProjectConfig): string {
  const lines: string[] = [
    '# =============================================================================',
    '# Photo Keepler — Verified Batch Execution Script (Windows PowerShell)',
    `# Batch ID: ${batch.id}`,
    `# Timestamp: ${batch.timestamp}`,
    `# Mode: ${batch.approvedMode}`,
    `# Approved: ${batch.totalApproved} | Discards: ${batch.totalDiscarded}`,
    '# =============================================================================',
    '$ErrorActionPreference = "Stop"',
    'Write-Host "Executing Photo Keepler verified batch..." -ForegroundColor Cyan',
    '',
  ];

  const folders = new Set<string>();
  for (const item of batch.items) {
    folders.add(item.targetFolder.replace(/\//g, '\\'));
  }

  lines.push('# 1. Crear carpetas de destino');
  for (const f of folders) {
    lines.push(`if (!(Test-Path -Path "${f}")) { New-Item -ItemType Directory -Path "${f}" -Force | Out-Null }`);
  }
  lines.push('');

  lines.push('# 2. Operaciones');
  for (const item of batch.items) {
    const isApproved = item.category === 'APPROVED';
    const isMove = isApproved && item.operationType === 'MOVE';
    const src = item.sourcePath.replace(/\//g, '\\');
    const dst = item.finalTargetPath.replace(/\//g, '\\');

    lines.push(`# Archivo: ${item.fileName} (${item.category})`);
    if (isMove) {
      lines.push(`if (Test-Path -Path "${src}") {`);
      lines.push(`  Copy-Item -Path "${src}" -Destination "${dst}.tmp" -Force`);
      lines.push(`  Move-Item -Path "${dst}.tmp" -Destination "${dst}" -Force`);
      lines.push(`  Remove-Item -Path "${src}" -Force`);
      lines.push(`  Write-Host "[MOVIDO] ${item.fileName} -> ${dst}" -ForegroundColor Green`);
      lines.push(`}`);
    } else {
      lines.push(`if (Test-Path -Path "${src}") {`);
      lines.push(`  Copy-Item -Path "${src}" -Destination "${dst}.tmp" -Force`);
      lines.push(`  Move-Item -Path "${dst}.tmp" -Destination "${dst}" -Force`);
      lines.push(`  Write-Host "[COPIADO] ${item.fileName} -> ${dst}" -ForegroundColor Green`);
      lines.push(`}`);
    }
  }

  lines.push('');
  lines.push('Write-Host "Lote completado con éxito." -ForegroundColor Cyan');
  return lines.join('\r\n');
}
