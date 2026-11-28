import assert from "node:assert/strict";
import { beforeEach, describe, test } from "node:test";
import {
  clearClientPdfTranslationCache,
  resolveTranslatedPdfText,
  translatePdfTexts,
} from "../pdf-translate-client";

describe("pdf-translate-client", () => {
  beforeEach(() => {
    clearClientPdfTranslationCache();
  });

  test("nao faz nenhuma chamada de rede quando locale eh pt-BR", async () => {
    let called = false;
    const mockFetch: typeof fetch = async () => {
      called = true;
      return new Response("{}", { status: 200 });
    };

    const res = await translatePdfTexts(["Usinagem do bloco"], {
      locale: "pt-BR",
      context: "Test",
      fetchImpl: mockFetch,
    });

    assert.equal(called, false);
    assert.equal(res.usedFallback, false);
    assert.equal(
      resolveTranslatedPdfText("Usinagem do bloco", res.translations, "pt-BR"),
      "Usinagem do bloco"
    );
  });

  test("usa dicionario local para rotulos conhecidos e chama /api/translate apenas para textos dinamicos", async () => {
    let sentTexts: string[] = [];
    let calls = 0;

    const mockFetch: typeof fetch = async (url, init) => {
      calls += 1;
      assert.equal(String(url), "/api/translate");
      const parsed = JSON.parse(String(init?.body)) as { texts: string[] };
      sentTexts = parsed.texts;

      return new Response(
        JSON.stringify({
          ok: true,
          fallback: false,
          translations: ["CNC milling of front wing"],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    const res = await translatePdfTexts(
      ["Engenharia & CAD", "Usinagem CNC da asa dianteira", "R$ 320,00"],
      {
        locale: "en-US",
        context: "WBS PDF",
        fetchImpl: mockFetch,
      }
    );

    assert.equal(calls, 1);
    assert.deepEqual(sentTexts, ["Usinagem CNC da asa dianteira"]);
    assert.equal(res.usedFallback, false);
    assert.equal(
      resolveTranslatedPdfText("Engenharia & CAD", res.translations, "en-US"),
      "Engineering & CAD"
    );
    assert.equal(
      resolveTranslatedPdfText(
        "Usinagem CNC da asa dianteira",
        res.translations,
        "en-US"
      ),
      "CNC milling of front wing"
    );

    // Segunda chamada deve usar cache em memoria
    const cached = await translatePdfTexts(["Usinagem CNC da asa dianteira"], {
      locale: "en-US",
      context: "WBS PDF",
      fetchImpl: mockFetch,
    });
    assert.equal(calls, 1);
    assert.equal(
      resolveTranslatedPdfText(
        "Usinagem CNC da asa dianteira",
        cached.translations,
        "en-US"
      ),
      "CNC milling of front wing"
    );
  });

  test("sinaliza usedFallback quando /api/translate retorna fallback", async () => {
    const mockFetch: typeof fetch = async () =>
      new Response(
        JSON.stringify({
          ok: false,
          fallback: true,
          reason: "MISSING_API_KEY",
          translations: ["Texto dinamico sem chave"],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );

    const res = await translatePdfTexts(["Texto dinamico sem chave"], {
      locale: "en-US",
      context: "Risks PDF",
      fetchImpl: mockFetch,
    });

    assert.equal(res.usedFallback, true);
    assert.equal(res.reason, "MISSING_API_KEY");
    assert.equal(
      resolveTranslatedPdfText(
        "Texto dinamico sem chave",
        res.translations,
        "en-US"
      ),
      "Texto dinamico sem chave"
    );
  });
});
