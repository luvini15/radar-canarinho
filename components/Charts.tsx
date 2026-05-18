"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import type { InstagramSnapshot, PlayerSummary } from "@/lib/types";
import { formatCompact, formatFull } from "@/lib/metrics";

const colors = ["#009C3B", "#FFDF00", "#002776", "#7C3AED", "#EF4444", "#0EA5E9"];

function getNames(rows: InstagramSnapshot[], selected: string[]) {
  return selected.length ? selected : Array.from(new Set(rows.map((r) => r.nome))).slice(0, 5);
}

function getDates(rows: InstagramSnapshot[]) {
  return Array.from(new Set(rows.map((r) => r.dataColeta))).sort();
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

function findLatestUntil(rows: InstagramSnapshot[], name: string, date: string) {
  const key = normalizeKey(name);

  return rows
    .filter((x) => {
      const nomeKey = normalizeKey(x.nome);
      const usernameKey = normalizeKey(x.username);

      const matchName =
        nomeKey === key ||
        nomeKey.includes(key) ||
        key.includes(nomeKey);

      const matchUsername =
        usernameKey === key ||
        usernameKey.includes(key) ||
        key.includes(usernameKey);

      return (matchName || matchUsername) && x.dataColeta <= date;
    })
    .sort((a, b) => b.dataColeta.localeCompare(a.dataColeta))[0];
}

function buildFollowerData(rows: InstagramSnapshot[], selected: string[]) {
  const names = getNames(rows, selected);
  const dates = getDates(rows);

  const data = dates.map((date) => {
    const item: any = { data: date };

    for (const name of names) {
      const row = findLatestUntil(rows, name, date);
      item[name] = row?.seguidores ?? null;
    }

    return item;
  });

  return { names, data };
}

function buildDailyGrowthData(rows: InstagramSnapshot[], selected: string[]) {
  const names = getNames(rows, selected);
  const dates = getDates(rows);

  const data = dates.map((date, idx) => {
    const item: any = { data: date };

    for (const name of names) {
      const current = findLatestUntil(rows, name, date);
      const previousDate = dates[idx - 1];
      const previous = previousDate ? findLatestUntil(rows, name, previousDate) : null;

      item[name] = current && previous ? current.seguidores - previous.seguidores : 0;
    }

    return item;
  });

  return { names, data };
}

function buildAccumulatedGrowthData(rows: InstagramSnapshot[], selected: string[]) {
  const names = getNames(rows, selected);
  const dates = getDates(rows);

  const firstByName = new Map<string, number>();

  for (const name of names) {
    const first = rows
      .filter((r) => r.nome === name)
      .sort((a, b) => a.dataColeta.localeCompare(b.dataColeta))[0];

    firstByName.set(name, first?.seguidores ?? 0);
  }

  const data = dates.map((date) => {
    const item: any = { data: date };

    for (const name of names) {
      const current = findLatestUntil(rows, name, date);
      const first = firstByName.get(name) ?? 0;
      item[name] = current ? current.seguidores - first : 0;
    }

    return item;
  });

  return { names, data };
}

function getYAxisDomain(data: any[], names: string[]) {
  const values = data
    .flatMap((row) => names.map((name) => row[name]))
    .filter((value) => typeof value === "number" && Number.isFinite(value));

  if (!values.length) return ["auto", "auto"] as any;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = Math.max((max - min) * 0.12, max * 0.01, 1000);

  return [Math.max(0, Math.floor(min - padding)), Math.ceil(max + padding)] as any;
}

export function TopFollowersChart({ players }: { players: PlayerSummary[] }) {
  const data = players
    .slice(0, 10)
    .map((p) => ({ name: p.nome, seguidores: p.seguidores }))
    .reverse();

  return (
    <div className="h-96 rounded-3xl bg-white p-5 shadow-sm">
      <h3 className="mb-4 font-black text-brasil-azul">Top 10 por seguidores</h3>

      <ResponsiveContainer width="100%" height="88%">
        <BarChart data={data} layout="vertical" margin={{ left: 16, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tickFormatter={formatCompact} />
          <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v: any) => formatFull(Number(v))} />
          <Bar dataKey="seguidores" fill="#009C3B" radius={[0, 10, 10, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PositionMap({ players }: { players: PlayerSummary[] }) {
  const data = players.map((p) => ({
    x: p.posicaoRanking,
    y: p.seguidores,
    z: Math.max(80, Math.min(1200, p.seguidores / 180000)),
    name: p.nome,
    faixa:
      p.seguidores >= 100000000
        ? "100M+"
        : p.seguidores >= 10000000
          ? "10M-100M"
          : p.seguidores >= 1000000
            ? "1M-10M"
            : "Menos 1M",
  }));

  return (
    <div className="h-[520px] rounded-3xl bg-white p-5 shadow-sm">
      <h3 className="mb-1 font-black text-brasil-azul">Mapa de posicionamento digital</h3>
      <p className="mb-4 text-sm text-brasil-suave">
        Seguidores x posição no ranking · tamanho = proporção da audiência
      </p>

      <ResponsiveContainer width="100%" height="85%">
        <ScatterChart margin={{ left: 10, right: 20, top: 20, bottom: 20 }}>
          <CartesianGrid />
          <XAxis
            type="number"
            dataKey="x"
            name="Ranking"
            label={{ value: "Posição no Ranking", position: "bottom" }}
          />
          <YAxis type="number" dataKey="y" name="Seguidores" tickFormatter={formatCompact} />
          <ZAxis type="number" dataKey="z" range={[80, 1200]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={({ active, payload }) =>
              active && payload?.length ? (
                <div className="rounded-xl bg-white p-3 shadow">
                  <b>{payload[0].payload.name}</b>
                  <br />
                  Ranking: {payload[0].payload.x}
                  <br />
                  Seguidores: {formatFull(payload[0].payload.y)}
                  <br />
                  {payload[0].payload.faixa}
                </div>
              ) : null
            }
          />
          <Scatter data={data} fill="#009C3B" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TimelineChart({ rows, selected }: { rows: InstagramSnapshot[]; selected: string[] }) {
  const { names, data } = buildFollowerData(rows, selected);
  const domain = getYAxisDomain(data, names);

  return (
    <div className="h-[520px] rounded-3xl bg-white p-5 shadow-sm">
      <h3 className="mb-4 font-black text-brasil-azul">Evolução diária de seguidores</h3>

      <ResponsiveContainer width="100%" height="88%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="data" />
          <YAxis tickFormatter={formatCompact} domain={domain} />
          <Tooltip formatter={(v: any) => formatFull(Number(v))} />
          <Legend />
          {names.map((name, index) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              stroke={colors[index % colors.length]}
              strokeWidth={3}
              dot={{ r: 3 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DailyGrowthChart({
  rows,
  selected,
}: {
  rows: InstagramSnapshot[];
  selected: string[];
}) {
  const { names, data } = buildDailyGrowthData(rows, selected);

  return (
    <div className="h-[420px] rounded-3xl bg-white p-5 shadow-sm">
      <h3 className="mb-4 font-black text-brasil-azul">Crescimento diário de seguidores</h3>

      <ResponsiveContainer width="100%" height="86%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="data" />
          <YAxis tickFormatter={formatCompact} />
          <Tooltip formatter={(v: any) => formatFull(Number(v))} />
          <Legend />
          {names.map((name, index) => (
            <Bar
              key={name}
              dataKey={name}
              fill={colors[index % colors.length]}
              radius={[8, 8, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AccumulatedGrowthChart({
  rows,
  selected,
}: {
  rows: InstagramSnapshot[];
  selected: string[];
}) {
  const { names, data } = buildAccumulatedGrowthData(rows, selected);

  return (
    <div className="h-[420px] rounded-3xl bg-white p-5 shadow-sm">
      <h3 className="mb-4 font-black text-brasil-azul">Crescimento acumulado no período</h3>

      <ResponsiveContainer width="100%" height="86%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="data" />
          <YAxis tickFormatter={formatCompact} />
          <Tooltip formatter={(v: any) => formatFull(Number(v))} />
          <Legend />
          {names.map((name, index) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              stroke={colors[index % colors.length]}
              strokeWidth={3}
              dot={{ r: 3 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
