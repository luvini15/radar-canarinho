import { NextResponse } from "next/server";
import { fetchInstagramSheet } from "@/lib/sheets";

export async function GET(){
  try{
    const data = await fetchInstagramSheet(true);
    return NextResponse.json({ok:true,count:data.length,data:data.slice(0,10)});
  }catch(e:any){
    return NextResponse.json({ok:false,error:e.message},{status:500});
  }
}