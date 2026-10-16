import { FileRecord, FileRelationship } from '../types';

/**
 * Computes exact SHA-256 hash using native browser SubtleCrypto.
 * 100% offline, deterministic, zero network.
 */
export async function computeSHA256(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Loads an image from a blob/URL into an HTMLImageElement safely.
 */
export function loadImageElement(urlOrBlob: string | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    let objectUrl = '';
    if (typeof urlOrBlob !== 'string') {
      objectUrl = URL.createObjectURL(urlOrBlob);
      img.src = objectUrl;
    } else {
      img.src = urlOrBlob;
    }

    img.onload = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      resolve(img);
    };

    img.onerror = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new Error('No se pudo decodificar la imagen (archivo corrupto o formato no soportado)'));
    };
  });
}

/**
 * Computes 64-bit dHash (difference hash):
 * 1. Resizes image to 9x8 pixels (72 pixels total).
 * 2. Converts to grayscale.
 * 3. Compares adjacent horizontal pixels: (pixel[x] > pixel[x+1] ? 1 : 0).
 * 4. Yields 64 bits represented as a 16-character hex string.
 */
export function computeDHashFromImage(img: HTMLImageElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = 9;
  canvas.height = 8;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '0000000000000000';

  ctx.drawImage(img, 0, 0, 9, 8);
  const imgData = ctx.getImageData(0, 0, 9, 8).data;

  // Compute 8 rows of grayscale luminance
  const gray: number[][] = [];
  for (let y = 0; y < 8; y++) {
    gray[y] = [];
    for (let x = 0; x < 9; x++) {
      const idx = (y * 9 + x) * 4;
      const r = imgData[idx];
      const g = imgData[idx + 1];
      const b = imgData[idx + 2];
      gray[y][x] = 0.299 * r + 0.587 * g + 0.114 * b;
    }
  }

  // 64-bit string
  let bits = '';
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      bits += gray[y][x] > gray[y][x + 1] ? '1' : '0';
    }
  }

  // Convert 64 bits to 16 hex chars
  let hex = '';
  for (let i = 0; i < 64; i += 4) {
    const nibble = parseInt(bits.substring(i, i + 4), 2);
    hex += nibble.toString(16);
  }
  return hex;
}

/**
 * Computes Hamming Distance between two 64-bit hex hashes.
 * Lower distance means more visually similar. 0 = visually identical.
 */
export function computeHammingDistance(hex1?: string, hex2?: string): number {
  if (!hex1 || !hex2 || hex1.length !== hex2.length) return 64;
  let dist = 0;
  for (let i = 0; i < hex1.length; i++) {
    const n1 = parseInt(hex1[i], 16);
    const n2 = parseInt(hex2[i], 16);
    let xor = n1 ^ n2;
    while (xor > 0) {
      dist += xor & 1;
      xor >>= 1;
    }
  }
  return dist;
}

/**
 * RF-27: Blurriness metric using classic Laplacian Variance.
 * Resizes the image to a standardized 256x256 resolution.
 * Applies 3x3 discrete Laplacian filter:
 *  [ 0  1  0 ]
 *  [ 1 -4  1 ]
 *  [ 0  1  0 ]
 * Calculates statistical variance of the Laplacian response.
 * Lower variance = lower edge contrast / blurry / out-of-focus.
 * Typical sharp photos have variance > 100-200. Blurry photos have < 50-80.
 */
export function computeLaplacianVariance(img: HTMLImageElement, size = 256): number {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return 0;

  ctx.drawImage(img, 0, 0, size, size);
  const src = ctx.getImageData(0, 0, size, size).data;

  // Step 1: Grayscale
  const gray = new Float32Array(size * size);
  for (let i = 0, j = 0; i < src.length; i += 4, j++) {
    gray[j] = 0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2];
  }

  // Step 2: Convolve with Laplacian Kernel
  const lap = new Float32Array((size - 2) * (size - 2));
  let sum = 0;
  let count = 0;

  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const c = gray[y * size + x];
      const top = gray[(y - 1) * size + x];
      const bottom = gray[(y + 1) * size + x];
      const left = gray[y * size + (x - 1)];
      const right = gray[y * size + (x + 1)];

      const val = top + bottom + left + right - 4 * c;
      lap[count] = val;
      sum += val;
      count++;
    }
  }

  const mean = sum / count;

  // Step 3: Variance
  let sumSqDiff = 0;
  for (let i = 0; i < count; i++) {
    const diff = lap[i] - mean;
    sumSqDiff += diff * diff;
  }

  const variance = sumSqDiff / count;
  return Math.round(variance * 10) / 10;
}

/**
 * RF-29: Burst grouping based on capture timestamp.
 * Groups photos taken within intervalSeconds (default 5s).
 */
export function detectBurstGroups(
  records: FileRecord[],
  intervalSeconds = 5,
  minBurstCount = 2
): Map<string, FileRecord[]> {
  const validRecords = records
    .filter((r) => r.captureDateValid && r.captureDate)
    .sort((a, b) => new Date(a.captureDate!).getTime() - new Date(b.captureDate!).getTime());

  const groups = new Map<string, FileRecord[]>();
  if (validRecords.length === 0) return groups;

  let currentGroupId = `burst-${Date.now()}-0`;
  let currentGroup: FileRecord[] = [validRecords[0]];

  for (let i = 1; i < validRecords.length; i++) {
    const prev = currentGroup[currentGroup.length - 1];
    const curr = validRecords[i];

    const prevTime = new Date(prev.captureDate!).getTime();
    const currTime = new Date(curr.captureDate!).getTime();
    const diffSec = Math.abs(currTime - prevTime) / 1000;

    if (diffSec <= intervalSeconds) {
      currentGroup.push(curr);
    } else {
      if (currentGroup.length >= minBurstCount) {
        groups.set(currentGroupId, [...currentGroup]);
      }
      currentGroupId = `burst-${currTime}-${i}`;
      currentGroup = [curr];
    }
  }

  if (currentGroup.length >= minBurstCount) {
    groups.set(currentGroupId, currentGroup);
  }

  return groups;
}

/**
 * RF-24: Exact duplicates grouping (SHA-256 binary identity).
 */
export function groupExactDuplicates(records: FileRecord[]): Map<string, FileRecord[]> {
  const hashMap = new Map<string, FileRecord[]>();

  for (const record of records) {
    if (!record.analysis?.sha256) continue;
    const hash = record.analysis.sha256;
    if (!hashMap.has(hash)) {
      hashMap.set(hash, []);
    }
    hashMap.get(hash)!.push(record);
  }

  // Filter only groups with 2 or more files
  const duplicateGroups = new Map<string, FileRecord[]>();
  for (const [hash, list] of hashMap.entries()) {
    if (list.length > 1) {
      duplicateGroups.set(hash, list);
    }
  }
  return duplicateGroups;
}

/**
 * RF-25: Visual duplicates grouping (pHash / dHash Hamming distance <= threshold).
 */
export function groupVisualDuplicates(
  records: FileRecord[],
  maxDistance = 6
): Array<{ groupId: string; records: FileRecord[]; avgDistance: number }> {
  const eligible = records.filter((r) => r.analysis?.dHash);
  const visited = new Set<string>();
  const groups: Array<{ groupId: string; records: FileRecord[]; avgDistance: number }> = [];

  for (let i = 0; i < eligible.length; i++) {
    const r1 = eligible[i];
    if (visited.has(r1.id)) continue;

    const currentGroup = [r1];
    visited.add(r1.id);
    let totalDist = 0;
    let distPairs = 0;

    for (let j = i + 1; j < eligible.length; j++) {
      const r2 = eligible[j];
      if (visited.has(r2.id)) continue;

      const dist = computeHammingDistance(r1.analysis?.dHash, r2.analysis?.dHash);
      if (dist <= maxDistance) {
        currentGroup.push(r2);
        visited.add(r2.id);
        totalDist += dist;
        distPairs++;
      }
    }

    if (currentGroup.length > 1) {
      groups.push({
        groupId: `vis-${r1.id}`,
        records: currentGroup,
        avgDistance: distPairs > 0 ? Math.round((totalDist / distPairs) * 10) / 10 : 0,
      });
    }
  }

  return groups;
}

/**
 * RF-22: RAW / JPEG and sidecars detection.
 * Matches files with same basename in the same folder.
 * Example: `IMG_0412.CR3` and `IMG_0412.JPG`, `DSC_001.JPG` and `DSC_001.xmp`
 */
export function detectSidecarsAndRawPairs(records: FileRecord[]): void {
  const rawExtensions = new Set(['cr2', 'cr3', 'nef', 'nrw', 'arw', 'srf', 'sr2', 'dng', 'raf', 'orf', 'rw2', 'pef', 'srw']);
  const sidecarExtensions = new Set(['xmp', 'json', 'aae', 'xml']);

  const getBaseName = (filename: string) => {
    const dotIndex = filename.lastIndexOf('.');
    return dotIndex > 0 ? filename.substring(0, dotIndex) : filename;
  };

  const getExt = (filename: string) => {
    const dotIndex = filename.lastIndexOf('.');
    return dotIndex > 0 ? filename.substring(dotIndex + 1).toLowerCase() : '';
  };

  // Group by (directory + baseName)
  const map = new Map<string, FileRecord[]>();
  for (const record of records) {
    record.relationships = [];
    const dir = record.relativePath.includes('/')
      ? record.relativePath.substring(0, record.relativePath.lastIndexOf('/'))
      : '';
    const base = getBaseName(record.name).toLowerCase();
    const key = `${dir}:::${base}`;

    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(record);
  }

  for (const [, group] of map.entries()) {
    if (group.length <= 1) continue;

    for (let i = 0; i < group.length; i++) {
      for (let j = 0; j < group.length; j++) {
        if (i === j) continue;
        const a = group[i];
        const b = group[j];
        const extA = getExt(a.name);
        const extB = getExt(b.name);

        let type: FileRelationship['relationshipType'] | null = null;
        let confidence: FileRelationship['confidence'] = 'HIGH';

        if (rawExtensions.has(extA) && (extB === 'jpg' || extB === 'jpeg')) {
          type = 'RAW_JPEG';
        } else if ((extA === 'jpg' || extA === 'jpeg') && rawExtensions.has(extB)) {
          type = 'RAW_JPEG';
        } else if (sidecarExtensions.has(extB)) {
          type = 'SIDECAR_XMP';
        } else if (sidecarExtensions.has(extA)) {
          type = 'SIDECAR_XMP';
        }

        if (type) {
          a.relationships.push({
            relatedFileId: b.id,
            relatedFileName: b.name,
            relationshipType: type,
            confidence,
          });
        }
      }
    }
  }
}
