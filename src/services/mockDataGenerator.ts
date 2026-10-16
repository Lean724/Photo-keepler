import { FileRecord } from '../types';
import {
  computeDHashFromImage,
  computeLaplacianVariance,
  computeSHA256,
  detectSidecarsAndRawPairs,
  loadImageElement,
} from './analysisEngine';

/**
 * Creates an image data URL with canvas drawing geometric scenery, text, or noise.
 */
function createSyntheticImageCanvas(
  width: number,
  height: number,
  options: {
    title: string;
    bgColor1: string;
    bgColor2: string;
    shapes?: boolean;
    blur?: boolean;
  }
): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, options.bgColor1);
    grad.addColorStop(1, options.bgColor2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    if (options.shapes) {
      // Draw sharp geometric shapes with strong contrast edges
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(width * 0.3, height * 0.4, width * 0.15, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(width * 0.55, height * 0.25, width * 0.3, height * 0.3);

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(0, height * 0.7);
      ctx.lineTo(width * 0.4, height * 0.5);
      ctx.lineTo(width * 0.7, height * 0.75);
      ctx.lineTo(width, height * 0.6);
      ctx.stroke();
    }

    if (options.blur) {
      // Simulates out-of-focus blur: draw low contrast washed out gradient without hard edges
      ctx.fillStyle = 'rgba(200, 200, 200, 0.4)';
      ctx.fillRect(0, 0, width, height);
      for (let i = 0; i < 20; i++) {
        const rad = ctx.createRadialGradient(
          width * 0.5,
          height * 0.5,
          10,
          width * 0.5,
          height * 0.5,
          width * 0.6
        );
        rad.addColorStop(0, 'rgba(255,255,255,0.05)');
        rad.addColorStop(1, 'rgba(0,0,0,0.05)');
        ctx.fillStyle = rad;
        ctx.fillRect(0, 0, width, height);
      }
    }

    // Title label
    ctx.fillStyle = options.blur ? 'rgba(80,80,80,0.3)' : '#0f172a';
    ctx.font = `bold ${Math.max(14, Math.floor(width / 20))}px sans-serif`;
    ctx.fillText(options.title, 20, 40);

    canvas.toBlob((blob) => {
      resolve(blob || new Blob([]));
    }, 'image/jpeg', options.blur ? 0.6 : 0.95);
  });
}

/**
 * Generates the complete reference test suite mandated by SPEC Section 18:
 * - Legitimate JPEGs
 * - Exact duplicate pair (different names, identical SHA-256)
 * - Visual duplicate pair (different re-compression, dHash distance <= 4)
 * - Burst sequence (3 photos taken 1.5s apart)
 * - Blurry photo (Laplacian variance < 40) vs Sharp photo (Laplacian variance > 250)
 * - Small image (< 150px, < 15KB)
 * - Missing EXIF date photo (requires manual date resolution per RF-10)
 * - Corrupted / damaged photo file (truncated bytes)
 * - RAW / JPEG / XMP sidecar group
 * - Unicode paths (e.g. `Viaje_Montaña_2026/foto_año_nuevo_ñ.jpg`)
 */
export async function generateSpecTestCollection(): Promise<FileRecord[]> {
  const records: FileRecord[] = [];

  // Helper to convert blob to object URL and compute analysis
  const processImageRecord = async (
    blob: Blob,
    filename: string,
    relativePath: string,
    opts: {
      captureDate?: string;
      captureDateValid: boolean;
      captureDateSource?: 'EXIF_ORIGINAL' | 'EXIF_DIGITIZED' | 'NONE';
      metadata?: any;
      forcedCorrupt?: boolean;
      format?: string;
    }
  ): Promise<FileRecord> => {
    const url = URL.createObjectURL(blob);
    const sha256 = await computeSHA256(blob);

    let dHash = '';
    let laplacianVariance = 0;
    let isBlurry = false;
    let width = 800;
    let height = 600;

    if (!opts.forcedCorrupt) {
      try {
        const img = await loadImageElement(url);
        width = img.naturalWidth || 800;
        height = img.naturalHeight || 600;
        dHash = computeDHashFromImage(img);
        laplacianVariance = computeLaplacianVariance(img, 256);
        isBlurry = laplacianVariance < 60;
      } catch (e) {
        // failed decode
      }
    }

    const isSmall = width < 250 || height < 250 || blob.size < 20000;

    const record: FileRecord = {
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: filename,
      path: `/fotos_origen/${relativePath}`,
      relativePath,
      size: blob.size,
      format: opts.format || 'JPEG',
      mimeType: opts.forcedCorrupt ? 'application/octet-stream' : 'image/jpeg',
      modifiedDate: '2026-10-15 11:30:00',
      captureDate: opts.captureDate,
      captureDateValid: opts.captureDateValid,
      captureDateSource: opts.captureDateSource || (opts.captureDateValid ? 'EXIF_ORIGINAL' : 'NONE'),
      reviewStatus: 'PENDING',
      thumbnailUrl: url,
      previewUrl: url,
      fileBlob: blob,
      relationships: [],
      metadata: {
        make: opts.metadata?.make || 'Sony',
        model: opts.metadata?.model || 'ILCE-7RM5',
        lens: opts.metadata?.lens || 'FE 24-70mm F2.8 GM II',
        iso: opts.metadata?.iso || 400,
        fNumber: opts.metadata?.fNumber || 2.8,
        exposureTime: opts.metadata?.exposureTime || '1/500s',
        focalLength: opts.metadata?.focalLength || '50mm',
        width,
        height,
        orientation: 1,
      },
      analysis: {
        sha256,
        dHash,
        laplacianVariance,
        isBlurry,
        isSmallImage: isSmall,
        isCorrupt: opts.forcedCorrupt || false,
        corruptReason: opts.forcedCorrupt
          ? 'Cabecera JPEG truncada: EOF inesperado antes de marcador SOS (0xFFDA)'
          : undefined,
        analysisDate: new Date().toISOString(),
        algorithmVersion: '1.0.0-laplacian-dhash',
      },
    };

    return record;
  };

  // 1. Sharp Landscape (Normal)
  const bLandscape = await createSyntheticImageCanvas(1200, 800, {
    title: 'Paisaje Andino (Nitida)',
    bgColor1: '#38bdf8',
    bgColor2: '#10b981',
    shapes: true,
  });
  records.push(
    await processImageRecord(
      bLandscape,
      'DSC_4010_Paisaje.jpg',
      'Viaje_Montaña_2026/DSC_4010_Paisaje.jpg',
      {
        captureDate: '2026-04-12 10:14:22',
        captureDateValid: true,
        metadata: { iso: 100, fNumber: 8.0, exposureTime: '1/250s' },
      }
    )
  );

  // 2. Exact Duplicates (Binary identical SHA-256, different file names)
  const bDupe = await createSyntheticImageCanvas(900, 600, {
    title: 'Original Duplicado Exacto',
    bgColor1: '#6366f1',
    bgColor2: '#a855f7',
    shapes: true,
  });
  // File A
  records.push(
    await processImageRecord(bDupe, 'IMG_7820.jpg', 'Eventos/IMG_7820.jpg', {
      captureDate: '2026-05-18 19:40:10',
      captureDateValid: true,
      metadata: { make: 'Canon', model: 'EOS R5' },
    })
  );
  // File B (Same bytes, different name and directory)
  records.push(
    await processImageRecord(bDupe, 'Copia_IMG_7820_Respaldo.jpg', 'Backup/Copia_IMG_7820_Respaldo.jpg', {
      captureDate: '2026-05-18 19:40:10',
      captureDateValid: true,
      metadata: { make: 'Canon', model: 'EOS R5' },
    })
  );

  // 3. Visual Duplicate (Re-compressed version, dHash distance ~ 0-2)
  const bVisualOrig = await createSyntheticImageCanvas(1000, 700, {
    title: 'Foto Retrato Visual',
    bgColor1: '#fb7185',
    bgColor2: '#f43f5e',
    shapes: true,
  });
  records.push(
    await processImageRecord(bVisualOrig, 'Retrato_Estudio_HQ.jpg', 'Estudio/Retrato_Estudio_HQ.jpg', {
      captureDate: '2026-06-20 16:05:00',
      captureDateValid: true,
      metadata: { iso: 200, fNumber: 1.8, exposureTime: '1/800s' },
    })
  );
  const bVisualCompress = await createSyntheticImageCanvas(800, 560, {
    title: 'Foto Retrato Visual',
    bgColor1: '#fb7185',
    bgColor2: '#f43f5e',
    shapes: true,
  });
  records.push(
    await processImageRecord(bVisualCompress, 'Retrato_Web_Opt.jpg', 'Web/Retrato_Web_Opt.jpg', {
      captureDate: '2026-06-20 16:05:00',
      captureDateValid: true,
    })
  );

  // 4. Burst Sequence (3 shots within 5 seconds interval: 14:32:01, 14:32:02, 14:32:04)
  const bBurst1 = await createSyntheticImageCanvas(900, 600, {
    title: 'Ráfaga Acción - Cuadro 1',
    bgColor1: '#0284c7',
    bgColor2: '#0369a1',
    shapes: true,
  });
  records.push(
    await processImageRecord(bBurst1, 'RAFAGA_001.JPG', 'Deportes/RAFAGA_001.JPG', {
      captureDate: '2026-07-04 14:32:01',
      captureDateValid: true,
      metadata: { exposureTime: '1/2000s', fNumber: 2.8 },
    })
  );
  const bBurst2 = await createSyntheticImageCanvas(900, 600, {
    title: 'Ráfaga Acción - Cuadro 2',
    bgColor1: '#0284c7',
    bgColor2: '#075985',
    shapes: true,
  });
  records.push(
    await processImageRecord(bBurst2, 'RAFAGA_002.JPG', 'Deportes/RAFAGA_002.JPG', {
      captureDate: '2026-07-04 14:32:02',
      captureDateValid: true,
      metadata: { exposureTime: '1/2000s', fNumber: 2.8 },
    })
  );
  const bBurst3 = await createSyntheticImageCanvas(900, 600, {
    title: 'Ráfaga Acción - Cuadro 3',
    bgColor1: '#0284c7',
    bgColor2: '#0c4a6e',
    shapes: true,
  });
  records.push(
    await processImageRecord(bBurst3, 'RAFAGA_003.JPG', 'Deportes/RAFAGA_003.JPG', {
      captureDate: '2026-07-04 14:32:04',
      captureDateValid: true,
      metadata: { exposureTime: '1/2000s', fNumber: 2.8 },
    })
  );

  // 5. Blurry / Out-of-Focus Photo (Laplacian variance low)
  const bBlurry = await createSyntheticImageCanvas(900, 600, {
    title: 'Desenfocada (Borrosa)',
    bgColor1: '#94a3b8',
    bgColor2: '#cbd5e1',
    blur: true,
    shapes: false,
  });
  records.push(
    await processImageRecord(bBlurry, 'IMG_Borrosa_FueraDeFoco.jpg', 'Descartes_Test/IMG_Borrosa_FueraDeFoco.jpg', {
      captureDate: '2026-08-11 21:15:30',
      captureDateValid: true,
      metadata: { fNumber: 1.4, exposureTime: '1/30s', iso: 6400 },
    })
  );

  // 6. Small Image / Icon (< 200px)
  const bSmall = await createSyntheticImageCanvas(128, 128, {
    title: 'Mini',
    bgColor1: '#f97316',
    bgColor2: '#ea580c',
    shapes: true,
  });
  records.push(
    await processImageRecord(bSmall, 'thumbnail_preview_small.jpg', 'Caché_Antigua/thumbnail_preview_small.jpg', {
      captureDate: '2026-01-05 08:00:00',
      captureDateValid: true,
    })
  );

  // 7. Missing EXIF Date Photo (RF-10: Must remain pending for manual resolution, never use modification date silently)
  const bNoDate = await createSyntheticImageCanvas(800, 600, {
    title: 'Escaneo Antiguo Sin EXIF',
    bgColor1: '#d97706',
    bgColor2: '#b45309',
    shapes: true,
  });
  records.push(
    await processImageRecord(bNoDate, 'Foto_Escaneada_SinFecha.jpg', 'Escaneos/Foto_Escaneada_SinFecha.jpg', {
      captureDate: undefined,
      captureDateValid: false,
      captureDateSource: 'NONE',
    })
  );

  // 8. Corrupted / Damaged File (RF-30)
  // Generates broken truncated binary data
  const corruptBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01]);
  const bCorrupt = new Blob([corruptBytes], { type: 'image/jpeg' });
  records.push(
    await processImageRecord(bCorrupt, 'FOTO_CORRUPTA_SECTOR_DANADO.JPG', 'Dañados/FOTO_CORRUPTA_SECTOR_DANADO.JPG', {
      captureDate: undefined,
      captureDateValid: false,
      forcedCorrupt: true,
    })
  );

  // 9. RAW (.CR3) + JPEG + .XMP sidecar trio
  const bRawMock = await createSyntheticImageCanvas(1400, 900, {
    title: 'Canon RAW (.CR3) Sensor Direct',
    bgColor1: '#0f766e',
    bgColor2: '#115e59',
    shapes: true,
  });
  const bJpgPair = await createSyntheticImageCanvas(1000, 650, {
    title: 'Embedded JPEG Preview',
    bgColor1: '#0f766e',
    bgColor2: '#115e59',
    shapes: true,
  });
  const xmpXmlText = `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about="" xmlns:crs="http://ns.adobe.com/camera-raw-settings/1.0/">
   <crs:Exposure2012>+0.65</crs:Exposure2012>
   <crs:Contrast2012>+15</crs:Contrast2012>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
  const bXmp = new Blob([xmpXmlText], { type: 'text/xml' });

  records.push(
    await processImageRecord(bRawMock, 'IMG_9042.CR3', 'RAW_Master/IMG_9042.CR3', {
      captureDate: '2026-09-14 11:20:00',
      captureDateValid: true,
      format: 'RAW (CR3)',
      metadata: { make: 'Canon', model: 'EOS R6 Mark II', iso: 800 },
    })
  );
  records.push(
    await processImageRecord(bJpgPair, 'IMG_9042.JPG', 'RAW_Master/IMG_9042.JPG', {
      captureDate: '2026-09-14 11:20:00',
      captureDateValid: true,
      format: 'JPEG',
    })
  );
  records.push(
    await processImageRecord(bXmp, 'IMG_9042.xmp', 'RAW_Master/IMG_9042.xmp', {
      captureDate: '2026-09-14 11:20:00',
      captureDateValid: true,
      format: 'XMP',
    })
  );

  // 10. Unicode path filename
  const bUnicode = await createSyntheticImageCanvas(900, 600, {
    title: 'Año Nuevo Peñaflor 2026 🎉',
    bgColor1: '#7c3aed',
    bgColor2: '#4c1d95',
    shapes: true,
  });
  records.push(
    await processImageRecord(
      bUnicode,
      'foto_año_nuevo_peña_2026.jpg',
      'Fiestas_Españolas_2026/foto_año_nuevo_peña_2026.jpg',
      {
        captureDate: '2026-01-01 02:45:10',
        captureDateValid: true,
      }
    )
  );

  // Detect relations between sidecars and RAW/JPEG
  detectSidecarsAndRawPairs(records);

  return records;
}
