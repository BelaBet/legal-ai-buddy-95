import { describe, expect, it } from "vitest";
import { PROMPT_TEMPLATES, PROMPT_TEMPLATE_CATEGORIES } from "./promptTemplates";

describe("promptTemplates", () => {
  it("has at least one template", () => {
    expect(PROMPT_TEMPLATES.length).toBeGreaterThan(0);
  });

  it("has unique ids", () => {
    const ids = PROMPT_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only uses declared categories", () => {
    const validCategories = new Set<string>(PROMPT_TEMPLATE_CATEGORIES);
    for (const template of PROMPT_TEMPLATES) {
      expect(validCategories.has(template.category)).toBe(true);
    }
  });

  it("has a non-empty title and prompt for every template", () => {
    for (const template of PROMPT_TEMPLATES) {
      expect(template.title.trim().length).toBeGreaterThan(0);
      expect(template.prompt.trim().length).toBeGreaterThan(0);
    }
  });

  it("covers every declared category with at least one template", () => {
    const usedCategories = new Set(PROMPT_TEMPLATES.map((t) => t.category));
    for (const category of PROMPT_TEMPLATE_CATEGORIES) {
      expect(usedCategories.has(category)).toBe(true);
    }
  });
});
