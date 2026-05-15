export type InstagramSnapshot = {
  dataColeta:string;
  nome:string;
  username:string;
  seguidores:number;
};

export type PlayerSummary = InstagramSnapshot & {
  crescimento7d:number;
  crescimento15d:number;
  crescimento30d:number;
  posicaoRanking:number;
  grupoPosicao:string;
  clube:string;
};

export type PlayerMedia = {
  fotoUrl: string;
  clubeApi: string;
  escudoUrl: string;
  posicaoApi: string;
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
