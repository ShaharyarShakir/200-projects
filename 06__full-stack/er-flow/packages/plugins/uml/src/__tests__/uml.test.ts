import { describe, it, expect } from "vitest";
import umlPlugin from "../index";

describe("UML Diagram Plugin", () => {
  it("should have correct plugin metadata", () => {
    expect(umlPlugin.id).toBe("uml");
    expect(umlPlugin.nodeTypes.length).toBe(1);
    expect(umlPlugin.edgeTypes?.length).toBe(2);
  });

  it("should validate UML cyclic inheritance", () => {
    const validate = umlPlugin.validationRules?.[0]?.validate;
    expect(validate).toBeDefined();

    // Cyclic inheritance
    const cyclicShapes = [
      { id: "class-a", type: "uml-class", text: "ClassA" },
      { id: "class-b", type: "uml-class", text: "ClassB" },
      { id: "gen-1", type: "uml-generalization", source: "class-a", target: "class-b" },
      { id: "gen-2", type: "uml-generalization", source: "class-b", target: "class-a" },
    ];

    const results = validate!(cyclicShapes);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].message).toContain("Cyclic inheritance path detected");
  });
});
