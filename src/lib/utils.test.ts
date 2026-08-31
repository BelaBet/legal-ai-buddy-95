import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("merges class names and drops falsy values", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b");
  });

  it("resolves conflicting Tailwind utility classes, keeping the last one", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });
});
