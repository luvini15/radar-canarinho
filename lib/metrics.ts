import type { InstagramSnapshot, PlayerSummary } from "./types";
import { inferMeta } from "./playerMeta";

export function formatCompact(v:number): string {
  if (v >= 1_000_000) return `${(v/1_000_000).toFixed(1).replace(".",",")}M`;
  if (v >= 1_000) return `${(v/1_000).toFixed(0)}K`;
  return String(Math.round(v || 0));
}
export function formatFull(v:number): string {
  return Math.round(v || 0).toLocaleString("pt-BR");
}
export function initials(name:string): string {
  const clean = name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z\s]/g,"").trim();
  return clean.split(/\s+/).slice(0,2).map(p=>p[0]).join("").toUpperCase() || "BR";
}
function previous(rows:InstagramSnapshot[], date:string, days:number): InstagramSnapshot | null {
  const d = new Date(date); d.setDate(d.getDate()-days);
  const target = d.toISOString().slice(0,10);
  const c = rows.filter(r => r.dataColeta <= target);
  return c[c.length-1] || null;
}
export function latestByPlayer(rows:InstagramSnapshot[]): PlayerSummary[] {
  const map = new Map<string, InstagramSnapshot[]>();
  for (const r of rows) {
    const key = r.nome.toLowerCase();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  const out: PlayerSummary[] = [];
  for (const [, arr] of map) {
    const s = arr.sort((a,b)=>a.dataColeta.localeCompare(b.dataColeta));
    const latest = s[s.length-1];
    const d7 = previous(s, latest.dataColeta, 7);
    const d15 = previous(s, latest.dataColeta, 15);
    const d30 = previous(s, latest.dataColeta, 30);
    const meta = inferMeta(latest.nome);
    out.push({
      ...latest,
      crescimento7d: d7 ? latest.seguidores - d7.seguidores : 0,
      crescimento15d: d15 ? latest.seguidores - d15.seguidores : 0,
      crescimento30d: d30 ? latest.seguidores - d30.seguidores : 0,
      posicaoRanking: 0,
      grupoPosicao: meta.grupoPosicao,
      clube: meta.clube
    });
  }
  return out.sort((a,b)=>b.seguidores-a.seguidores).map((p,i)=>({...p,posicaoRanking:i+1}));
}
export function growth(p: PlayerSummary, period: string) {
  if (period === "15") return p.crescimento15d;
  if (period === "30") return p.crescimento30d;
  return p.crescimento7d;
}
