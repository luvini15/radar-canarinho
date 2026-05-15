import { parse } from "csv-parse/sync";
import type { InstagramSnapshot } from "./types";

const DEFAULT_URL = "https://docs.google.com/spreadsheets/d/1rfHqW1esqkFiskdx4UuPDtQ21TQOVJfPmEEEGE0ERgM/export?format=csv&gid=0";

function cleanText(v:any): string {
  return String(v ?? "").replace(/\uFFFD/g,"").replace(/[\u0000-\u001F\u007F]/g,"").normalize("NFC").trim();
}
function cleanNumber(v:any): number {
  return Number(String(v ?? "").replace(/\./g,"").replace(/,/g,"").replace(/[^0-9-]/g,"") || 0);
}
function cleanDate(v:any): string {
  const raw = cleanText(v);
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0,10);
  const br = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (br) return `${br[3]}-${br[2].padStart(2,"0")}-${br[1].padStart(2,"0")}`;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? new Date().toISOString().slice(0,10) : d.toISOString().slice(0,10);
}

export function parseCsv(csv:string): InstagramSnapshot[] {
  const rows = parse(csv, {columns:true, skip_empty_lines:true, trim:true, bom:true}) as any[];
  return rows.map(r => ({
    dataColeta: cleanDate(r["fetch date"] ?? r["Fetch date"]),
    nome: cleanText(r.name ?? r.Name),
    username: cleanText(r.username ?? r.Username).replace(/^@/,""),
    seguidores: cleanNumber(r["profile followers"] ?? r["Profile followers"])
  })).filter(r => r.nome && r.seguidores > 0);
}

export async function fetchInstagramSheet(noStore=false): Promise<InstagramSnapshot[]> {
  const fetchOptions: RequestInit & { next?: { revalidate: number } } = noStore
    ? { cache: "no-store" }
    : { next: { revalidate: 60*15 } };

  const res = await fetch(process.env.SHEETS_CSV_URL || DEFAULT_URL, fetchOptions);
  if (!res.ok) throw new Error(`Erro ao ler Google Sheets: ${res.status} ${res.statusText}`);
  return parseCsv(await res.text());
}