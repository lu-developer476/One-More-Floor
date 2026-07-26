export const forbiddenExtensions = new Set([
  'png',
  'jpg',
  'jpeg',
  'webp',
  'gif',
  'bmp',
  'ico',
  'avif',
  'wav',
  'mp3',
  'ogg',
  'flac',
  'mp4',
  'webm',
  'mov',
  'zip',
  'gz',
  '7z',
  'pdf',
  'woff',
  'woff2',
  'ttf',
  'otf',
  'wasm',
  'trace',
]);
export const forbiddenDirectories = [
  'playwright-report/',
  'test-results/',
  'blob-report/',
  '.playwright/',
  'coverage/',
  'dist/',
];

export function inspectTrackedFile(path, content, size) {
  const issues = [];
  const extension = path.includes('.') ? path.split('.').pop().toLowerCase() : '';
  if (forbiddenExtensions.has(extension)) issues.push('extensión binaria prohibida');
  if (forbiddenDirectories.some((directory) => path.startsWith(directory)))
    issues.push('directorio generado');
  const lower = content.toLowerCase();
  if (extension === 'svg' && new RegExp('<' + 'image(?:\\s|>)', 'i').test(content))
    issues.push('SVG con image');
  if (lower.includes(';' + 'base64,')) issues.push('contenido base64 embebido');
  if (lower.includes('data:' + 'image')) issues.push('referencia data image');
  if (lower.includes('data:' + 'audio')) issues.push('referencia data audio');
  if (size > 1_000_000 && /[A-Za-z0-9+/]{4000,}={0,2}/.test(content))
    issues.push('archivo grande con datos sospechosos');
  return issues;
}
