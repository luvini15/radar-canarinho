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
import type { InstagramSnapshot, Match, PlayerSummary } from "@/lib/types";
import { formatCompact, formatFull, getGrowthByPeriod } from "@/lib/metrics";
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

const periodOptions = [
  { value: "1", label: "1 dia" },
  { value: "3", label: "3 dias" },
  { value: "5", label: "5 dias" },
  { value: "7", label: "7 dias" },
  { value: "10", label: "10 dias" },
  { value: "15", label: "15 dias" },
  { value: "30", label: "30 dias" },
];

function growthPercent(player?: PlayerSummary, period?: string): string {
  if (!player) return "0,00%";

  const growth = getGrowthByPeriod(player, period ?? "7");
  const previous = player.seguidores - growth;

  if (!previous || previous <= 0) return "0,00%";

  const percent = (growth / previous) * 100;

  return `${percent.toFixed(2).replace(".", ",")}%`;
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
  const [period, setPeriod] = useState("7");
  const [order, setOrder] = useState("seguidores");
  const [selected, setSelected] = useState<string[]>([]);
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);

  const players = useMemo(() => {
    return initialPlayers.map((p) => {
      const crescimentoPeriodo = getGrowthByPeriod(p, period);
      const baseAnterior = p.seguidores - crescimentoPeriodo;

      const crescimentoPercentualPeriodo =
        baseAnterior > 0 ? (crescimentoPeriodo / baseAnterior) * 100 : 0;

      return {
        ...p,
        crescimentoPeriodo,
        crescimentoPercentualPeriodo,
      };
    });
  }, [initialPlayers, period]);

  const names = players.map((p) => p.nome);
  const pA = players.find((p) => p.nome === (a || names[0])) ?? players[0];
  const pB = players.find((p) => p.nome === (b || names[1])) ?? players[1] ?? players[0];

  const filtered = players
    .filter((p) => pos === "Todas" || p.grupoPosicao === pos)
    .filter((p) => !query || p.nome.toLowerCase().includes(query.toLowerCase()))
    .sort((x, y) =>
      order === "crescimento"
        ? getGrowthByPeriod(y, period) - getGrowthByPeriod(x, period)
        : y.seguidores - x.seguidores
    );

  const leader = players[0];
  const second = players[1];
  const total = players.reduce((acc, p) => acc + p.seguidores, 0);
  const topGrowth = [...players].sort(
    (x, y) => getGrowthByPeriod(y, period) - getGrowthByPeriod(x, period)
  )[0];
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
                  onClick={() => {
                    setActive(tab.id);
                  }}
                  className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition ${selectedTab
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
              title={`Maior crescimento (${period}d)`}
              value={topGrowth?.nome ?? "-"}
              sub={`+${formatCompact(getGrowthByPeriod(topGrowth, period))} seguidores`}
              detail={`${growthPercent(topGrowth, period)} no período`}
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
              )} seguidores — uma concentração relevante dentro da pré-lista.`}
            />
            <Insight
              title={`Crescimento em ${period} dias`}
              text={`${topGrowth?.nome} foi o maior destaque do período, com +${formatFull(
                getGrowthByPeriod(topGrowth, period)
              )} seguidores, equivalente a ${growthPercent(topGrowth, period)}.`}
            />
            <Insight
              title="Concentração no topo"
              text={`Os 10 maiores perfis concentram ${top10pct.toFixed(
                1
              )}% da audiência monitorada.`}
            />
            <Insight
              title="Grandes bases"
              text={`${players.filter((p) => p.seguidores > 10_000_000).length
                } jogadores ultrapassam 10 milhões de seguidores no Instagram.`}
            />
          </div>

          <h2 className="section-title">Top 5 — maior presença digital</h2>
          <TopBars players={players.slice(0, 5)} period={period} />
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
          period={period}
          setPeriod={setPeriod}
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
          period={period}
          setPeriod={setPeriod}
        >
          <div className="mt-5">
            <RankingTable players={filtered} />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Insight
              title="Maior crescimento"
              text={`${topGrowth?.nome} lidera o crescimento em ${period} dias, com +${formatFull(
                getGrowthByPeriod(topGrowth, period)
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

            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="rounded-xl border p-3 font-bold"
            >
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <Lineup players={players} order={order} period={period} />
        </section>
      )}

      {active === "comparador" && (
        <section>
          <h2 className="section-title">Comparador</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-start">
            <Select names={names} value={a || names[0]} setValue={setA} />
            <div className="self-center text-center font-display text-5xl text-slate-400">VS</div>
            <Select names={names} value={b || names[1]} setValue={setB} />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Compare player={pA} period={period} />
            <Compare player={pB} period={period} yellow />
          </div>

          <div className="mt-8">
            <TimelineChart
              rows={rows}
              selected={[pA?.nome, pB?.nome].filter(Boolean) as string[]}
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
              title={`Diferença de crescimento em ${period} dias`}
              text={`A diferença de crescimento entre os dois é de ${formatFull(
                Math.abs(getGrowthByPeriod(pA, period) - getGrowthByPeriod(pB, period))
              )} seguidores no período.`}
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
              title={`Crescimento em ${period} dias`}
              text={`${pA?.nome}: +${formatFull(
                getGrowthByPeriod(pA, period)
              )}. ${pB?.nome}: +${formatFull(getGrowthByPeriod(pB, period))}.`}
            />
            <Insight
              title="Momentum"
              text={`No período selecionado, ${getGrowthByPeriod(pA, period) >= getGrowthByPeriod(pB, period)
                ? pA?.nome
                : pB?.nome
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
              text={`${topGrowth?.nome} se destaca no recorte de crescimento de ${period} dias, com +${formatFull(
                getGrowthByPeriod(topGrowth, period)
              )} seguidores.`}
            />
          </div>
        </section>
      )}

      {active === "timeline" && (
        <section>
          <h2 className="section-title">Linha do tempo</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
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
          </div>

          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-xl border p-3"
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="mt-3 flex flex-wrap gap-2">
            {filtered.slice(0, 16).map((p) => (
              <button
                key={p.username}
                onClick={() =>
                  setSelected((s) =>
                    s.includes(p.nome) ? s.filter((x) => x !== p.nome) : [...s, p.nome]
                  )
                }
                className={`rounded-full px-3 py-2 text-xs font-bold ${selected.includes(p.nome)
                  ? "bg-brasil-verde text-white"
                  : "bg-white text-brasil-azul"
                  }`}
              >
                {p.nome}
              </button>
            ))}
          </div>

          <div className="mt-5">
            <TimelineChart rows={rows} selected={selected} />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Insight
              title="Leitura da linha do tempo"
              text="Use os botões acima para comparar a evolução diária dos jogadores selecionados."
            />
            <Insight
              title="Destaque do período"
              text={`${topGrowth?.nome} é o maior crescimento no período selecionado, com +${formatFull(
                getGrowthByPeriod(topGrowth, period)
              )} seguidores.`}
            />
          </div>
        </section>
      )}

      {active === "termometro" && (
        <ThermometerSection players={players} period={period} setPeriod={setPeriod} />
      )}

    </div>
  );
}

function SourceCard({ latestDate }: { latestDate?: string }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="font-black text-brasil-azul">Fonte: Google Sheets via Supermetrics</div>
      <p className="text-sm text-brasil-suave">Última coleta: {latestDate ?? "não encontrada"}.</p>
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

function TopBars({ players, period }: { players: PlayerSummary[]; period: string }) {
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
              +{formatCompact(getGrowthByPeriod(p, period))} · {growthPercent(p, period)}
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

        <select
          className="rounded-xl border p-3"
          value={props.period}
          onChange={(e: any) => props.setPeriod(e.target.value)}
        >
          {periodOptions.map((option) => (
            <option key={option.value} value={option.value}>
              Crescimento {option.label}
            </option>
          ))}
        </select>
      </div>

      {props.children}
    </section>
  );
}

function Lineup({
  players,
  order,
  period,
}: {
  players: PlayerSummary[];
  order: string;
  period: string;
}) {
  const sort = (arr: PlayerSummary[]) =>
    [...arr].sort((a, b) =>
      order === "crescimento"
        ? getGrowthByPeriod(b, period) - getGrowthByPeriod(a, period)
        : b.seguidores - a.seguidores
    );

  const pick = (g: string, n: number) =>
    sort(players.filter((p) => p.grupoPosicao === g)).slice(0, n);

  const lines = [
    pick("Ataque", 3),
    pick("Meio-campo", 3),
    pick("Defesa", 4),
    pick("Goleiro", 1),
  ];

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
                    +{formatFull(getGrowthByPeriod(p, period))} seguidores
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
  period,
  yellow = false,
}: {
  player?: PlayerSummary;
  period: string;
  yellow?: boolean;
}) {
  if (!player) return null;

  return (
    <div
      className={`rounded-3xl border-t-4 ${yellow ? "border-t-brasil-amarelo" : "border-t-brasil-verde"
        } bg-white p-6 shadow-sm`}
    >
      <h3 className="font-black text-brasil-azul">{player.nome}</h3>
      <p className="text-sm text-brasil-suave">@{player.username}</p>

      <div className="mt-4 font-display text-5xl text-brasil-azul">
        {formatCompact(player.seguidores)}
      </div>
      <p className="text-xs font-bold uppercase text-brasil-suave">seguidores totais</p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="text-xs font-black uppercase text-slate-500">
            Crescimento {period}d
          </div>
          <div className="mt-1 font-display text-3xl text-brasil-verde">
            +{formatFull(getGrowthByPeriod(player, period))}
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="text-xs font-black uppercase text-slate-500">
            Variação %
          </div>
          <div className="mt-1 font-display text-3xl text-brasil-azul">
            {growthPercent(player, period)}
          </div>
        </div>
      </div>
    </div>
  );
}

function ThermometerSection({
  players,
  period,
  setPeriod,
}: {
  players: PlayerSummary[];
  period: string;
  setPeriod: (v: string) => void;
}) {
  const thresholdByPeriod: Record<string, number> = {
    "1": 10000,
    "3": 20000,
    "5": 30000,
    "7": 50000,
    "10": 70000,
    "15": 100000,
    "30": 150000,
  };

  const threshold = thresholdByPeriod[period] ?? 50000;
  const high = players.filter(
    (p) => getGrowthByPeriod(p, period) > threshold
  );
  const mid = players.filter(
    (p) =>
      getGrowthByPeriod(p, period) <= threshold &&
      getGrowthByPeriod(p, period) > 0
  );
  const low = players.filter((p) => getGrowthByPeriod(p, period) <= 0);

  return (
    <section>
      <h2 className="section-title">Termômetro de crescimento</h2>

      <div className="mt-5">
        <select
          className="rounded-xl border p-3"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          {periodOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
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
          .sort((a, b) => getGrowthByPeriod(b, period) - getGrowthByPeriod(a, period))
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
                +{formatCompact(getGrowthByPeriod(p, period))} · {growthPercent(p, period)}
              </span>
            </div>
          ))}
      </div>
    </section>
  );
}

