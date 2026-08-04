import { PDFDocument } from "pdf-lib";

const LOGO_PATH = "/oroepi-logo.png";

async function fetchLogoBlob(): Promise<Blob> {
  const res = await fetch(LOGO_PATH);
  return res.blob();
}

function removeBackground(blob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imageData.data;

      const bgR = d[0];
      const bgG = d[1];
      const bgB = d[2];
      const tolerance = 30;

      for (let i = 0; i < d.length; i += 4) {
        if (
          Math.abs(d[i] - bgR) <= tolerance &&
          Math.abs(d[i + 1] - bgG) <= tolerance &&
          Math.abs(d[i + 2] - bgB) <= tolerance
        ) {
          d[i + 3] = 0;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed"))),
        "image/png"
      );
    };
    img.onerror = () => reject(new Error("Failed to load logo image"));
    img.src = URL.createObjectURL(blob);
  });
}

export async function embedLogo(doc: PDFDocument) {
  const rawBlob = await fetchLogoBlob();
  const cleanBlob = await removeBackground(rawBlob);
  const buffer = await cleanBlob.arrayBuffer();
  return doc.embedPng(buffer);
}
