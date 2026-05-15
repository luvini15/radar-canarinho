import { NextRequest, NextResponse } from "next/server";

const DEFAULT_KEY = "123";

function normalize(v:string){
  return v.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
}

async function searchTeamBadge(team:string, key:string) {
  if (!team) return "";
  const url = `https://www.thesportsdb.com/api/v1/json/${key}/searchteams.php?t=${encodeURIComponent(team)}`;
  const res = await fetch(url, { next:{ revalidate: 60*60*24*7 }});
  if (!res.ok) return "";
  const json = await res.json();
  const teams = json?.teams || [];
  if (!teams.length) return "";
  return teams[0]?.strBadge || teams[0]?.strLogo || "";
}

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name") || "";
  const key = process.env.THESPORTSDB_KEY || DEFAULT_KEY;

  if (!name) {
    return NextResponse.json({ fotoUrl:"", clubeApi:"", escudoUrl:"", posicaoApi:"" });
  }

  try {
    const url = `https://www.thesportsdb.com/api/v1/json/${key}/searchplayers.php?p=${encodeURIComponent(name)}`;
    const res = await fetch(url, { next:{ revalidate: 60*60*24*7 }});
    if (!res.ok) throw new Error("Erro TheSportsDB");

    const json = await res.json();
    const players = json?.player || [];

    const exact = players.find((p:any) => normalize(p?.strPlayer || "").includes(normalize(name).split(" ")[0])) || players[0];

    if (!exact) {
      return NextResponse.json({ fotoUrl:"", clubeApi:"", escudoUrl:"", posicaoApi:"" });
    }

    const clubeApi = exact?.strTeam || "";
    const escudoUrl = await searchTeamBadge(clubeApi, key);

    return NextResponse.json({
      fotoUrl: exact?.strCutout || exact?.strThumb || "",
      clubeApi,
      escudoUrl,
      posicaoApi: exact?.strPosition || ""
    });
  } catch {
    return NextResponse.json({ fotoUrl:"", clubeApi:"", escudoUrl:"", posicaoApi:"" });
  }
}