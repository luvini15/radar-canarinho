import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { fetchInstagramSheet } from "@/lib/sheets";

export async function POST(){
  try {
    const data = await fetchInstagramSheet(true);
    revalidatePath("/");
    return NextResponse.json({ ok:true, count:data.length, updatedAt:new Date().toISOString() });
  } catch(e:any) {
    return NextResponse.json({ ok:false, error:e.message }, { status:500 });
  }
}