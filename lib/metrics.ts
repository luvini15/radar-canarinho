import type { EditorialPlayer, InstagramSnapshot, PlayerSummary } from "./types";
import { inferMeta } from "./playerMeta";

export function formatCompact(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(Math.round(v));
}

export function formatFull(v: number): string {
  return Math.round(v).toLocaleString("pt-BR");
}

export function formatPercent(v: number): string {
  return `${v.toFixed(2).replace(".", ",")}%`;
}

export function initials(name: string): string {
  const clean = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z\s]/g, "")
    .trim();

  return (
    clean
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase() || "BR"
  );
}

function normalizeKey(value: string) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^@/, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase()
    .trim();
}

function previous(
  rows: InstagramSnapshot[],
  date: string,
  days: number
): InstagramSnapshot | null {
  const d = new Date(date);
  d.setDate(d.getDate() - days);

  const target = d.toISOString().slice(0, 10);
  const candidates = rows.filter((r) => r.dataColeta <= target);

  return candidates[candidates.length - 1] || null;
}

function crescimento(
  latest: InstagramSnapshot,
  previousRow: InstagramSnapshot | null
): number {
  return previousRow ? latest.seguidores - previousRow.seguidores : 0;
}

function crescimentoPercentual(
  latest: InstagramSnapshot,
  previousRow: InstagramSnapshot | null
): number {
  if (!previousRow || previousRow.seguidores <= 0) return 0;
  return ((latest.seguidores - previousRow.seguidores) / previousRow.seguidores) * 100;
}

export function latestByPlayer(
  rows: InstagramSnapshot[],
  periodDays = 7,
  editorialRows: EditorialPlayer[] = []
): PlayerSummary[] {
  const editorialByUsername = new Map(
    editorialRows.map((p) => [normalizeKey(p.username), p])
  );

  const editorialByName = new Map(
    editorialRows.map((p) => [normalizeKey(p.name), p])
  );

  const map = new Map<string, InstagramSnapshot[]>();

  for (const r of rows) {
    const key = normalizeKey(r.username || r.nome);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }

  const out: PlayerSummary[] = [];

  for (const [, arr] of map) {
    const s = arr.sort((a, b) => a.dataColeta.localeCompare(b.dataColeta));
    const latest = s[s.length - 1];

    const d1 = previous(s, latest.dataColeta, 1);
    const d3 = previous(s, latest.dataColeta, 3);
    const d5 = previous(s, latest.dataColeta, 5);
    const d7 = previous(s, latest.dataColeta, 7);
    const d10 = previous(s, latest.dataColeta, 10);
    const d15 = previous(s, latest.dataColeta, 15);
    const d30 = previous(s, latest.dataColeta, 30);
    const dp = previous(s, latest.dataColeta, periodDays);

    const editorial =
      editorialByUsername.get(normalizeKey(latest.username)) ||
      editorialByName.get(normalizeKey(latest.nome));

    const inferred = inferMeta(latest.nome);

    out.push({
      ...latest,
      nome: editorial?.name || latest.nome,

      crescimento1d: crescimento(latest, d1),
      crescimento3d: crescimento(latest, d3),
      crescimento5d: crescimento(latest, d5),
      crescimento7d: crescimento(latest, d7),
      crescimento10d: crescimento(latest, d10),
      crescimento15d: crescimento(latest, d15),
      crescimento30d: crescimento(latest, d30),
      crescimentoPeriodo: crescimento(latest, dp),
      crescimentoPercentualPeriodo: crescimentoPercentual(latest, dp),

      posicaoRanking: 0,
      grupoPosicao: editorial?.grupoPosicao || inferred.grupoPosicao,
      clube: editorial?.clube || inferred.clube,
      posicao: editorial?.posicao || "",
      statusConvocacao: editorial?.statusConvocacao || "Pré-lista",
      fotoUrl: editorial?.fotoUrl || "",
      escudoUrl: editorial?.escudoUrl || "",
      observacaoEditorial: editorial?.observacaoEditorial || "",
    });
  }

  const onlyConvocados = out.filter((p) =>
    normalizeKey(p.statusConvocacao).includes("convocado")
  );

  return onlyConvocados
    .sort((a, b) => b.seguidores - a.seguidores)
    .map((p, i) => ({ ...p, posicaoRanking: i + 1 }));
}

export function getGrowthByPeriod(p: PlayerSummary, period: string) {
  if (period === "1") return p.crescimento1d;
  if (period === "3") return p.crescimento3d;
  if (period === "5") return p.crescimento5d;
  if (period === "10") return p.crescimento10d;
  if (period === "15") return p.crescimento15d;
  if (period === "30") return p.crescimento30d;
  return p.crescimento7d;
}

export function getGrowthBetweenDates(
  rows: InstagramSnapshot[],
  playerName: string,
  startDate: string,
  endDate: string
) {
  const playerRows = rows
    .filter((r) => r.nome === playerName)
    .sort((a, b) => a.dataColeta.localeCompare(b.dataColeta));

  const start = playerRows.filter((r) => r.dataColeta <= startDate).slice(-1)[0];
  const end = playerRows.filter((r) => r.dataColeta <= endDate).slice(-1)[0];

  if (!start || !end) {
    return {
      growth: 0,
      percent: 0,
    };
  }

  const growth = end.seguidores - start.seguidores;
  const percent = start.seguidores > 0 ? (growth / start.seguidores) * 100 : 0;

  return {
    growth,
    percent,
  };
}