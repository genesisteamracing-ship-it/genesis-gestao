import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatCurrencyMask,
  parseReaisToCents,
  formatCentsToReais,
} from "../utils";

describe("Máscara Monetária ATM e Conversão Financeira (Currency Mask)", () => {
  describe("formatCurrencyMask", () => {
    it("deve retornar string vazia para valores vazios, nulos ou indefinidos", () => {
      assert.equal(formatCurrencyMask(""), "");
      assert.equal(formatCurrencyMask(null as unknown as string), "");
      assert.equal(formatCurrencyMask(undefined as unknown as string), "");
    });

    it("deve começar dos centavos ao digitar o primeiro dígito", () => {
      assert.equal(formatCurrencyMask("1"), "0,01");
      assert.equal(formatCurrencyMask("5"), "0,05");
      assert.equal(formatCurrencyMask("9"), "0,09");
    });

    it("deve deslocar para a casa decimal seguinte (dois dígitos)", () => {
      // Simula digitação subsequente partindo de 0,01 -> usuário digita 2 -> "0,012"
      assert.equal(formatCurrencyMask("0,012"), "0,12");
      assert.equal(formatCurrencyMask("12"), "0,12");
      assert.equal(formatCurrencyMask("50"), "0,50");
    });

    it("deve deslocar para a casa dos reais (três dígitos) inserindo a vírgula automaticamente", () => {
      // "0,12" + 3 -> "0,123" -> R$ 1,23
      assert.equal(formatCurrencyMask("0,123"), "1,23");
      assert.equal(formatCurrencyMask("123"), "1,23");
    });

    it("deve formatar valores na casa das dezenas e centenas com vírgula", () => {
      // "1,23" + 4 -> "1,234" -> 12,34
      assert.equal(formatCurrencyMask("1,234"), "12,34");
      // "12,34" + 5 -> "12,345" -> 123,45
      assert.equal(formatCurrencyMask("12,345"), "123,45");
      // Exemplo do placeholder do usuário: 4, 5, 0, 0, 0 -> 450,00
      assert.equal(formatCurrencyMask("45000"), "450,00");
    });

    it("deve formatar milhares com ponto separador e vírgula decimal", () => {
      assert.equal(formatCurrencyMask("123450"), "1.234,50");
      assert.equal(formatCurrencyMask("1234567"), "12.345,67");
      assert.equal(formatCurrencyMask("100000000"), "1.000.000,00");
    });

    it("deve limpar o campo ao apagar os centavos com backspace", () => {
      // Usuário tinha "0,01" e pressionou backspace -> valor DOM vira "0,0"
      assert.equal(formatCurrencyMask("0,0"), "");
      // Usuário apagou tudo
      assert.equal(formatCurrencyMask(""), "");
    });

    it("deve decrementar as casas decimais corretamente ao apagar", () => {
      // "1,23" -> apaga último dígito -> DOM vira "1,2" -> "0,12"
      assert.equal(formatCurrencyMask("1,2"), "0,12");
      // "0,12" -> apaga último dígito -> DOM vira "0,1" -> "0,01"
      assert.equal(formatCurrencyMask("0,1"), "0,01");
    });

    it("deve permitir digitar 0 inicial exibindo 0,00", () => {
      assert.equal(formatCurrencyMask("0"), "0,00");
    });

    it("deve aceitar colagens de valores já formatados", () => {
      assert.equal(formatCurrencyMask("450,00"), "450,00");
      assert.equal(formatCurrencyMask("R$ 1.500,75"), "1.500,75");
    });
  });

  describe("parseReaisToCents", () => {
    it("deve converter string formatada em Reais para centavos inteiros", () => {
      assert.equal(parseReaisToCents("0,01"), 1);
      assert.equal(parseReaisToCents("0,12"), 12);
      assert.equal(parseReaisToCents("1,23"), 123);
      assert.equal(parseReaisToCents("450,00"), 45000);
      assert.equal(parseReaisToCents("1.234,50"), 123450);
      assert.equal(parseReaisToCents("10.500,00"), 1050000);
    });

    it("deve tratar valores decimais com ponto sem quebrar", () => {
      assert.equal(parseReaisToCents("450.00"), 45000);
      assert.equal(parseReaisToCents(450), 45000);
    });

    it("deve retornar 0 para valores vazios ou inválidos", () => {
      assert.equal(parseReaisToCents(""), 0);
      assert.equal(parseReaisToCents("0,00"), 0);
      assert.equal(parseReaisToCents("abc"), 0);
    });
  });

  describe("formatCentsToReais", () => {
    it("deve formatar centavos inteiros para string no padrão brasileiro", () => {
      assert.equal(formatCentsToReais(45000), "450,00");
      assert.equal(formatCentsToReais(123450), "1.234,50");
      assert.equal(formatCentsToReais(1), "0,01");
      assert.equal(formatCentsToReais(12), "0,12");
      assert.equal(formatCentsToReais(0), "0,00");
      assert.equal(formatCentsToReais(-100), "0,00");
    });
  });
});
