import { AttachmentMeta } from '../../types/vent';

export async function processUploadedFile(file: File): Promise<AttachmentMeta> {
  const id = `att_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const mimeType = file.type || 'application/octet-stream';
  const size = file.size;
  const name = file.name;

  let previewAvailable = false;
  let dataUrl: string | undefined = undefined;
  let extractedText: string | undefined = undefined;
  let summary: string | undefined = undefined;

  // Text and code files
  const isText =
    mimeType.startsWith('text/') ||
    /\.(txt|md|csv|tsv|json|js|ts|tsx|jsx|html|css|xml|yaml|yml|py|java|cpp|c|sh|sql)$/i.test(name);

  // Images
  const isImage = mimeType.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(name);

  // Audio / Video
  const isAudio = mimeType.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(name);
  const isVideo = mimeType.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/i.test(name);

  // PDF
  const isPdf = mimeType === 'application/pdf' || /\.pdf$/i.test(name);

  try {
    if (isText && size < 5 * 1024 * 1024) {
      extractedText = await file.text();
      previewAvailable = true;
      const previewSnippet = extractedText.slice(0, 300).trim();
      summary = `Plain text/code file (${(size / 1024).toFixed(1)} KB). Preview: "${previewSnippet}${
        extractedText.length > 300 ? '...' : ''
      }"`;
    } else if (isImage && size < 15 * 1024 * 1024) {
      dataUrl = await readFileAsDataURL(file);
      previewAvailable = true;
      summary = `Image asset (${(size / 1024).toFixed(1)} KB, ${mimeType}). Full preview available.`;
    } else if (isAudio && size < 25 * 1024 * 1024) {
      dataUrl = await readFileAsDataURL(file);
      previewAvailable = true;
      summary = `Audio track (${(size / (1024 * 1024)).toFixed(2)} MB, ${mimeType}). Playback available.`;
    } else if (isVideo && size < 40 * 1024 * 1024) {
      dataUrl = await readFileAsDataURL(file);
      previewAvailable = true;
      summary = `Video clip (${(size / (1024 * 1024)).toFixed(2)} MB, ${mimeType}). Playback available.`;
    } else if (isPdf) {
      previewAvailable = false; // safe fallback
      summary = `PDF Document (${(size / 1024).toFixed(1)} KB). Saved locally to Smart Vent.`;
    } else {
      previewAvailable = false;
      summary = `File available — preview/analysis unavailable for this format (${(size / 1024).toFixed(1)} KB).`;
    }
  } catch (err) {
    console.warn(`Error reading file ${name}:`, err);
    summary = `File saved locally. Error parsing detailed preview.`;
  }

  return {
    id,
    name,
    mimeType,
    size,
    dataUrl,
    extractedText: extractedText ? extractedText.slice(0, 10000) : undefined, // store readable snippet
    summary,
    previewAvailable,
    createdAt: Date.now(),
  };
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileCategoryIcon(mimeType: string, filename: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType === 'application/pdf' || filename.endsWith('.pdf')) return 'pdf';
  if (/\.(xlsx?|csv|tsv|ods)$/i.test(filename)) return 'sheet';
  if (/\.(docx?|odt|rtf|txt|md)$/i.test(filename)) return 'doc';
  if (/\.(zip|tar|gz|7z)$/i.test(filename)) return 'archive';
  if (/\.(js|ts|py|json|html|css|cpp|java|sql)$/i.test(filename)) return 'code';
  return 'file';
}
