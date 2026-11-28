import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import * as React from "react";
import { cleanup, render } from "@testing-library/react";
import { PLATFORM_NAME, PLATFORM_TAGLINE } from "@/lib/constants";
import { metadata as documentosMetadata } from "@/app/documentos/layout";
import { PlatformBrand, platformBrandStyles } from "../platform-brand";

function withDom(fn: () => Promise<void> | void) {
  return async () => {
    const dom = new JSDOM("<!doctype html><html><body></body></html>", {
      url: "http://localhost:3000",
    });
    const globals = [
      ["document", dom.window.document],
      ["window", dom.window],
      ["navigator", dom.window.navigator],
      ["HTMLElement", dom.window.HTMLElement],
      ["Element", dom.window.Element],
      ["Node", dom.window.Node],
    ] as const;

    const originals = globals.map(
      ([key]) => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const
    );

    for (const [key, value] of globals) {
      Object.defineProperty(globalThis, key, { configurable: true, value });
    }

    try {
      await fn();
    } finally {
      cleanup();
      for (const [key, desc] of originals) {
        if (desc) Object.defineProperty(globalThis, key, desc);
        else Reflect.deleteProperty(globalThis, key);
      }
      dom.window.close();
    }
  };
}

test("constantes da plataforma definem Éden e tagline corretas", () => {
  assert.equal(PLATFORM_NAME, "Éden");
  assert.equal(PLATFORM_TAGLINE, "Gestão STEM Racing");
});

test(
  "PlatformBrand renderiza Éden por padrão sem mencionar Genesis e aplica variantes",
  withDom(() => {
    const view = render(<PlatformBrand />);
    const brand = view.getByText("Éden");

    assert.ok(brand);
    assert.equal(view.queryByText(/Genesis/i), null);
    assert.ok(brand.className.includes("text-primary"));
    assert.ok(brand.className.includes("text-xl"));
    assert.ok(brand.className.includes("font-extrabold"));
  })
);

test(
  "PlatformBrand aplica todas as variantes de tamanho, className customizado e atributos nativos",
  withDom(() => {
    const sizes = ["sm", "md", "lg", "login"] as const;

    for (const size of sizes) {
      const view = render(
        <PlatformBrand
          size={size}
          className="custom-brand-class"
          data-testid={`brand-${size}`}
          aria-label={`Marca ${PLATFORM_NAME}`}
        />
      );

      const element = view.getByTestId(`brand-${size}`);
      assert.equal(element.textContent, "Éden");
      assert.equal(element.getAttribute("aria-label"), "Marca Éden");
      assert.ok(element.className.includes("text-primary"));
      assert.ok(element.className.includes("custom-brand-class"));

      const expectedClasses = platformBrandStyles({ size }).split(" ");
      for (const cls of expectedClasses) {
        assert.ok(
          element.className.includes(cls),
          `Esperava classe "${cls}" na variante "${size}", recebido: "${element.className}"`
        );
      }

      if (size === "login") {
        assert.ok(element.className.includes("font-black"));
      }

      cleanup();
    }
  })
);

test("metadados da rota /documentos usam apenas o título do módulo para compor o template Éden", () => {
  assert.equal(documentosMetadata.title, "Documentos & WBS");
  assert.equal(
    String(documentosMetadata.title).toLowerCase().includes("genesis"),
    false
  );
});
