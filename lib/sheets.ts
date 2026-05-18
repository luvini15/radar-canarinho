import { parse } from "csv-parse/sync";
import type { EditorialPlayer, InstagramSnapshot } from "./types";

const DEFAULT_URL =
  "https://docs.google.com/spreadsheets/d/1rfHqW1esqkFiskdx4UuPDtQ21TQOVJfPmEEEGE0ERgM/export?format=csv&gid=0";

function cleanText(v: any): string {
  return String(v ?? "")
    .replace(/\uFFFD/g, "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .normalize("NFC")
    .trim();
}

function cleanNumber(v: any): number {
  return Number(
    String(v ?? "")
      .replace(/\./g, "")
      .replace(/,/g, "")
      .replace(/[^0-9-]/g, "") || 0
  );
}

function cleanDate(v: any): string {
  const raw = cleanText(v);
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);

  const br = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (br) return `${br[3]}-${br[2].padStart(2, "0")}-${br[1].padStart(2, "0")}`;

  const d = new Date(raw);
  return Number.isNaN(d.getTime())
    ? new Date().toISOString().slice(0, 10)
    : d.toISOString().slice(0, 10);
}

function cleanUsername(v: any): string {
  return cleanText(v).replace(/^@/, "").toLowerCase();
}

export function parseCsv(csv: string): InstagramSnapshot[] {
  const rows = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  }) as any[];

  return rows
    .map((r) => ({
      dataColeta: cleanDate(r["fetch date"] ?? r["Fetch date"]),
      nome: cleanText(r.name ?? r.Name),
      username: cleanUsername(r.username ?? r.Username),
      seguidores: cleanNumber(r["profile followers"] ?? r["Profile followers"]),
    }))
    .filter((r) => r.nome && r.seguidores > 0);
}

export function parseEditorialCsv(csv: string): EditorialPlayer[] {
  const rows = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  }) as any[];

  return rows
    .map((r) => ({
      username: cleanUsername(r.username),
      name: cleanText(r.name),
      posicao: cleanText(r["posição"] ?? r.posicao),
      grupoPosicao: cleanText(r["grupo_posição"] ?? r.grupo_posicao),
      clube: cleanText(r.clube),
      statusConvocacao: cleanText(r["status_convocação"] ?? r.status_convocacao),
      fotoUrl: cleanText(r.foto_url),
      escudoUrl: cleanText(r.escudo_url),
      observacaoEditorial: cleanText(r["observação_editorial"] ?? r.observacao_editorial),
    }))
    .filter((r) => r.username);
}

export async function fetchInstagramSheet(noStore = false): Promise<InstagramSnapshot[]> {
  const fetchOptions: RequestInit & { next?: { revalidate: number } } = noStore
    ? { cache: "no-store" }
    : { next: { revalidate: 60 * 15 } };

  const res = await fetch(process.env.SHEETS_CSV_URL || DEFAULT_URL, fetchOptions);
  if (!res.ok) throw new Error(`Erro ao ler Google Sheets: ${res.status} ${res.statusText}`);
  return parseCsv(await res.text());
}

export async function fetchEditorialSheet(noStore = false): Promise<EditorialPlayer[]> {
  const url = process.env.EDITORIAL_CSV_URL;

  if (!url) return [];

  const fetchOptions: RequestInit & { next?: { revalidate: number } } = noStore
    ? { cache: "no-store" }
    : { next: { revalidate: 60 * 15 } };

  const res = await fetch(url, fetchOptions);
  if (!res.ok) throw new Error(`Erro ao ler cadastro editorial: ${res.status} ${res.statusText}`);
  return parseEditorialCsv(await res.text());
}