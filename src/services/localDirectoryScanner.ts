import { FileRecord, ProjectConfig } from '../types';
import {
  computeDHashFromImage,
  computeLaplacianVariance,
  computeSHA256,
  detectSidecarsAndRawPairs,
  loadImageElement,
} from './analysisEngine';
import { extractMetadataFromFile } from './metadataExtractor';

export interface ScanProgress {
  totalFound: number;
  processedCount: number;
  currentFileName: string;
  isScanning: boolean;
  isPaused: boolean;
  errorsCount: number;
}

const SUPPORTED_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'webp',
  'avif',
  'bmp',
  'gif',
  'tiff',
  'tif',
  'heic',
  'heif',
  'cr2',
  'cr3',
  'nef',
  'nrw',
  'arw',
  'srf',
  'sr2',
  'dng',
  'raf',
  'orf',
  'rw2',
  'pef',
  'srw',
  'xmp',
]);

const RAW_EXTENSIONS = new Set([
  'cr2',
  'cr3',
  'nef',
  'nrw',
  'arw',
  'srf',
  'sr2',
  'dng',
  'raf',
  'orf',
  'rw2',
  'pef',
  'srw',
]);

export function detectFormatFromExtension(filename: string): string {
  const dot = filename.lastIndexOf('.');
  if (dot === -1) return 'UNKNOWN';
  const ext = filename.substring(dot + 1).toLowerCase();

  if (RAW_EXTENSIONS.has(ext)) return `RAW (${ext.toUpperCase()})`;
  if (ext === 'jpg' || ext === 'jpeg') return 'JPEG';
  if (ext === 'png') return 'PNG';
  if (ext === 'webp') return 'WEBP';
  if (ext === 'avif') return 'AVIF';
  if (ext === 'tiff' || ext === 'tif') return 'TIFF';
  if (ext === 'heic' || ext === 'heif') return 'HEIC';
  if (ext === 'bmp') return 'BMP';
  if (ext === 'gif') return 'GIF';
  if (ext === 'xmp') return 'XMP';
  return ext.toUpperCase();
}

/**
 * Checks RF-02: Exclude output and cache directories even if inside source.
 */
export function isPathExcluded(
  relativePath: string,
  config: ProjectConfig
): boolean {
  if (!config.excludeOutputDirs) return false;
  const lower = relativePath.toLowerCase();

  const approvedName = config.approvedDirectory.split('/').pop()?.toLowerCase();
  const discardName = config.discardDirectory.split('/').pop()?.toLowerCase();
  const cacheName = config.cacheDirectory.split('/').pop()?.toLowerCase();

  if (approvedName && lower.includes(approvedName)) return true;
  if (discardName && lower.includes(discardName)) return true;
  if (cacheName && lower.includes(cacheName)) return true;

  return false;
}

/**
 * Scans a FileList from an HTML5 <input type="file" webkitdirectory>
 * and processes files progressively without blocking the UI.
 */
export async function processLocalFileList(
  files: FileList | File[],
  config: ProjectConfig,
  onProgress?: (progress: ScanProgress) => void,
  shouldCancel?: () => boolean
): Promise<FileRecord[]> {
  const list = Array.from(files);
  const eligibleFiles = list.filter((f) => {
    const rel = (f as any).webkitRelativePath || f.name;
    if (isPathExcluded(rel, config)) return false;
    const dot = f.name.lastIndexOf('.');
    if (dot === -1) return false;
    const ext = f.name.substring(dot + 1).toLowerCase();
    return SUPPORTED_EXTENSIONS.has(ext);
  });

  const records: FileRecord[] = [];
  const total = eligibleFiles.length;
  let errorsCount = 0;

  for (let i = 0; i < total; i++) {
    if (shouldCancel && shouldCancel()) break;

    const file = eligibleFiles[i];
    const relPath = (file as any).webkitRelativePath || file.name;
    const format = detectFormatFromExtension(file.name);

    if (onProgress) {
      onProgress({
        totalFound: total,
        processedCount: i + 1,
        currentFileName: file.name,
        isScanning: true,
        isPaused: false,
        errorsCount,
      });
    }

    try {
      const sha256 = await computeSHA256(file);
      const { metadata, dateInfo, isCorrupt, corruptReason } = await extractMetadataFromFile(file);

      let url: string | undefined;
      let dHash: string | undefined;
      let laplacianVariance = 0;
      let isBlurry = false;
      let width = metadata.width;
      let height = metadata.height;

      // Create preview URL if decodable image
      if (!isCorrupt && format !== 'XMP') {
        try {
          url = URL.createObjectURL(file);
          const img = await loadImageElement(url);
          width = img.naturalWidth || width || 800;
          height = img.naturalHeight || height || 600;
          dHash = computeDHashFromImage(img);
          laplacianVariance = computeLaplacianVariance(img, 256);
          isBlurry = laplacianVariance < config.blurThreshold;
        } catch {
          // If browser can't decode (e.g. specialized RAW without embedded JPEG), keep metadata
        }
      }

      const isSmall = Boolean(
        width &&
        height &&
        (width < config.smallImageMaxWidth ||
          height < config.smallImageMaxHeight ||
          file.size < config.smallImageMaxBytes)
      );

      const record: FileRecord = {
        id: `local-${Date.now()}-${i}`,
        name: file.name,
        path: relPath,
        relativePath: relPath,
        size: file.size,
        format,
        mimeType: file.type || 'image/jpeg',
        modifiedDate: new Date(file.lastModified).toISOString().replace('T', ' ').substring(0, 19),
        captureDate: dateInfo.isValid ? dateInfo.dateStr : undefined,
        captureDateValid: dateInfo.isValid,
        captureDateSource: dateInfo.isValid ? dateInfo.source : 'NONE',
        reviewStatus: 'PENDING',
        metadata: {
          ...metadata,
          width,
          height,
        },
        analysis: {
          sha256,
          dHash,
          laplacianVariance,
          isBlurry,
          isSmallImage: isSmall,
          isCorrupt,
          corruptReason,
          analysisDate: new Date().toISOString(),
          algorithmVersion: '1.0.0-laplacian-dhash',
        },
        relationships: [],
        thumbnailUrl: url,
        previewUrl: url,
        fileBlob: file,
      };

      records.push(record);
    } catch (err: any) {
      errorsCount++;
      records.push({
        id: `err-${Date.now()}-${i}`,
        name: file.name,
        path: relPath,
        relativePath: relPath,
        size: file.size,
        format,
        mimeType: file.type || 'application/octet-stream',
        modifiedDate: new Date(file.lastModified).toISOString(),
        captureDateValid: false,
        captureDateSource: 'NONE',
        reviewStatus: 'ERROR',
        relationships: [],
        analysis: {
          isCorrupt: true,
          corruptReason: err?.message || 'Error de lectura física de archivo',
        },
      });
    }

    // Small yield every 5 files to let UI breathe
    if (i % 5 === 0) {
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  detectSidecarsAndRawPairs(records);
  return records;
}
