import * as pdfjsLib from "pdfjs-dist";
import { supabase } from "@/integrations/supabase/client";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).toString();

const OCR_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pdf-ocr`;
const MAX_PAGES = 30;
const BATCH_SIZE = 3;
const MAX_IMAGE_CHARS = 600_000;
const pdfFiles = new Map<string, File>();

const pdfKey = (file: File) => `${file.name}|${file.size}|${file.lastModified}`;

async function renderPdf(file: File): Promise<string[]> {
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  if (pdf.numPages > MAX_PAGES) throw new Error(`O PDF possui ${pdf.numPages} páginas. O limite é ${MAX_PAGES}.`);
  const images: string[] = [];
  for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
    const page = await pdf.getPage(pageNo);
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(1.25, 1100 / Math.max(base.width, base.height));
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Não foi possível renderizar o PDF.");
    await page.render({ canvasContext: ctx, viewport }).promise;
    let quality = 0.68;
    let data = canvas.toDataURL("image/jpeg", quality);
    while (data.length > MAX_IMAGE_CHARS && quality > 0.35) {
      quality -= 0.07;
      data = canvas.toDataURL("image/jpeg", quality);
    }
    if (data.length > MAX_IMAGE_CHARS) throw new Error(`A página ${pageNo} do PDF é grande demais para o OCR.`);
    images.push(data);
    canvas.width = 1;
    canvas.height = 1;
  }
  return images;
}

async function ocr(images: string[], fileName: string, token: string) {
  const response = await fetch(OCR_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ images, fileName }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || `OCR falhou (${response.status})`) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return data.text || "";
}

async function extractPdf(file: File, token: string) {
  const images = await renderPdf(file);
  const parts: string[] = [];
  for (let i = 0; i < images.length; i += BATCH_SIZE) {
    parts.push(await ocr(images.slice(i, i + BATCH_SIZE), file.name, token));
  }
  return parts.join("\n\n");
}

function rememberPdfs(event: Event) {
  const input = event.target as HTMLInputElement | null;
  if (!input?.files) return;
  for (const file of Array.from(input.files)) {
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) pdfFiles.set(pdfKey(file), file);
  }
}

function findPdf(name: string) {
  for (const file of pdfFiles.values()) if (file.name === name) return file;
  return undefined;
}

async function enrich(input: RequestInfo | URL, init?: RequestInit) {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  if (!url.endsWith("/functions/v1/legal-chat") || typeof init?.body !== "string") return init;
  let payload: { messages?: Array<{ role: string; content: unknown }> };
  try { payload = JSON.parse(init.body); } catch { return init; }
  if (!Array.isArray(payload.messages)) return init;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return init;
  let changed = false;
  for (const message of payload.messages) {
    if (typeof message.content !== "string") continue;
    const matches = [...message.content.matchAll(/\[PDF anexado: ([^\]]+)\]/g)];
    for (const match of matches) {
      const file = findPdf(match[1]);
      if (!file) continue;
      const text = await extractPdf(file, session.access_token);
      message.content = message.content.replace(match[0], `[PDF analisado: ${file.name}]\n${text || "[Nenhum texto foi extraído]"}`);
      pdfFiles.delete(pdfKey(file));
      changed = true;
    }
  }
  return changed ? { ...init, body: JSON.stringify(payload) } : init;
}

export function installPdfChatBridge() {
  document.addEventListener("change", rememberPdfs, true);
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => originalFetch(input, await enrich(input, init));
}
