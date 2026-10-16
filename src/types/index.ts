export type ReviewStatus = 'PENDING' | 'KEEP' | 'DISCARD' | 'ERROR';

export type ApprovedFileMode = 'COPY' | 'MOVE';

export type OperationState =
  | 'PENDING'
  | 'RUNNING'
  | 'VERIFIED'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'RECOVERY_REQUIRED';

export interface ProjectConfig {
  id: string;
  name: string;
  sourceDirectory: string;
  approvedDirectory: string;
  discardDirectory: string;
  cacheDirectory: string;
  approvedMode: ApprovedFileMode;
  excludeOutputDirs: boolean;
  followSymlinks: boolean;
  burstIntervalSeconds: number;
  blurThreshold: number; // Laplacian variance threshold
  minBurstCount: number;
  smallImageMaxWidth: number;
  smallImageMaxHeight: number;
  smallImageMaxBytes: number;
  associateSidecars: boolean;
  autoAdvanceOnDecision: boolean;
  keepKey: string;
  discardKey: string;
  keepLabel: string;
  discardLabel: string;
}

export interface ImageMetadata {
  make?: string;
  model?: string;
  lens?: string;
  iso?: number;
  fNumber?: number;
  exposureTime?: string;
  focalLength?: string;
  orientation?: number;
  width?: number;
  height?: number;
  gpsLatitude?: number;
  gpsLongitude?: number;
  colorSpace?: string;
  flash?: string;
  rawTags?: Record<string, any>;
}

export interface FileRelationship {
  relatedFileId: string;
  relatedFileName: string;
  relationshipType: 'RAW_JPEG' | 'SIDECAR_XMP' | 'EDIT_VERSION';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface AnalysisResult {
  sha256?: string;
  dHash?: string; // 64-bit difference hash in hex
  pHash?: string; // 64-bit perceptual hash in hex
  laplacianVariance?: number;
  isBlurry?: boolean;
  isSmallImage?: boolean;
  isCorrupt?: boolean;
  corruptReason?: string;
  exactDuplicateGroupId?: string;
  visualDuplicateGroupId?: string;
  burstGroupId?: string;
  analysisDate?: string;
  algorithmVersion?: string;
}

export interface FileRecord {
  id: string;
  name: string;
  path: string;
  relativePath: string;
  size: number;
  format: string; // 'JPEG' | 'PNG' | 'RAW (CR2/NEF/ARW/DNG)' | 'HEIC' | 'WEBP' | 'TIFF' | 'XMP' | 'UNKNOWN'
  mimeType: string;
  modifiedDate: string;
  captureDate?: string; // EXIF DateTimeOriginal
  captureDateValid: boolean;
  captureDateSource?: 'EXIF_ORIGINAL' | 'EXIF_DIGITIZED' | 'MANUAL_RESOLUTION' | 'NONE';
  manualCaptureDate?: string; // If user manually resolved RF-10
  reviewStatus: ReviewStatus;
  reviewDate?: string;
  reviewOrigin?: 'MANUAL_KEY' | 'MANUAL_CLICK' | 'BATCH_SELECTION';
  metadata?: ImageMetadata;
  analysis?: AnalysisResult;
  relationships: FileRelationship[];
  thumbnailUrl?: string;
  previewUrl?: string;
  fileBlob?: Blob;
  realFileHandle?: any; // For File System Access API
}

export interface OperationItem {
  id: string;
  fileId: string;
  fileName: string;
  sourcePath: string;
  targetFolder: string;
  targetFileName: string;
  finalTargetPath: string;
  operationType: 'COPY' | 'MOVE';
  category: 'APPROVED' | 'DISCARD';
  fileSize: number;
  state: OperationState;
  sha256Source?: string;
  sha256Target?: string;
  collisionResolved: boolean;
  originalTargetName?: string;
  errorMessage?: string;
  associatedFiles: string[];
}

export interface OperationBatch {
  id: string;
  projectId: string;
  timestamp: string;
  approvedMode: ApprovedFileMode;
  items: OperationItem[];
  totalApproved: number;
  totalDiscarded: number;
  totalPendingBlocked: number;
  totalBytes: number;
  state: OperationState;
  canUndo: boolean;
}

export interface JournalEntry {
  id: string;
  timestamp: string;
  action: 'BATCH_EXECUTE' | 'UNDO' | 'DECISION_CHANGE' | 'CONFIG_UPDATE' | 'RECOVERY_SCAN';
  description: string;
  batchId?: string;
  itemCount?: number;
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
  details?: Record<string, any>;
}

export type ViewMode =
  | 'PROJECT'
  | 'SINGLE_REVIEW'
  | 'GRID_VIEW'
  | 'METADATA'
  | 'EXACT_DUPLICATES'
  | 'VISUAL_DUPLICATES'
  | 'SIMILAR_PHOTOS'
  | 'BURSTS'
  | 'QUALITY_BLUR'
  | 'DAMAGED_FILES'
  | 'OPERATION_PLANNER'
  | 'HISTORY_JOURNAL'
  | 'QT_CPP_DOCS';
