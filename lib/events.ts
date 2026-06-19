export type KeyEvent = {
  date: string;
  endDate?: string;
  title: string;
  type: "convocacao" | "jogo" | "mata-mata" | "evento";
  description: string;
  impact: "Alto" | "Médio" | "Baixo";
};

export const keyEvents: KeyEvent[] = [  
  {
    date: "2026-05-18",
    title: "Convocação oficial do Brasil",
    type: "convocacao",
    description: "Anúncio da lista final da Seleção Brasileira.",
    impact: "Alto",
  },

    {
    date: "2026-06-01",
    title: "Final da Champions League",
    type: "evento",
    description: "Evento externo com potencial impacto nos jogadores em destaque.",
    impact: "Médio",
  },

  {
    date: "2026-06-13",
    title: "Brasil x Marrocos",
    type: "jogo",
    description: "Primeiro jogo do Brasil na fase de grupos.",
    impact: "Alto",
  },
  {
    date: "2026-06-19",
    title: "Brasil x Haiti",
    type: "jogo",
    description: "Segundo jogo do Brasil na fase de grupos.",
    impact: "Alto",
  },
  {
    date: "2026-06-24",
    title: "Escócia x Brasil",
    type: "jogo",
    description: "Terceiro jogo do Brasil na fase de grupos.",
    impact: "Alto",
  },
  {
    date: "2026-06-28",
    endDate: "2026-07-03",
    title: "16 avos da Copa",
    type: "mata-mata",
    description: "Início da fase eliminatória da Copa do Mundo.",
    impact: "Alto",
  },
  {
    date: "2026-07-04",
    endDate: "2026-07-07",
    title: "Oitavas de final",
    type: "mata-mata",
    description: "Jogos das oitavas de final da Copa do Mundo.",
    impact: "Alto",
  },
  {
    date: "2026-07-09",
    endDate: "2026-07-11",
    title: "Quartas de final",
    type: "mata-mata",
    description: "Jogos das quartas de final da Copa do Mundo.",
    impact: "Alto",
  },
  {
    date: "2026-07-14",
    endDate: "2026-07-15",
    title: "Semifinais",
    type: "mata-mata",
    description: "Jogos das semifinais da Copa do Mundo.",
    impact: "Alto",
  },
  {
    date: "2026-07-18",
    title: "Disputa de terceiro lugar",
    type: "mata-mata",
    description: "Jogo de terceiro lugar da Copa do Mundo.",
    impact: "Médio",
  },
  {
    date: "2026-07-19",
    title: "Final da Copa do Mundo",
    type: "mata-mata",
    description: "Final da Copa do Mundo 2026.",
    impact: "Alto",
  },
];

export function getEventsBetweenDates(startDate: string, endDate: string) {
  return keyEvents.filter((event) => {
    const eventStart = event.date;
    const eventEnd = event.endDate ?? event.date;

    return eventStart <= endDate && eventEnd >= startDate;
  });
}