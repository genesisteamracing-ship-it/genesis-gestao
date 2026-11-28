import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth-token";
import { translateTextsWithGemini } from "@/lib/i18n/gemini-translate-service";

export const dynamic = "force-dynamic";

const translateRequestSchema = z.object({
  texts: z.array(z.string().max(1500)).min(1).max(200),
  sourceLocale: z.enum(["pt-BR", "en-US"]).default("pt-BR"),
  targetLocale: z.enum(["pt-BR", "en-US"]).default("en-US"),
  context: z.string().max(200).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySessionToken(token) : null;

    if (!session) {
      return NextResponse.json(
        { ok: false, error: "Não autenticado." },
        { status: 401 }
      );
    }

    const rawBody: unknown = await request.json();
    const parsed = translateRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Payload de tradução inválido.",
        },
        { status: 400 }
      );
    }

    const result = await translateTextsWithGemini({
      texts: parsed.data.texts,
      sourceLocale: parsed.data.sourceLocale,
      targetLocale: parsed.data.targetLocale,
      context: parsed.data.context,
    });

    if (result.fallback) {
      console.warn(
        `[POST /api/translate] Fallback ativado (${result.reason ?? "UNKNOWN"}) para ${parsed.data.texts.length} texto(s).`
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[POST /api/translate] Erro inesperado:", error);
    return NextResponse.json(
      {
        ok: false,
        fallback: true,
        reason: "PROVIDER_ERROR",
        translations: [],
      },
      { status: 500 }
    );
  }
}
