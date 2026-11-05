import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { currencyInputStyles } from "../currency-input";

describe("CurrencyInput Styles & Variants (tailwind-variants)", () => {
  it("deve gerar classes padrão para o input sem prefixo", () => {
    const { input, root } = currencyInputStyles({
      inputSize: "default",
      hasPrefix: false,
    });

    const inputClasses = input();
    const rootClasses = root();

    assert.ok(rootClasses.includes("relative flex w-full items-center"));
    assert.ok(inputClasses.includes("h-9"));
    assert.ok(inputClasses.includes("pl-3"));
    assert.ok(inputClasses.includes("bg-card"));
    assert.ok(inputClasses.includes("border-input"));
  });

  it("deve aplicar pl-9 quando hasPrefix for true", () => {
    const { input, prefix } = currencyInputStyles({
      hasPrefix: true,
    });

    const inputClasses = input();
    const prefixClasses = prefix();

    assert.ok(inputClasses.includes("pl-9"));
    assert.ok(prefixClasses.includes("left-3"));
  });

  it("deve aplicar altura h-11 na variante lg", () => {
    const { input } = currencyInputStyles({
      inputSize: "lg",
    });

    const inputClasses = input();
    assert.ok(inputClasses.includes("h-11"));
    assert.ok(inputClasses.includes("text-base"));
  });

  it("deve permitir estender classes customizadas via slot", () => {
    const { input } = currencyInputStyles();
    const customClasses = input({ className: "custom-border-test" });

    assert.ok(customClasses.includes("custom-border-test"));
  });
});
