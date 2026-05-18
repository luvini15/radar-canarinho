import type { PlayerSummary } from "@/lib/types";
import { formatCompact, initials } from "@/lib/metrics";

export function PlayerCard({
  player,
  compact = false,
}: {
  player: PlayerSummary;
  compact?: boolean;
}) {
  const foto = player.fotoUrl || "";
  const escudo = player.escudoUrl || "";
  const clube = player.clube || "Clube não informado";
  const posicao = player.grupoPosicao || player.posicao || "Instagram";

  return (
    <article className="sticker-card relative overflow-hidden rounded-3xl p-4 shadow-md transition hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-start justify-between">
        <div>
          <span className="block text-xs font-black uppercase tracking-wider text-brasil-azul">
            Instagram
          </span>
          <span className="block text-xs font-bold text-slate-600">{posicao}</span>
        </div>

        <span className="rounded-full bg-brasil-azul px-3 py-1 text-xs font-black text-brasil-amarelo">
          #{player.posicaoRanking}
        </span>
      </div>

      <div className="mx-auto mt-3 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-brasil-azul bg-brasil-azul font-display text-2xl text-brasil-amarelo">
        {foto ? (
          <img src={foto} alt={player.nome} className="h-full w-full object-cover" />
        ) : (
          initials(player.nome)
        )}
      </div>

      <h3 className="mt-3 min-h-10 text-center font-black leading-tight text-brasil-azul">
        {player.nome}
      </h3>

      <p className="text-center text-xs font-semibold text-slate-600">
        @{player.username}
      </p>

      {!compact && (
        <div className="mt-2 flex items-center justify-center gap-2 text-center text-xs font-bold text-slate-700">
          {escudo ? (
            <img src={escudo} alt={clube} className="h-5 w-5 object-contain" />
          ) : (
            <span className="h-5 w-5 rounded-full bg-brasil-azul text-[9px] leading-5 text-white">
              CL
            </span>
          )}
          <span className="truncate">{clube}</span>
        </div>
      )}

      <div className="mt-4 rounded-2xl bg-white/60 p-3 text-center">
        <div className="font-display text-2xl text-brasil-azul">
          {formatCompact(player.seguidores)}
        </div>
        <div className="text-xs font-bold uppercase text-slate-600">
          seguidores
        </div>
      </div>
    </article>
  );
}