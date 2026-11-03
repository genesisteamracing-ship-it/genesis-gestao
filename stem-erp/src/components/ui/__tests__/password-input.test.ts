import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { passwordInputStyles } from "../password-input";

describe("PasswordInput Styles & Variants", () => {
  it("deve gerar classes padrão para o input com padding esquerdo padrão pl-3 e direito pr-10", () => {
    const styles = passwordInputStyles({ hasStartIcon: false });
    const inputClasses = styles.input();

    assert.ok(inputClasses.includes("pl-3"), "Deveria conter pl-3 quando não há startIcon");
    assert.ok(inputClasses.includes("pr-10"), "Deveria conter pr-10 para o botão do olho");
  });

  it("deve aplicar pl-10 quando hasStartIcon for true", () => {
    const styles = passwordInputStyles({ hasStartIcon: true });
    const inputClasses = styles.input();

    assert.ok(inputClasses.includes("pl-10"), "Deveria conter pl-10 quando hasStartIcon for true");
    assert.ok(!inputClasses.includes("pl-3"), "Não deveria conter pl-3 quando hasStartIcon for true");
  });

  it("deve aplicar altura e tamanho de fonte da variante lg", () => {
    const styles = passwordInputStyles({ inputSize: "lg" });
    const inputClasses = styles.input();

    assert.ok(inputClasses.includes("h-11"), "Deveria conter h-11 para tamanho lg");
    assert.ok(inputClasses.includes("text-base"), "Deveria conter text-base para tamanho lg");
  });

  it("deve permitir sobrescrever ou estender classes usando a função de slot", () => {
    const styles = passwordInputStyles();
    const customClasses = styles.input({ className: "bg-muted/30 h-12" });

    assert.ok(customClasses.includes("bg-muted/30"), "Deveria mesclar bg-muted/30");
    assert.ok(customClasses.includes("h-12"), "Deveria mesclar h-12");
  });

  it("deve conter slots estruturais corretos para o botão de toggle e wrapper do ícone", () => {
    const styles = passwordInputStyles();
    const buttonClasses = styles.toggleButton();
    const wrapperClasses = styles.startIconWrapper();

    assert.ok(buttonClasses.includes("absolute right-3.5"), "Botão deve ficar posicionado à direita");
    assert.ok(wrapperClasses.includes("absolute left-3.5"), "Ícone inicial deve ficar posicionado à esquerda");
  });
});
