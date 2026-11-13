// Exports render from the same SVG string as the preview, so files always match what you see.
export const pngSizes = [16, 32, 48, 180, 192, 512];

function save(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function downloadSvg(svg, name = 'mark') {
  save(new Blob([svg], { type: 'image/svg+xml' }), `${name}.svg`);
}

export function downloadPng(svg, size, name = 'mark') {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      canvas.getContext('2d').drawImage(img, 0, 0, size, size);
      canvas.toBlob(b => { save(b, `${name}-${size}.png`); resolve(); }, 'image/png');
    };
    img.onerror = reject;
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}
