import type { PlayerSummary } from "@/lib/types";
import { formatCompact, formatFull } from "@/lib/metrics";

function formatPercent(value: number) {
  return `${(value ?? 0).toFixed(2).replace(".", ",")}%`;
}

export function RankingTable({ players }: { players: PlayerSummary[] }) {
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
      <div className="grid grid-cols-[48px_1fr_140px_170px_120px] gap-3 bg-brasil-azulEscuro px-5 py-3 text-xs font-black uppercase tracking-wider text-white/60 max-md:grid-cols-[40px_1fr_100px]">
        <span>#</span>
        <span>Jogador</span>
        <span>Seguidores</span>
        <span className="max-md:hidden">Crescimento</span>
        <span className="max-md:hidden">Posição</span>
      </div>

      {players.map((p) => (
        <div
          key={p.username}
          className="grid grid-cols-[48px_1fr_140px_170px_120px] items-center gap-3 border-b border-slate-100 px-5 py-4 last:border-b-0 hover:bg-slate-50 max-md:grid-cols-[40px_1fr_100px]"
        >
          <span
            className={`font-display text-2xl ${p.posicaoRanking <= 3 ? "text-brasil-amarelo" : "text-slate-400"
              }`}
          >
            {p.posicaoRanking}
          </span>

          <div>
            <div className="font-bold text-brasil-azul">{p.nome}</div>
            <div className="text-xs text-brasil-suave">@{p.username}</div>
          </div>

          <div className="font-display text-2xl text-brasil-azul">
            {formatCompact(p.seguidores)}
          </div>

          <div className="max-md:hidden">
            <div className="font-black text-brasil-verde">
              +{formatFull(p.crescimentoPeriodo ?? 0)}
            </div>
            <div className="text-xs font-bold text-slate-500">
              {formatPercent(p.crescimentoPercentualPeriodo)}
            </div>
          </div>

          <div className="max-md:hidden text-sm text-brasil-suave">
            {p.grupoPosicao}
          </div>
        </div>
      ))}
    </div>
  );
}