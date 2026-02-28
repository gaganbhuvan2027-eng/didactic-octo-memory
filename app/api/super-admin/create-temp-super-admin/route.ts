import { createSuperAdmin } from "@/app/actions/institution-login";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const secretKey = req.headers.get("x-superadmin-secret-key");
  if (secretKey !== process.env.SUPERADMIN_SECRET_KEY) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { email, password } = await req.json();

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/7b85b57d-d53d-4000-9ec2-d7db075b5f8a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/super-admin/create-temp-super-admin/route.ts:16',message:'Calling createSuperAdmin',data:{email: email},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  const result = await createSuperAdmin(email, password);

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/7b85b57d-d53d-4000-9ec2-d7db075b5f8a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/super-admin/create-temp-super-admin/route.ts:21',message:'Result from createSuperAdmin',data:{result: result},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  if (result.error) {
    return NextResponse.json({ message: result.error }, { status: 500 });
  }

  return NextResponse.json({ userId: result.userId, message: result.message });
}
