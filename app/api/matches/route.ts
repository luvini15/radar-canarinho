import { NextResponse } from "next/server";

export async function GET(){
  const key = process.env.FOOTBALL_DATA_KEY;
  if (!key) return NextResponse.json({ok:false,error:"FOOTBALL_DATA_KEY não configurada"}, {status:400});

  const res = await fetch("https://api.football-data.org/v4/competitions/WC/matches", {
    headers: { "X-Auth-Token": key },
    next: { revalidate: 60*30 }
  });

  if (!res.ok) {
    return NextResponse.json({ok:false,error:`football-data.org: ${res.status}`}, {status:res.status});
  }

  const data = await res.json();
  return NextResponse.json({ok:true,matches:data.matches || []});
}