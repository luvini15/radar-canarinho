"use client";

import { useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
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

const NEXUS_BLUE = "#071838";
const NEXUS_GREEN = "#00ab4d";
const NEXUS_YELLOW = "#F79332";
const NEXUS_GRAY = "#76787b";
const NEXUS_LIGHT_GREEN = "#EEF9F2";

const colors = [NEXUS_GREEN, NEXUS_YELLOW, "#24aae1", "#94bbe3", "#ee1d23", "#76787b"];

export type TimelineMode = "total" | "growth";

type TimelineEvent = {
  date: string;
  endDate?: string;
  title: string;
  type: string;
  description: string;
  impact: string;
};

function getNames(rows: InstagramSnapshot[], selected: string[]) {
  return selected.length ? selected : Array.from(new Set(rows.map((r) => r.nome))).slice(0, 5);
}

function getDates(rows: InstagramSnapshot[], startDate?: string, endDate?: string) {
  return Array.from(new Set(rows.map((r) => r.dataColeta)))
    .filter((date) => (!startDate || date >= startDate) && (!endDate || date <= endDate))
    .sort();
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

function buildFollowerData(
  rows: InstagramSnapshot[],
  selected: string[],
  startDate?: string,
  endDate?: string
) {
  const names = getNames(rows, selected);
  const dates = getDates(rows, startDate, endDate);

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

function buildAccumulatedGrowthData(
  rows: InstagramSnapshot[],
  selected: string[],
  startDate?: string,
  endDate?: string
) {
  const names = getNames(rows, selected);
  const dates = getDates(rows, startDate, endDate);
  const firstDate = dates[0];

  const firstByName = new Map<string, number>();

  for (const name of names) {
    const first = firstDate ? findLatestUntil(rows, name, firstDate) : null;
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

function getYAxisDomain(data: any[], names: string[], forceStartAtZero = false) {
  const values = data
    .flatMap((row) => names.map((name) => row[name]))
    .filter((value) => typeof value === "number" && Number.isFinite(value));

  if (!values.length) return ["auto", "auto"] as any;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = Math.max((max - min) * 0.12, max * 0.01, 1000);

  if (forceStartAtZero) {
    return [0, Math.ceil(max + padding)] as any;
  }

  return [Math.max(0, Math.floor(min - padding)), Math.ceil(max + padding)] as any;
}

function dateToBRLocal(date?: string) {
  if (!date) return "";
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

function buildEventMarkers(data: any[], events: TimelineEvent[], firstName?: string) {
  if (!firstName) return [];

  return events
    .map((event, index) => {
      const closest = data.find((d) => d.data >= event.date) ?? data[data.length - 1];
      const y = closest?.[firstName];

      return {
        ...event,
        number: index + 1,
        chartDate: closest?.data,
        y,
      };
    })
    .filter(
      (event) =>
        event.chartDate &&
        typeof event.y === "number" &&
        Number.isFinite(event.y)
    );
}

function buildTimelineInsights(data: any[], names: string[]) {
  const daily: { name: string; date: string; growth: number }[] = [];
  const total: { name: string; growth: number }[] = [];

  for (const name of names) {
    const valid = data
      .map((row) => ({
        date: row.data,
        value: row[name],
      }))
      .filter((row) => typeof row.value === "number" && Number.isFinite(row.value));

    if (!valid.length) continue;

    const first = valid[0].value;
    const last = valid[valid.length - 1].value;

    total.push({
      name,
      growth: last - first,
    });

    for (let i = 1; i < valid.length; i++) {
      daily.push({
        name,
        date: valid[i].date,
        growth: valid[i].value - valid[i - 1].value,
      });
    }
  }

  const topDaily = daily.sort((a, b) => b.growth - a.growth)[0];
  const topTotal = total.sort((a, b) => b.growth - a.growth)[0];

  return { topDaily, topTotal };
}

function circledNumber(n: number) {
  const values = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"];
  return values[n - 1] ?? String(n);
}

function downloadSvgAsPng({
  container,
  filename,
  title,
  subtitle,
  events,
  playerName,
  totalGrowth,
}: {
  container: HTMLDivElement | null;
  filename: string;
  title: string;
  subtitle: string;
  events: ReturnType<typeof buildEventMarkers>;
  playerName?: string;
  totalGrowth?: number;
}) {
  const svg = container?.querySelector("svg");
  if (!svg) return;

  const clone = svg.cloneNode(true) as SVGSVGElement;
  const box = svg.getBoundingClientRect();

  clone.setAttribute("width", String(box.width));
  clone.setAttribute("height", String(box.height));
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  const source = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  const loadImage = (src: string) =>
    new Promise<HTMLImageElement | null>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });

  Promise.all([
    loadImage(svgUrl),
    loadImage("/brand/logo-nexus-color.png"),
  ]).then(([chartImage, logoImage]) => {
    if (!chartImage) {
      URL.revokeObjectURL(svgUrl);
      return;
    }

    const scale = 2;
    const padding = 42;
    const headerHeight = playerName ? 132 : 86;
    const eventLineHeight = 22;
    const eventsHeight = events.length ? events.length * eventLineHeight + 58 : 0;
    const footerHeight = 76;

    const canvasWidth = Math.max(1, Math.round((box.width + padding * 2) * scale));
    const canvasHeight = Math.max(
      1,
      Math.round((headerHeight + box.height + eventsHeight + footerHeight + padding) * scale)
    );

    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      URL.revokeObjectURL(svgUrl);
      return;
    }

    context.scale(scale, scale);

    const width = canvasWidth / scale;
    const height = canvasHeight / scale;

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);

    if (logoImage) {
      const logoWidth = 155;
      const logoHeight = (logoImage.height / logoImage.width) * logoWidth;
      context.drawImage(logoImage, width - padding - logoWidth, 24, logoWidth, logoHeight);
    } else {
      context.fillStyle = NEXUS_BLUE;
      context.font = "900 20px Arial, sans-serif";
      context.fillText("nexus.", width - padding - 90, 44);
    }

    if (playerName) {
      context.fillStyle = NEXUS_BLUE;
      context.font = "900 30px Arial, sans-serif";
      context.fillText(playerName.toUpperCase(), padding, 36);

      context.fillStyle = NEXUS_GREEN;
      context.font = "900 21px Arial, sans-serif";
      const growthText =
        typeof totalGrowth === "number"
          ? `+${formatFull(totalGrowth)} seguidores no período`
          : "Crescimento de seguidores no período";
      context.fillText(growthText, padding, 66);

      context.fillStyle = NEXUS_GRAY;
      context.font = "400 13px Arial, sans-serif";
      context.fillText("Desde a convocação da Seleção Brasileira", padding, 90);

      context.fillStyle = NEXUS_BLUE;
      context.font = "900 18px Arial, sans-serif";
      context.fillText(title, padding, 116);

      context.fillStyle = NEXUS_GRAY;
      context.font = "400 12px Arial, sans-serif";
      context.fillText(subtitle, padding, 136);
    } else {
      context.fillStyle = NEXUS_BLUE;
      context.font = "900 22px Arial, sans-serif";
      context.fillText(title, padding, 34);

      context.fillStyle = NEXUS_GRAY;
      context.font = "400 13px Arial, sans-serif";
      context.fillText(subtitle, padding, 56);
    }

    context.drawImage(chartImage, padding, headerHeight, box.width, box.height);

    let y = headerHeight + box.height + 30;

    if (events.length) {
      const boxX = padding;
      const boxY = y - 18;
      const boxW = box.width;
      const boxH = events.length * eventLineHeight + 40;

      context.fillStyle = NEXUS_LIGHT_GREEN;
      context.strokeStyle = NEXUS_GREEN;
      context.lineWidth = 1;
      context.beginPath();
      context.roundRect(boxX, boxY, boxW, boxH, 14);
      context.fill();
      context.stroke();

      context.fillStyle = NEXUS_BLUE;
      context.font = "900 13px Arial, sans-serif";
      context.fillText("Eventos que podem ter influenciado o crescimento", boxX + 16, y);

      context.font = "700 12px Arial, sans-serif";
      events.forEach((event, index) => {
        const date =
          `${dateToBRLocal(event.date)}${event.endDate ? ` a ${dateToBRLocal(event.endDate)}` : ""}`;

        context.fillText(
          `${circledNumber(event.number)} ${date} • ${event.title}`,
          boxX + 16,
          y + 24 + index * eventLineHeight
        );
      });
    }

    const footerY = height - footerHeight;
    context.fillStyle = NEXUS_BLUE;
    context.fillRect(0, footerY, width, footerHeight);

    context.fillStyle = "#ffffff";
    context.font = "900 13px Arial, sans-serif";
    context.fillText(
      "Fonte: Radar Canarinho | Nexus Pesquisa e Inteligência de Dados",
      padding,
      footerY + 28
    );

    context.font = "400 12px Arial, sans-serif";
    context.fillText(
      "Acompanhe mais análises em: https://radar-canarinho.vercel.app/",
      padding,
      footerY + 50
    );

    const link = document.createElement("a");
    link.download = filename;
    link.href = canvas.toDataURL("image/png");
    link.click();

    URL.revokeObjectURL(svgUrl);
  });
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
          <Bar dataKey="seguidores" fill={NEXUS_GREEN} radius={[0, 10, 10, 0]} />
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
          <Scatter data={data} fill={NEXUS_GREEN} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TimelineChart({
  rows,
  selected,
  events = [],
  mode = "total",
  startDate,
  endDate,
}: {
  rows: InstagramSnapshot[];
  selected: string[];
  events?: TimelineEvent[];
  mode?: TimelineMode;
  startDate?: string;
  endDate?: string;
}) {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<ReturnType<typeof buildEventMarkers>[number] | null>(null);

  const source =
    mode === "growth"
      ? buildAccumulatedGrowthData(rows, selected, startDate, endDate)
      : buildFollowerData(rows, selected, startDate, endDate);

  const { names, data } = source;
  const domain = getYAxisDomain(data, names, mode === "growth");
  const firstName = names[0];
  const eventMarkers = buildEventMarkers(data, events, firstName);
  const insights = buildTimelineInsights(data, names);
  const title =
    mode === "growth"
      ? "Crescimento acumulado de seguidores"
      : "Evolução diária de seguidores";
  const subtitle =
    mode === "growth"
      ? "Ganho acumulado de seguidores desde a primeira data do período selecionado."
      : "Total de seguidores em cada data de coleta.";
   const singlePlayerName = names.length === 1 ? names[0] : undefined;
  const totalGrowthForHeader =
    singlePlayerName && data.length
      ? Number(data[data.length - 1]?.[singlePlayerName] ?? 0) -
        Number(data[0]?.[singlePlayerName] ?? 0)
      : undefined;

  const downloadFilename = singlePlayerName
    ? `${normalizeKey(singlePlayerName)}-linha-do-tempo-radar-canarinho.png`
    : "radar-canarinho-linha-do-tempo.png";

  return (
    <div ref={chartRef} className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          {singlePlayerName && (
            <div className="mb-2">
              <div className="font-display text-4xl text-brasil-azul">
                {singlePlayerName}
              </div>
              {typeof totalGrowthForHeader === "number" && (
                <div className="mt-1 font-black text-brasil-verde">
                  +{formatFull(totalGrowthForHeader)} seguidores no período
                </div>
              )}
              <div className="mt-1 text-sm text-brasil-suave">
                Desde a convocação da Seleção Brasileira
              </div>
            </div>
          )}

          <h3 className="font-black text-brasil-azul">{title}</h3>
          <p className="mt-1 text-sm text-brasil-suave">{subtitle}</p>
        </div>

        <button
          type="button"
          onClick={() =>
            downloadSvgAsPng({
              container: chartRef.current,
              filename: downloadFilename,
              title,
              subtitle,
              events: eventMarkers,
              playerName: singlePlayerName,
              totalGrowth: totalGrowthForHeader,
            })
          }
          className="rounded-2xl bg-brasil-azul px-4 py-2 text-sm font-black text-white transition hover:bg-brasil-azulEscuro"
        >
          Baixar gráfico
        </button>
      </div>

      <div className="relative h-[520px]">
        {hoveredEvent && (
          <div className="pointer-events-none absolute right-4 top-4 z-10 max-w-xs rounded-2xl border border-brasil-verde bg-white p-4 text-sm shadow-lg">
            <div className="font-black text-brasil-verde">
              {circledNumber(hoveredEvent.number)} {hoveredEvent.title}
            </div>
            <div className="mt-1 text-xs font-bold uppercase text-brasil-suave">
              {dateToBRLocal(hoveredEvent.date)}
              {hoveredEvent.endDate ? ` a ${dateToBRLocal(hoveredEvent.endDate)}` : ""} · {hoveredEvent.type}
            </div>
            <p className="mt-2 leading-5 text-slate-700">{hoveredEvent.description}</p>
            <div className="mt-2 text-xs font-black text-brasil-azul">
              Impacto esperado: {hoveredEvent.impact}
            </div>
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: 78, right: 30, top: 20, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="data" />
            <YAxis
              tickFormatter={formatCompact}
              domain={domain}
              width={70}
              allowDataOverflow={mode === "growth"}
            />
            <Tooltip formatter={(v: any) => formatFull(Number(v))} />
            <Legend />

            {eventMarkers.map((event) => (
              <ReferenceLine
                key={`line-${event.number}-${event.chartDate}`}
                x={event.chartDate}
                stroke="#e0e1e3"
                strokeDasharray="4 4"
              />
            ))}

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

            {eventMarkers.map((event) => (
              <ReferenceDot
                key={`dot-${event.number}-${event.chartDate}`}
                x={event.chartDate}
                y={event.y}
                r={14}
                fill={NEXUS_GREEN}
                stroke="#ffffff"
                strokeWidth={2}
                onMouseEnter={() => setHoveredEvent(event)}
                onMouseLeave={() => setHoveredEvent(null)}
                label={{
                  value: String(event.number),
                  fill: "#ffffff",
                  fontSize: 12,
                  fontWeight: 900,
                  position: "center",
                }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {(insights.topDaily || insights.topTotal) && (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {insights.topDaily && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="text-xs font-black uppercase text-brasil-suave">
                Maior ganho entre coletas
              </div>
              <div className="mt-1 font-black text-brasil-azul">
                {insights.topDaily.name}
              </div>
              <div className="mt-1 text-sm text-slate-700">
                +{formatFull(insights.topDaily.growth)} seguidores em{" "}
                {dateToBRLocal(insights.topDaily.date)}.
              </div>
            </div>
          )}

          {insights.topTotal && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="text-xs font-black uppercase text-brasil-suave">
                Maior ganho acumulado
              </div>
              <div className="mt-1 font-black text-brasil-azul">
                {insights.topTotal.name}
              </div>
              <div className="mt-1 text-sm text-slate-700">
                +{formatFull(insights.topTotal.growth)} seguidores no período exibido.
              </div>
            </div>
          )}
        </div>
      )}

      {eventMarkers.length > 0 && (
        <div className="mt-4 rounded-2xl border border-brasil-verde bg-green-50 p-4 text-sm font-bold text-brasil-azul">
          <div className="mb-2 font-black">Eventos que podem ter influenciado o crescimento</div>

          <div className="grid gap-1">
            {eventMarkers.map((event) => (
              <div key={`${event.number}-${event.date}`}>
                {circledNumber(event.number)} {dateToBRLocal(event.date)}
                {event.endDate ? ` a ${dateToBRLocal(event.endDate)}` : ""} •{" "}
                {event.title}
              </div>
            ))}
          </div>
        </div>
      )}
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
