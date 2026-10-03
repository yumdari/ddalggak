// PDF 첫 페이지를 작은 이미지(JPEG data URL)로 만든다. 브라우저에서만 동작한다.
// 만들지 못하면 null을 돌려주고, 화면에서는 이미지 없이 보여준다.
export async function firstPageThumb(blob: Blob, width = 480): Promise<string | null> {
  try {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();

    const task = pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) });
    try {
      const pdf = await task.promise;
      const page = await pdf.getPage(1);
      const scale = width / page.getViewport({ scale: 1 }).width;
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      await page.render({ canvas, viewport }).promise;
      return canvas.toDataURL("image/jpeg", 0.75);
    } finally {
      await task.destroy();
    }
  } catch {
    return null;
  }
}
