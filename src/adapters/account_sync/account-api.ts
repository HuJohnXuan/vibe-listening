import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
export async function sessionClient(request: NextRequest) { const token=request.headers.get("authorization")?.replace(/^Bearer\s+/i,""); const url=process.env.NEXT_PUBLIC_SUPABASE_URL; const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; if (!token || !url || !key) return null; const auth=createClient(url,key,{global:{headers:{Authorization:`Bearer ${token}`}}}); const {data:{user}}=await auth.auth.getUser(); return user ? auth : null; }
export const unavailable = () => NextResponse.json({error:"Account sync is not configured"},{status:503});
