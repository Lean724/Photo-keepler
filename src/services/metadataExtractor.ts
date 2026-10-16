import ExifReader from 'exifreader';
import { ImageMetadata } from '../types';

export interface ExtractedDateInfo {
  dateStr?: string;
  year?: number;
  month?: number;
  day?: number;
  source: 'EXIF_ORIGINAL' | 'EXIF_DIGITIZED' | 'NONE';
  isValid: boolean;
  rawString?: string;
}

/**
 * Validates whether an EXIF date string matches YYYY:MM:DD HH:MM:SS
 * and has valid astronomical bounds (Year 1970..currentYear+1, Month 1..12, Day 1..31).
 */
export function validateAndParseExifDate(rawDate?: string): ExtractedDateInfo {
  if (!rawDate || typeof rawDate !== 'string') {
    return { isValid: false, source: 'NONE' };
  }

  const clean = rawDate.trim();
  // Standard EXIF format: "YYYY:MM:DD HH:MM:SS" or "YYYY-MM-DD HH:MM:SS"
  const match = clean.match(/^(\d{4})[:\-](\d{2})[:\-](\d{2})(?:\s+(\d{2}):(\d{2}):(\d{2}))?/);
  if (!match) {
    return { isValid: false, source: 'NONE', rawString: rawDate };
  }

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  const currentYear = new Date().getFullYear();
  if (year < 1970 || year > currentYear + 1) {
    return { isValid: false, source: 'NONE', rawString: rawDate };
  }
  if (month < 1 || month > 12) {
    return { isValid: false, source: 'NONE', rawString: rawDate };
  }
  if (day < 1 || day > 31) {
    return { isValid: false, source: 'NONE', rawString: rawDate };
  }

  // Format into standard ISO-like representation for display and folder creation
  const monthPadded = String(month).padStart(2, '0');
  const dayPadded = String(day).padStart(2, '0');
  const timePart = match[4] ? ` ${match[4]}:${match[5] || '00'}:${match[6] || '00'}` : '';

  return {
    dateStr: `${year}-${monthPadded}-${dayPadded}${timePart}`,
    year,
    month,
    day,
    source: 'EXIF_ORIGINAL',
    isValid: true,
    rawString: rawDate,
  };
}

export async function extractMetadataFromFile(fileOrBlob: Blob): Promise<{
  metadata: ImageMetadata;
  dateInfo: ExtractedDateInfo;
  isCorrupt: boolean;
  corruptReason?: string;
}> {
  try {
    const arrayBuffer = await fileOrBlob.arrayBuffer();
    // ExifReader extracts without any external network request
    const tags = ExifReader.load(arrayBuffer, { expanded: true });

    let rawDate: string | undefined;
    let dateSource: 'EXIF_ORIGINAL' | 'EXIF_DIGITIZED' | 'NONE' = 'NONE';

    if (tags.exif?.DateTimeOriginal?.description) {
      rawDate = tags.exif.DateTimeOriginal.description;
      dateSource = 'EXIF_ORIGINAL';
    } else if (tags.exif?.DateTimeDigitized?.description) {
      rawDate = tags.exif.DateTimeDigitized.description;
      dateSource = 'EXIF_DIGITIZED';
    } else if (tags.exif?.DateTime?.description) {
      rawDate = tags.exif.DateTime.description;
      dateSource = 'EXIF_ORIGINAL';
    }

    const dateInfo = validateAndParseExifDate(rawDate);
    if (dateInfo.isValid) {
      dateInfo.source = dateSource;
    }

    const metadata: ImageMetadata = {
      make: tags.exif?.Make?.description,
      model: tags.exif?.Model?.description,
      lens: tags.exif?.LensModel?.description || (tags.exif as any)?.Lens?.description,
      iso: tags.exif?.ISOSpeedRatings?.value ? Number(tags.exif.ISOSpeedRatings.value) : undefined,
      fNumber: tags.exif?.FNumber?.description ? parseFloat(tags.exif.FNumber.description) : undefined,
      exposureTime: tags.exif?.ExposureTime?.description,
      focalLength: tags.exif?.FocalLength?.description,
      orientation: tags.exif?.Orientation?.value ? Number(tags.exif.Orientation.value) : 1,
      width: tags.file?.['Image Width']?.value ? Number(tags.file['Image Width'].value) : undefined,
      height: tags.file?.['Image Height']?.value ? Number(tags.file['Image Height'].value) : undefined,
      colorSpace: tags.exif?.ColorSpace?.description,
      flash: tags.exif?.Flash?.description,
      rawTags: {
        Software: tags.exif?.Software?.description,
        ExposureProgram: tags.exif?.ExposureProgram?.description,
        MeteringMode: tags.exif?.MeteringMode?.description,
        WhiteBalance: tags.exif?.WhiteBalance?.description,
      },
    };

    if (tags.gps?.Latitude && tags.gps?.Longitude) {
      metadata.gpsLatitude = Number(tags.gps.Latitude);
      metadata.gpsLongitude = Number(tags.gps.Longitude);
    }

    return {
      metadata,
      dateInfo,
      isCorrupt: false,
    };
  } catch (err: any) {
    // If not readable or corrupt
    return {
      metadata: {},
      dateInfo: { isValid: false, source: 'NONE' },
      isCorrupt: true,
      corruptReason: err?.message || 'Error al decodificar cabecera o metadatos EXIF',
    };
  }
}
