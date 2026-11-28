import assert from "node:assert/strict";
import { beforeEach, describe, test } from "node:test";
import {
  clearServerTranslationCache,
  MAX_GEMINI_BATCH_SIZE,
  sanitizePdfText,
  shouldSkipDynamicTranslation,
  translateTextsWithGemini,
} from "../gemini-translate-service";

describe("gemini-translate-service", () => {
  beforeEach(() => {
    clearServerTranslationCache();
  });

  test("sanitizePdfText normaliza simbolos fora de WinAnsi para jsPDF", () => {
    assert.equal(
      sanitizePdfText("A → B — “teste” … • fim"),
      'A -> B - "teste" ... - fim'
    );
  });

  test("shouldSkipDynamicTranslation ignora numeros, valores R$, e-mails, URLs e codigos curtos", () => {
    assert.equal(shouldSkipDynamicTranslation(""), true);
    assert.equal(shouldSkipDynamicTranslation("12/05/2026"), true);
    assert.equal(shouldSkipDynamicTranslation("R$ 1.500,00"), true);
    assert.equal(shouldSkipDynamicTranslation("contato@genesis.com"), true);
    assert.equal(shouldSkipDynamicTranslation("https://genesis.com/ata"), true);
    assert.equal(shouldSkipDynamicTranslation("AB"), true);
    assert.equal(
      shouldSkipDynamicTranslation("Compra de filamento PLA para protótipo"),
      false
    );
  });

  test("retorna fallback MISSING_API_KEY sem quebrar quando GEMINI_API_KEY nao esta configurada", async () => {
    const result = await translateTextsWithGemini({
      texts: ["Usinagem do chassi principal"],
      apiKey: "",
    });

    assert.equal(result.ok, false);
    assert.equal(result.fallback, true);
    assert.equal(result.reason, "MISSING_API_KEY");
    assert.deepEqual(result.translations, ["Usinagem do chassi principal"]);
  });

  test("envia lote ao Gemini com header x-goog-api-key, sanitiza e usa cache na segunda chamada", async () => {
    let calls = 0;
    const mockFetch: typeof fetch = async (url, init) => {
      calls += 1;
      assert.match(String(url), /gemini-2\.5-flash-lite:generateContent$/);
      const headers = init?.headers as Record<string, string>;
      assert.equal(headers["x-goog-api-key"], "test-key-123");

      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      "0": "CNC chassis machining → Stage 1",
                      "1": "Sponsorship agreement renewal",
                    }),
                  },
                ],
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    const first = await translateTextsWithGemini({
      texts: [
        "Usinagem CNC do chassi etapa 1",
        "Renovação do contrato de patrocínio",
        "Usinagem CNC do chassi etapa 1",
        "R$ 500,00",
      ],
      apiKey: "test-key-123",
      fetchImpl: mockFetch,
    });

    assert.equal(first.ok, true);
    assert.equal(first.fallback, false);
    assert.equal(calls, 1);
    assert.deepEqual(first.translations, [
      "CNC chassis machining -> Stage 1",
      "Sponsorship agreement renewal",
      "CNC chassis machining -> Stage 1",
      "R$ 500,00",
    ]);

    const second = await translateTextsWithGemini({
      texts: ["Usinagem CNC do chassi etapa 1"],
      apiKey: "test-key-123",
      fetchImpl: mockFetch,
    });

    assert.equal(second.ok, true);
    assert.equal(calls, 1);
    assert.deepEqual(second.translations, ["CNC chassis machining -> Stage 1"]);
  });

  test("divide automaticamente lotes maiores que MAX_GEMINI_BATCH_SIZE", async () => {
    let calls = 0;
    const inputs = Array.from(
      { length: MAX_GEMINI_BATCH_SIZE + 5 },
      (_, idx) => `Descrição dinâmica da tarefa ${idx + 1}`
    );

    const mockFetch: typeof fetch = async (_url, init) => {
      calls += 1;
      const body = JSON.parse(String(init?.body)) as {
        contents: Array<{ parts: Array<{ text: string }> }>;
      };
      const promptText = body.contents[0].parts[0].text;
      const jsonStart = promptText.lastIndexOf("{");
      const batchObj = JSON.parse(promptText.slice(jsonStart)) as Record<
        string,
        string
      >;
      const responseObj: Record<string, string> = {};
      for (const [k, v] of Object.entries(batchObj)) {
        responseObj[k] = v.replace("Descrição dinâmica da tarefa", "Dynamic task description");
      }

      return new Response(
        JSON.stringify({
          candidates: [
            { content: { parts: [{ text: JSON.stringify(responseObj) }] } },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    const result = await translateTextsWithGemini({
      texts: inputs,
      apiKey: "test-key-batch",
      fetchImpl: mockFetch,
    });

    assert.equal(result.ok, true);
    assert.equal(calls, 2);
    assert.equal(result.translations[0], "Dynamic task description 1");
    assert.equal(
      result.translations[MAX_GEMINI_BATCH_SIZE + 4],
      `Dynamic task description ${MAX_GEMINI_BATCH_SIZE + 5}`
    );
  });

  test("faz fallback seguro quando Gemini retorna HTTP 500", async () => {
    const mockFetch: typeof fetch = async () =>
      new Response("Internal error", { status: 500 });

    const result = await translateTextsWithGemini({
      texts: ["Atraso na entrega de rolamentos"],
      apiKey: "test-key-err",
      fetchImpl: mockFetch,
    });

    assert.equal(result.ok, false);
    assert.equal(result.fallback, true);
    assert.equal(result.reason, "PROVIDER_ERROR");
    assert.deepEqual(result.translations, ["Atraso na entrega de rolamentos"]);
  });
});
