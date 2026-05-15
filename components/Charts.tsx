"use client";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import type { InstagramSnapshot, PlayerSummary } from "@/lib/types";
import { formatCompact } from "@/lib/metrics";

export function TopFollowersChart({players}:{players:PlayerSummary[]}) {
  const data = players.slice(0,10).map(p=>({name:p.nome, seguidores:p.seguidores})).reverse();
  return <div className="h-96 rounded-3xl bg-white p-5 shadow-sm"><h3 className="mb-4 font-black text-brasil-azul">Top 10 por seguidores</h3><ResponsiveContainer width="100%" height="88%"><BarChart data={data} layout="vertical" margin={{left:16,right:20}}><CartesianGrid strokeDasharray="3 3" horizontal={false}/><XAxis type="number" tickFormatter={formatCompact}/><YAxis type="category" dataKey="name" width={120} tick={{fontSize:12}}/><Tooltip formatter={(v:any)=>formatCompact(Number(v))}/><Bar dataKey="seguidores" fill="#009C3B" radius={[0,10,10,0]}/></BarChart></ResponsiveContainer></div>
}

export function PositionMap({players}:{players:PlayerSummary[]}) {
  const data = players.map(p=>({x:p.posicaoRanking,y:p.seguidores,z:Math.max(80, Math.min(1200, p.seguidores/180000)),name:p.nome, faixa: p.seguidores>=100000000?"100M+":p.seguidores>=10000000?"10M-100M":p.seguidores>=1000000?"1M-10M":"Menos 1M"}));
  return <div className="h-[520px] rounded-3xl bg-white p-5 shadow-sm"><h3 className="mb-1 font-black text-brasil-azul">Mapa de posicionamento digital</h3><p className="mb-4 text-sm text-brasil-suave">Seguidores x posição no ranking · tamanho = proporção da audiência</p><ResponsiveContainer width="100%" height="85%"><ScatterChart margin={{left:10,right:20,top:20,bottom:20}}><CartesianGrid/><XAxis type="number" dataKey="x" name="Ranking" label={{value:"Posição no Ranking",position:"bottom"}}/><YAxis type="number" dataKey="y" name="Seguidores" tickFormatter={formatCompact}/><ZAxis type="number" dataKey="z" range={[80,1200]}/><Tooltip cursor={{strokeDasharray:"3 3"}} content={({active,payload})=> active && payload?.length ? <div className="rounded-xl bg-white p-3 shadow"><b>{payload[0].payload.name}</b><br/>Ranking: {payload[0].payload.x}<br/>Seguidores: {formatCompact(payload[0].payload.y)}<br/>{payload[0].payload.faixa}</div> : null}/><Scatter data={data} fill="#009C3B"/></ScatterChart></ResponsiveContainer></div>
}

export function TimelineChart({rows, selected}:{rows:InstagramSnapshot[]; selected:string[]}) {
  const names = selected.length ? selected : Array.from(new Set(rows.map(r=>r.nome))).slice(0,5);
  const dates = Array.from(new Set(rows.map(r=>r.dataColeta))).sort();
  const data = dates.map(d=>{
    const item:any = {data:d};
    for (const n of names) {
      const r = rows.filter(x=>x.nome===n && x.dataColeta<=d).sort((a,b)=>b.dataColeta.localeCompare(a.dataColeta))[0];
      item[n] = r?.seguidores ?? null;
    }
    return item;
  });
  const colors = ["#009C3B","#FFDF00","#002776","#7C3AED","#EF4444","#0EA5E9"];
  return <div className="h-[520px] rounded-3xl bg-white p-5 shadow-sm"><h3 className="mb-4 font-black text-brasil-azul">Evolução diária de seguidores</h3><ResponsiveContainer width="100%" height="88%"><LineChart data={data}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="data"/><YAxis tickFormatter={formatCompact}/><Tooltip formatter={(v:any)=>formatCompact(Number(v))}/>{names.map((n,i)=><Line key={n} type="monotone" dataKey={n} stroke={colors[i%colors.length]} strokeWidth={3} dot={false}/>)}</LineChart></ResponsiveContainer></div>
}
