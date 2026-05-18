import { DashboardTabs } from "@/components/DashboardTabs";
import { fetchEditorialSheet, fetchInstagramSheet } from "@/lib/sheets";
import { formatCompact, latestByPlayer } from "@/lib/metrics";

export const revalidate = 60 * 15;

export default async function HomePage() {
  const rows = await fetchInstagramSheet();
  const editorialRows = await fetchEditorialSheet();
  const players = latestByPlayer(rows, 7, editorialRows);
  const total = players.reduce((acc, p) => acc + p.seguidores, 0);
  const leader = players[0];
  const latestDate = rows.sort((a, b) => b.dataColeta.localeCompare(a.dataColeta))[0]?.dataColeta;

  return (
    <main>
      <section className="relative overflow-hidden bg-gradient-to-br from-brasil-azulEscuro via-brasil-azul to-brasil-campo text-white">
        <div className="absolute inset-0 opacity-20 [background:repeating-linear-gradient(45deg,rgba(255,223,0,.25)_0,rgba(255,223,0,.25)_2px,transparent_2px,transparent_28px)]" />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-6 py-12 md:flex-row md:items-end md:justify-between">
          <div><h1 className="font-display text-7xl leading-none tracking-wider text-brasil-amarelo drop-shadow md:text-8xl">RADAR<br />CANARINHO</h1><p className="mt-3 max-w-xl text-sm font-medium text-white/85 md:text-base">Inteligência digital da Seleção Brasileira · Instagram · Copa do Mundo 2026</p><div className="mt-5 flex flex-wrap gap-2"><span className="rounded-full bg-brasil-amarelo px-4 py-2 text-xs font-black uppercase tracking-wider text-brasil-azulEscuro">{players.length} perfis monitorados</span><span className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-white">Atualização diária 06h</span></div></div>
          <div className="grid grid-cols-2 gap-5 text-right md:grid-cols-3"><div><div className="font-display text-4xl text-brasil-amarelo">{formatCompact(total)}</div><div className="text-xs uppercase tracking-wider text-white/60">seguidores</div></div><div><div className="font-display text-4xl text-brasil-amarelo">{leader?.nome ?? "-"}</div><div className="text-xs uppercase tracking-wider text-white/60">líder</div></div><div><div className="font-display text-4xl text-brasil-amarelo">IG</div><div className="text-xs uppercase tracking-wider text-white/60">fonte</div></div></div>
        </div>
      </section>
      <div className="mx-auto max-w-7xl px-5 py-8"><DashboardTabs rows={rows} initialPlayers={players} latestDate={latestDate} /></div>
    </main>
  )
}
