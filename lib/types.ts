export type InstagramSnapshot = {
  dataColeta: string;
  nome: string;
  username: string;
  seguidores: number;
};

export type EditorialPlayer = {
  username: string;
  name: string;
  posicao: string;
  grupoPosicao: string;
  clube: string;
  statusConvocacao: string;
  fotoUrl: string;
  escudoUrl: string;
  observacaoEditorial: string;
};

export type PlayerSummary = InstagramSnapshot & {
  crescimento1d: number;
  crescimento3d: number;
  crescimento5d: number;
  crescimento7d: number;
  crescimento10d: number;
  crescimento15d: number;
  crescimento30d: number;
  crescimentoPeriodo: number;
  crescimentoPercentualPeriodo: number;
  posicaoRanking: number;
  grupoPosicao: string;
  clube: string;
  posicao: string;
  statusConvocacao: string;
  fotoUrl: string;
  escudoUrl: string;
  observacaoEditorial: string;
};

export type Match = {
  utcDate?: string;
  status?: string;
  stage?: string;
  group?: string;
  venue?: string;
  homeTeam?: { name?: string; tla?: string };
  awayTeam?: { name?: string; tla?: string };
  score?: any;
};