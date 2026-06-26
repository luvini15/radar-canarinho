"use client";

import { useMemo, useState } from "react";
import {
  ClipboardList,
  Map,
  RefreshCw,
  Search,
  Shield,
  Star,
  Thermometer,
  TrendingUp,
  Users,
} from "lucide-react";
import type { InstagramSnapshot, PlayerSummary } from "@/lib/types";
import {
  formatCompact,
  formatFull,
  getGrowthBetweenDates,
} from "@/lib/metrics";
import { getEventsBetweenDates } from "@/lib/events";
import { PlayerCard } from "./PlayerCard";
import { RankingTable } from "./RankingTable";
import {
  AccumulatedGrowthChart,
  DailyGrowthChart,
  PositionMap,
  TimelineChart,
  TopFollowersChart,
} from "./Charts";

const tabs = [
  { id: "resumo", label: "Resumo", icon: Star },
  { id: "jogadores", label: "Jogadores", icon: Users },
  { id: "ranking", label: "Ranking", icon: ClipboardList },
  { id: "escalacao", label: "Escalação", icon: Shield },
  { id: "comparador", label: "Comparador", icon: Search },
  { id: "mapa", label: "Mapa digital", icon: Map },
  { id: "timeline", label: "Linha do tempo", icon: TrendingUp },
  { id: "termometro", label: "Termômetro", icon: Thermometer },
] as const;

type TabId = (typeof tabs)[number]["id"];


function dateToBR(date?: string) {
  if (!date) return "";
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}



function periodLabel(startDate?: string, endDate?: string) {
  if (startDate && endDate) return `${dateToBR(startDate)} a ${dateToBR(endDate)}`;
  return "período personalizado";
}

function growthPercent(player?: PlayerSummary): string {
  if (!player) return "0,00%";
  return `${(player.crescimentoPercentualPeriodo ?? 0).toFixed(2).replace(".", ",")}%`;
}

function getPlayerGrowth(player?: PlayerSummary) {
  return player?.crescimentoPeriodo ?? 0;
}

export function DashboardTabs({
  rows,
  initialPlayers,
  latestDate,
}: {
  rows: InstagramSnapshot[];
  initialPlayers: PlayerSummary[];
  latestDate?: string;
}) {
  const [active, setActive] = useState<TabId>("resumo");
  const [query, setQuery] = useState("");
  const [pos, setPos] = useState("Todas");
  const [timelineMode, setTimelineMode] = useState<"total" | "growth">("total");
  const [customStartDate, setCustomStartDate] = useState(latestDate ?? "");
  const [customEndDate, setCustomEndDate] = useState(latestDate ?? "");
  const [order, setOrder] = useState("seguidores");
  const [selected, setSelected] = useState<string[]>([]);
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showEvents, setShowEvents] = useState(false);

  const effectiveStartDate = customStartDate;
  const effectiveEndDate = customEndDate;

  const labelPeriodo = periodLabel(effectiveStartDate, effectiveEndDate);

  const selectedEvents =
    effectiveStartDate && effectiveEndDate
      ? getEventsBetweenDates(effectiveStartDate, effectiveEndDate)
      : [];

  const players = useMemo(() => {
    return initialPlayers.map((p) => {
      const customGrowth = getGrowthBetweenDates(
        rows,
        p.username,
        customStartDate,
        customEndDate
      );

      return {
        ...p,
        crescimento7d: customGrowth.growth,
        crescimentoPeriodo: customGrowth.growth,
        crescimentoPercentualPeriodo: customGrowth.percent,
      };
    });
  }, [initialPlayers, rows, customStartDate, customEndDate]);

  const names = players.map((p) => p.nome);
  const pA = players.find((p) => p.nome === (a || names[0])) ?? players[0];
  const pB = players.find((p) => p.nome === (b || names[1])) ?? players[1] ?? players[0];

  const filtered = players
    .filter((p) => pos === "Todas" || p.grupoPosicao === pos)
    .filter((p) => !query || p.nome.toLowerCase().includes(query.toLowerCase()))
    .sort((x, y) =>
      order === "crescimento"
        ? getPlayerGrowth(y) - getPlayerGrowth(x)
        : y.seguidores - x.seguidores
    );

  const leader = players[0];
  const second = players[1];
  const total = players.reduce((acc, p) => acc + p.seguidores, 0);
  const topGrowth = [...players].sort((x, y) => getPlayerGrowth(y) - getPlayerGrowth(x))[0];
  const top10sum = players.slice(0, 10).reduce((acc, p) => acc + p.seguidores, 0);
  const top10pct = total ? (top10sum / total) * 100 : 0;

  async function refreshData() {
    setRefreshing(true);
    try {
      await fetch("/api/refresh", { method: "POST" });
      window.location.reload();
    } finally {
      setRefreshing(false);
    }
  }

  const periodSelectorProps = {
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
  };

  return (
    <div>
      <div className="sticky top-0 z-20 bg-brasil-fundo/90 py-4 backdrop-blur">
        <div className="flex flex-col gap-3 rounded-3xl bg-white p-2 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const selectedTab = active === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActive(tab.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition ${
                    selectedTab
                      ? "bg-brasil-verde text-white shadow"
                      : "text-slate-500 hover:bg-slate-50 hover:text-brasil-azul"
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <button
            onClick={refreshData}
            disabled={refreshing}
            className="flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-brasil-azul px-4 py-3 text-sm font-black text-white transition hover:bg-brasil-azulEscuro disabled:opacity-60"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Atualizando..." : "Atualizar dados"}
          </button>
        </div>
      </div>


      {selectedEvents.length > 0 && (
        <div className="mb-6 rounded-3xl bg-white p-5 shadow-sm">
          <button
            onClick={() => setShowEvents((v) => !v)}
            className="flex w-full items-center justify-between font-black text-brasil-azul"
          >
            <span>Eventos-chave no período</span>
            <span>{showEvents ? "Fechar" : "Abrir"}</span>
          </button>

          {showEvents && (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {selectedEvents.map((event) => (
                <div
                  key={`${event.date}-${event.title}`}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="text-xs font-black uppercase text-brasil-verde">
                    {dateToBR(event.date)}
                    {event.endDate ? ` a ${dateToBR(event.endDate)}` : ""} · {event.type}
                  </div>

                  <div className="mt-1 font-black text-brasil-azul">
                    {event.title}
                  </div>

                  <div className="mt-1 text-sm text-slate-600">
                    {event.description}
                  </div>

                  <div className="mt-2 text-xs font-bold text-brasil-suave">
                    Impacto esperado: {event.impact}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {active === "resumo" && (
        <section className="space-y-8">
          <SourceCard latestDate={latestDate} />

          <div className="grid gap-4 md:grid-cols-4">
            <HeroKpi
              title="Líder absoluto"
              value={leader?.nome ?? "-"}
              sub={`@${leader?.username ?? ""}`}
              detail={`${formatCompact(leader?.seguidores ?? 0)} seguidores`}
            />
            <HeroKpi
              title={`Maior crescimento (${labelPeriodo})`}
              value={topGrowth?.nome ?? "-"}
              sub={`+${formatCompact(getPlayerGrowth(topGrowth))} seguidores`}
              detail={`${growthPercent(topGrowth)} no período`}
            />
            <HeroKpi
              title="Total da Seleção"
              value={formatCompact(total)}
              sub={`seguidores somados · ${players.length} atletas`}
              detail={`Top 10 concentra ${top10pct.toFixed(1)}%`}
            />
            <HeroKpi
              title="2º colocado"
              value={second?.nome ?? "-"}
              sub={`@${second?.username ?? ""}`}
              detail={`${formatCompact(second?.seguidores ?? 0)}`}
            />
          </div>

          <h2 className="section-title">Narrativas automáticas</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <Insight
              title="Domínio digital"
              text={`${leader?.nome} lidera com ${formatFull(
                leader?.seguidores ?? 0
              )} seguidores — uma concentração relevante dentro da convocação.`}
            />
            <Insight
              title={`Crescimento no período`}
              text={`${topGrowth?.nome} foi o maior destaque em ${labelPeriodo}, com +${formatFull(
                getPlayerGrowth(topGrowth)
              )} seguidores, equivalente a ${growthPercent(topGrowth)}.`}
            />
            <Insight
              title="Concentração no topo"
              text={`Os 10 maiores perfis concentram ${top10pct.toFixed(
                1
              )}% da audiência monitorada.`}
            />
            <Insight
              title="Grandes bases"
              text={`${
                players.filter((p) => p.seguidores > 10_000_000).length
              } jogadores ultrapassam 10 milhões de seguidores no Instagram.`}
            />
          </div>

          <h2 className="section-title">Top 5 — maior presença digital</h2>
          <TopBars players={players.slice(0, 5)} />
          <TopFollowersChart players={players} />
        </section>
      )}

      {active === "jogadores" && (
        <FilteredSection
          title="Jogadores"
          query={query}
          setQuery={setQuery}
          pos={pos}
          setPos={setPos}
          order={order}
          setOrder={setOrder}
          {...periodSelectorProps}
        >
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
            {filtered.map((p) => (
              <PlayerCard key={p.username} player={p} />
            ))}
          </div>
        </FilteredSection>
      )}

      {active === "ranking" && (
        <FilteredSection
          title="Ranking Instagram"
          query={query}
          setQuery={setQuery}
          pos={pos}
          setPos={setPos}
          order={order}
          setOrder={setOrder}
          {...periodSelectorProps}
        >
          <div className="mt-5">
            <RankingTable players={filtered} />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Insight
              title="Maior crescimento"
              text={`${topGrowth?.nome} lidera o crescimento em ${labelPeriodo}, com +${formatFull(
                getPlayerGrowth(topGrowth)
              )} seguidores.`}
            />
            <Insight
              title="Leitura do ranking"
              text={
                order === "crescimento"
                  ? "O ranking está ordenado pelo maior crescimento no período selecionado."
                  : "O ranking está ordenado pela maior base total de seguidores."
              }
            />
          </div>
        </FilteredSection>
      )}

      {active === "escalacao" && (
        <section>
          <h2 className="section-title">Escalação digital 4-3-3</h2>

          <div className="mt-5 flex flex-wrap gap-3">
            <select
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              className="rounded-xl border p-3 font-bold"
            >
              <option value="seguidores">Mais seguidores</option>
              <option value="crescimento">Maior crescimento</option>
            </select>

            <PeriodSelector {...periodSelectorProps} />
          </div>

          <Lineup players={players} order={order} />
        </section>
      )}

      {active === "comparador" && (
        <section>
          <h2 className="section-title">Comparador</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-start">
            <Select names={names} value={a || names[0]} setValue={setA} />
            <div className="self-center text-center font-display text-5xl text-slate-400">
              VS
            </div>
            <Select names={names} value={b || names[1]} setValue={setB} />
          </div>

          <div className="mt-5">
            <PeriodSelector {...periodSelectorProps} />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Compare player={pA} yellow={false} />
            <Compare player={pB} yellow />
          </div>

          <div className="mt-8">
            <TimelineChart
              rows={rows}
              selected={[pA?.nome, pB?.nome].filter(Boolean) as string[]}
              events={selectedEvents}
              startDate={effectiveStartDate}
              endDate={effectiveEndDate}
            />
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <DailyGrowthChart
              rows={rows}
              selected={[pA?.nome, pB?.nome].filter(Boolean) as string[]}
            />

            <AccumulatedGrowthChart
              rows={rows}
              selected={[pA?.nome, pB?.nome].filter(Boolean) as string[]}
            />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Insight
              title="Diferença de base"
              text={`${pA?.nome} tem ${formatFull(
                Math.abs((pA?.seguidores ?? 0) - (pB?.seguidores ?? 0))
              )} seguidores de diferença em relação a ${pB?.nome}.`}
            />

            <Insight
              title={`Diferença de crescimento`}
              text={`A diferença de crescimento entre os dois em ${labelPeriodo} é de ${formatFull(
                Math.abs(getPlayerGrowth(pA) - getPlayerGrowth(pB))
              )} seguidores.`}
            />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <Insight
              title="Diferença de base"
              text={`${pA?.nome} tem ${formatCompact(
                pA?.seguidores ?? 0
              )} seguidores contra ${formatCompact(pB?.seguidores ?? 0)} de ${pB?.nome}.`}
            />
            <Insight
              title={`Crescimento no período`}
              text={`${pA?.nome}: +${formatFull(
                getPlayerGrowth(pA)
              )}. ${pB?.nome}: +${formatFull(getPlayerGrowth(pB))}.`}
            />
            <Insight
              title="Momentum"
              text={`No período selecionado, ${
                getPlayerGrowth(pA) >= getPlayerGrowth(pB) ? pA?.nome : pB?.nome
              } apresenta maior crescimento.`}
            />
          </div>
        </section>
      )}

      {active === "mapa" && (
        <section>
          <h2 className="section-title">Mapa de posicionamento digital</h2>
          <div className="mt-5">
            <PositionMap players={players} />
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Insight
              title="Insight do mapa"
              text="Quanto mais à esquerda, melhor a posição no ranking. Quanto mais alto, maior a base de seguidores. Pontos isolados no alto indicam concentração de audiência."
            />
            <Insight
              title="Destaque de crescimento"
              text={`${topGrowth?.nome} se destaca em ${labelPeriodo}, com +${formatFull(
                getPlayerGrowth(topGrowth)
              )} seguidores.`}
            />
          </div>
        </section>
      )}

      {active === "timeline" && (
        <section>
          <h2 className="section-title">Linha do tempo</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-5">
            <input
              className="rounded-xl border p-3"
              placeholder="Pesquisar jogador para adicionar"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            <select
              value={pos}
              onChange={(e) => setPos(e.target.value)}
              className="rounded-xl border p-3"
            >
              <option>Todas</option>
              <option>Goleiro</option>
              <option>Defesa</option>
              <option>Meio-campo</option>
              <option>Ataque</option>
            </select>

            <select
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              className="rounded-xl border p-3"
            >
              <option value="seguidores">Mais seguidores</option>
              <option value="crescimento">Maior crescimento</option>
            </select>

            <select
              value={timelineMode}
              onChange={(e) => setTimelineMode(e.target.value as "total" | "growth")}
              className="rounded-xl border p-3"
            >
              <option value="total">Seguidores totais</option>
              <option value="growth">Ganho acumulado</option>
            </select>

            <PeriodSelector {...periodSelectorProps} />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {filtered.slice(0, 16).map((p) => (
              <button
                key={p.username}
                onClick={() =>
                  setSelected((s) =>
                    s.includes(p.nome)
                      ? s.filter((x) => x !== p.nome)
                      : [...s, p.nome]
                  )
                }
                className={`rounded-full px-3 py-2 text-xs font-bold ${
                  selected.includes(p.nome)
                    ? "bg-brasil-verde text-white"
                    : "bg-white text-brasil-azul"
                }`}
              >
                {p.nome}
              </button>
            ))}
          </div>

          <div className="mt-5">
            <TimelineChart
              rows={rows}
              selected={selected}
              events={selectedEvents}
              mode={timelineMode}
              startDate={effectiveStartDate}
              endDate={effectiveEndDate}
            />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Insight
              title="Leitura da linha do tempo"
              text="Use os botões acima para comparar a evolução diária dos jogadores selecionados."
            />
            <Insight
              title="Destaque do período"
              text={`${topGrowth?.nome} é o maior crescimento em ${labelPeriodo}, com +${formatFull(
                getPlayerGrowth(topGrowth)
              )} seguidores.`}
            />
          </div>
        </section>
      )}

      {active === "termometro" && (
        <ThermometerSection
          players={players}
          customStartDate={customStartDate}
          setCustomStartDate={setCustomStartDate}
          customEndDate={customEndDate}
          setCustomEndDate={setCustomEndDate}
        />
      )}
    </div>
  );
}

type PeriodSelectorProps = {
  customStartDate: string;
  setCustomStartDate: (v: string) => void;
  customEndDate: string;
  setCustomEndDate: (v: string) => void;
};

function PeriodSelector({
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
}: PeriodSelectorProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <label className="flex flex-col gap-1 text-xs font-black uppercase text-brasil-suave">
        Data inicial
        <input
          type="date"
          value={customStartDate}
          onChange={(e) => setCustomStartDate(e.target.value)}
          className="rounded-xl border p-3 text-sm font-bold text-slate-700"
        />
      </label>

      <label className="flex flex-col gap-1 text-xs font-black uppercase text-brasil-suave">
        Data final
        <input
          type="date"
          value={customEndDate}
          onChange={(e) => setCustomEndDate(e.target.value)}
          className="rounded-xl border p-3 text-sm font-bold text-slate-700"
        />
      </label>
    </div>
  );
}

function SourceCard({ latestDate }: { latestDate?: string }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="font-black text-brasil-azul">Fonte: Google Sheets via Supermetrics</div>
      <p className="text-sm text-brasil-suave">
        Última coleta: {latestDate ?? "não encontrada"}.
      </p>
    </div>
  );
}

function HeroKpi({
  title,
  value,
  sub,
  detail,
}: {
  title: string;
  value: string;
  sub: string;
  detail: string;
}) {
  return (
    <div className="rounded-3xl border-t-4 border-t-brasil-verde bg-white p-6 shadow-sm">
      <div className="text-sm font-black uppercase tracking-wider text-brasil-suave">{title}</div>
      <div className="mt-2 font-display text-5xl text-brasil-azul">{value}</div>
      <div className="mt-2 text-brasil-suave">{sub}</div>
      <div className="mt-1 font-black text-brasil-verde">{detail}</div>
    </div>
  );
}

function Insight({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl border-l-4 border-l-brasil-verde bg-white p-6 shadow-sm">
      <h3 className="font-black text-brasil-azul">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-700">{text}</p>
    </div>
  );
}

function TopBars({ players }: { players: PlayerSummary[] }) {
  const max = players[0]?.seguidores || 1;

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      {players.map((p, i) => (
        <div key={p.username} className="mb-5 grid grid-cols-[50px_1fr_120px] items-center gap-4">
          <div className="font-display text-4xl text-brasil-amarelo">{i + 1}</div>
          <div>
            <div className="font-black text-brasil-azul">{p.nome}</div>
            <div className="mt-2 h-3 rounded-full bg-slate-100">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-brasil-verde to-brasil-amarelo"
                style={{ width: `${(p.seguidores / max) * 100}%` }}
              />
            </div>
            <div className="mt-1 text-xs font-bold text-brasil-verde">
              +{formatCompact(getPlayerGrowth(p))} · {growthPercent(p)}
            </div>
          </div>
          <div className="text-right font-display text-3xl text-brasil-azul">
            {formatCompact(p.seguidores)}
          </div>
        </div>
      ))}
    </div>
  );
}

function FilteredSection(props: any) {
  return (
    <section>
      <h2 className="section-title">{props.title}</h2>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <input
          className="rounded-xl border p-3"
          placeholder="Pesquisar por nome"
          value={props.query}
          onChange={(e: any) => props.setQuery(e.target.value)}
        />

        <select
          className="rounded-xl border p-3"
          value={props.pos}
          onChange={(e: any) => props.setPos(e.target.value)}
        >
          <option>Todas</option>
          <option>Goleiro</option>
          <option>Defesa</option>
          <option>Meio-campo</option>
          <option>Ataque</option>
        </select>

        <select
          className="rounded-xl border p-3"
          value={props.order}
          onChange={(e: any) => props.setOrder(e.target.value)}
        >
          <option value="seguidores">Mais seguidores</option>
          <option value="crescimento">Maior crescimento</option>
        </select>

        <PeriodSelector
          customStartDate={props.customStartDate}
          setCustomStartDate={props.setCustomStartDate}
          customEndDate={props.customEndDate}
          setCustomEndDate={props.setCustomEndDate}
        />
      </div>

      {props.children}
    </section>
  );
}

function Lineup({
  players,
  order,
}: {
  players: PlayerSummary[];
  order: string;
}) {
  const sort = (arr: PlayerSummary[]) =>
    [...arr].sort((a, b) =>
      order === "crescimento"
        ? getPlayerGrowth(b) - getPlayerGrowth(a)
        : b.seguidores - a.seguidores
    );

  const pick = (g: string, n: number) =>
    sort(players.filter((p) => p.grupoPosicao === g)).slice(0, n);

  const lines = [pick("Ataque", 3), pick("Meio-campo", 3), pick("Defesa", 4), pick("Goleiro", 1)];

  return (
    <div className="mt-5 rounded-[2rem] border-4 border-white/70 bg-gradient-to-b from-[#0d9440] via-[#0a7c37] to-[#0d9440] p-6 shadow-xl">
      <div className="grid gap-4">
        {lines.map((line, idx) => (
          <div key={idx} className="flex flex-wrap justify-center gap-4">
            {line.map((p) => (
              <div key={p.username} className="w-40">
                <PlayerCard player={p} compact />

                {order === "crescimento" && (
                  <div className="mt-2 rounded-full bg-green-100 px-3 py-2 text-center text-xs font-black text-green-700">
                    +{formatFull(getPlayerGrowth(p))} seguidores
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Select({
  names,
  value,
  setValue,
}: {
  names: string[];
  value: string;
  setValue: (v: string) => void;
}) {
  return (
    <select
      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-brasil-azul shadow-sm"
      value={value}
      onChange={(e) => setValue(e.target.value)}
    >
      {names.map((n) => (
        <option key={n} value={n}>
          {n}
        </option>
      ))}
    </select>
  );
}

function Compare({
  player,
  yellow = false,
}: {
  player?: PlayerSummary;
  yellow?: boolean;
}) {
  if (!player) return null;

  return (
    <div
      className={`rounded-3xl border-t-4 ${
        yellow ? "border-t-brasil-amarelo" : "border-t-brasil-verde"
      } bg-white p-6 shadow-sm`}
    >
      <h3 className="font-black text-brasil-azul">{player.nome}</h3>
      <p className="text-sm text-brasil-suave">@{player.username}</p>

      <div className="mt-4 font-display text-5xl text-brasil-azul">
        {formatCompact(player.seguidores)}
      </div>
      <p className="text-xs font-bold uppercase text-brasil-suave">
        seguidores totais
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="text-xs font-black uppercase text-slate-500">
            Crescimento
          </div>
          <div className="mt-1 font-display text-3xl text-brasil-verde">
            +{formatFull(getPlayerGrowth(player))}
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="text-xs font-black uppercase text-slate-500">
            Variação %
          </div>
          <div className="mt-1 font-display text-3xl text-brasil-azul">
            {growthPercent(player)}
          </div>
        </div>
      </div>
    </div>
  );
}

function ThermometerSection({
  players,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
}: {
  players: PlayerSummary[];
  customStartDate: string;
  setCustomStartDate: (v: string) => void;
  customEndDate: string;
  setCustomEndDate: (v: string) => void;
}) {
  const threshold = 50000;
  const high = players.filter((p) => getPlayerGrowth(p) > threshold);
  const mid = players.filter((p) => getPlayerGrowth(p) <= threshold && getPlayerGrowth(p) > 0);
  const low = players.filter((p) => getPlayerGrowth(p) <= 0);

  return (
    <section>
      <h2 className="section-title">Termômetro de crescimento</h2>

      <div className="mt-5">
        <PeriodSelector
          customStartDate={customStartDate}
          setCustomStartDate={setCustomStartDate}
          customEndDate={customEndDate}
          setCustomEndDate={setCustomEndDate}
        />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-4">
        <HeroKpi title="Em alta" value={String(high.length)} sub="crescimento forte" detail={`>${formatCompact(threshold)}`} />
        <HeroKpi title="Crescendo" value={String(mid.length)} sub="variação positiva" detail="monitorar" />
        <HeroKpi title="Estáveis" value={String(low.length)} sub="sem alta" detail="atenção" />
        <HeroKpi title="Total" value={String(players.length)} sub="atletas" detail="Instagram" />
      </div>

      <h3 className="section-title mt-8">Alertas de crescimento</h3>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {[...players]
          .sort((a, b) => getPlayerGrowth(b) - getPlayerGrowth(a))
          .slice(0, 8)
          .map((p) => (
            <div
              key={p.username}
              className="rounded-3xl border-l-4 border-l-brasil-verde bg-white p-5 shadow-sm"
            >
              <div className="font-black text-brasil-azul">{p.nome}</div>
              <div className="text-sm text-brasil-suave">
                @{p.username} · {formatCompact(p.seguidores)} seguidores
              </div>
              <span className="mt-2 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-700">
                +{formatCompact(getPlayerGrowth(p))} · {growthPercent(p)}
              </span>
            </div>
          ))}
      </div>
    </section>
  );
}
