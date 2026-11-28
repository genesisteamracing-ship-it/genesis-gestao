import type { AppLocale } from "./locale-types";
import { translateUiText } from "./translations";

export const TRANSLATABLE_ATTRIBUTES = [
  "placeholder",
  "title",
  "aria-label",
] as const;

type TranslatableAttribute = (typeof TRANSLATABLE_ATTRIBUTES)[number];

const EXCLUDED_CONTAINER_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "CODE",
  "PRE",
]);

const EXCLUDED_TEXT_TAGS = new Set([
  ...EXCLUDED_CONTAINER_TAGS,
  "INPUT",
  "TEXTAREA",
]);

export interface TrackedStringEntry {
  original: string;
  applied: string;
}

export interface DomTranslationState {
  textNodes: WeakMap<Text, TrackedStringEntry>;
  trackedTexts: Set<Text>;
  elementAttributes: WeakMap<Element, Map<TranslatableAttribute, TrackedStringEntry>>;
  trackedElements: Set<Element>;
}

export function createDomTranslationState(): DomTranslationState {
  return {
    textNodes: new WeakMap(),
    trackedTexts: new Set(),
    elementAttributes: new WeakMap(),
    trackedElements: new Set(),
  };
}

function isExcludedElement(
  startElement: Element | null,
  excludedTags: ReadonlySet<string>
): boolean {
  let current: Element | null = startElement;
  while (current) {
    if (
      current.getAttribute("data-no-translate") === "true" ||
      current.getAttribute("contenteditable") === "true"
    ) {
      return true;
    }

    if (excludedTags.has(current.tagName.toUpperCase())) {
      return true;
    }

    current = current.parentElement;
  }

  return false;
}

export function translateTextNode(
  node: Text,
  state: DomTranslationState,
  locale: AppLocale
): void {
  if (locale === "pt-BR") {
    return;
  }

  if (isExcludedElement(node.parentElement, EXCLUDED_TEXT_TAGS)) {
    return;
  }

  const currentValue = node.nodeValue ?? "";
  const tracked = state.textNodes.get(node);

  if (tracked) {
    if (currentValue !== tracked.applied) {
      // React atualizou este nó com novo conteúdo em pt-BR
      tracked.original = currentValue;
    }

    const translated = translateUiText(tracked.original, locale);
    if (translated !== currentValue) {
      node.nodeValue = translated;
    }
    tracked.applied = translated;
    return;
  }

  if (!currentValue.trim()) {
    return;
  }

  const translated = translateUiText(currentValue, locale);
  if (translated === currentValue) {
    return;
  }

  state.textNodes.set(node, {
    original: currentValue,
    applied: translated,
  });
  state.trackedTexts.add(node);
  node.nodeValue = translated;
}

export function translateElementAttributes(
  element: Element,
  state: DomTranslationState,
  locale: AppLocale
): void {
  if (locale === "pt-BR") {
    return;
  }

  if (isExcludedElement(element, EXCLUDED_CONTAINER_TAGS)) {
    return;
  }

  let attrMap = state.elementAttributes.get(element);

  for (const attr of TRANSLATABLE_ATTRIBUTES) {
    const currentValue = element.getAttribute(attr);
    if (currentValue === null) {
      if (attrMap?.has(attr)) {
        attrMap.delete(attr);
      }
      continue;
    }

    const tracked = attrMap?.get(attr);
    if (tracked) {
      if (currentValue !== tracked.applied) {
        tracked.original = currentValue;
      }

      const translated = translateUiText(tracked.original, locale);
      if (translated !== currentValue) {
        element.setAttribute(attr, translated);
      }
      tracked.applied = translated;
      continue;
    }

    if (!currentValue.trim()) {
      continue;
    }

    const translated = translateUiText(currentValue, locale);
    if (translated === currentValue) {
      continue;
    }

    if (!attrMap) {
      attrMap = new Map();
      state.elementAttributes.set(element, attrMap);
    }

    attrMap.set(attr, {
      original: currentValue,
      applied: translated,
    });
    state.trackedElements.add(element);
    element.setAttribute(attr, translated);
  }
}

export function applyTranslationsToElement(
  root: HTMLElement | Element,
  state: DomTranslationState,
  locale: AppLocale = "en-US"
): void {
  if (locale === "pt-BR") {
    return;
  }

  if (isExcludedElement(root, EXCLUDED_CONTAINER_TAGS)) {
    return;
  }

  translateElementAttributes(root, state, locale);

  const doc = root.ownerDocument;
  const elementWalker = doc.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  let currentElement = elementWalker.nextNode();
  while (currentElement) {
    if (currentElement instanceof Element) {
      translateElementAttributes(currentElement, state, locale);
    }
    currentElement = elementWalker.nextNode();
  }

  const textWalker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let currentText = textWalker.nextNode();
  while (currentText) {
    if (currentText.nodeType === Node.TEXT_NODE) {
      translateTextNode(currentText as Text, state, locale);
    }
    currentText = textWalker.nextNode();
  }
}

export function restoreTranslations(state: DomTranslationState): void {
  for (const textNode of state.trackedTexts) {
    const tracked = state.textNodes.get(textNode);
    if (tracked && textNode.nodeValue === tracked.applied) {
      textNode.nodeValue = tracked.original;
    }
    state.textNodes.delete(textNode);
  }
  state.trackedTexts.clear();

  for (const element of state.trackedElements) {
    const attrMap = state.elementAttributes.get(element);
    if (attrMap) {
      for (const [attr, tracked] of attrMap.entries()) {
        if (element.getAttribute(attr) === tracked.applied) {
          element.setAttribute(attr, tracked.original);
        }
      }
      state.elementAttributes.delete(element);
    }
  }
  state.trackedElements.clear();
}

export class DomTextTranslator {
  private readonly state = createDomTranslationState();
  private observer: MutationObserver | null = null;
  private isApplying = false;
  private isActive = false;
  private flushScheduled = false;
  private readonly pendingElements = new Set<Element>();
  private readonly pendingTextNodes = new Set<Text>();

  public start(root: HTMLElement): void {
    this.stopObserverOnly();
    this.isActive = true;
    this.runSafely(() => {
      applyTranslationsToElement(root, this.state, "en-US");
    });

    if (typeof MutationObserver === "undefined") {
      return;
    }

    this.observer = new MutationObserver((mutations) => {
      if (!this.isActive || this.isApplying) {
        return;
      }

      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          if (mutation.target.nodeType === Node.TEXT_NODE) {
            this.pendingTextNodes.add(mutation.target as Text);
          }
          continue;
        }

        if (mutation.type === "attributes") {
          if (mutation.target instanceof Element) {
            this.pendingElements.add(mutation.target);
          }
          continue;
        }

        if (mutation.type === "childList") {
          for (const added of mutation.addedNodes) {
            if (added.nodeType === Node.TEXT_NODE) {
              this.pendingTextNodes.add(added as Text);
            } else if (added instanceof Element) {
              this.pendingElements.add(added);
            }
          }
        }
      }

      if (
        (this.pendingElements.size > 0 || this.pendingTextNodes.size > 0) &&
        !this.flushScheduled
      ) {
        this.flushScheduled = true;
        queueMicrotask(() => {
          this.flushPending();
        });
      }
    });

    this.observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...TRANSLATABLE_ATTRIBUTES],
    });
  }

  public stopAndRestore(): void {
    this.isActive = false;
    this.flushScheduled = false;
    this.pendingElements.clear();
    this.pendingTextNodes.clear();
    this.stopObserverOnly();
    this.runSafely(() => {
      restoreTranslations(this.state);
    });
  }

  private flushPending(): void {
    this.flushScheduled = false;
    if (!this.isActive) {
      this.pendingElements.clear();
      this.pendingTextNodes.clear();
      return;
    }

    const elements = Array.from(this.pendingElements);
    const textNodes = Array.from(this.pendingTextNodes);
    this.pendingElements.clear();
    this.pendingTextNodes.clear();

    this.runSafely(() => {
      for (const element of elements) {
        if (element.isConnected) {
          applyTranslationsToElement(element, this.state, "en-US");
        }
      }

      for (const textNode of textNodes) {
        if (textNode.isConnected) {
          translateTextNode(textNode, this.state, "en-US");
        }
      }
    });
  }

  private runSafely(action: () => void): void {
    this.isApplying = true;
    try {
      action();
      this.observer?.takeRecords();
    } finally {
      this.isApplying = false;
    }
  }

  private stopObserverOnly(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}
