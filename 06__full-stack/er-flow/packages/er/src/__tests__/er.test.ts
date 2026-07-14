import { describe, it, expect } from "vitest";
import { generateSql, validateSchema, ER_TEMPLATES } from "../index";

describe("ER Logical Engine", () => {
  const mockEntities = [
    {
      id: "ent-1",
      name: "users",
      attributes: [
        { id: "attr-1", name: "id", type: "UUID" as const, isPk: true, isFk: false, isNullable: false, isUnique: true },
        { id: "attr-2", name: "email", type: "String" as const, isPk: false, isFk: false, isNullable: false, isUnique: true },
      ],
    },
    {
      id: "ent-2",
      name: "posts",
      attributes: [
        { id: "attr-3", name: "id", type: "Integer" as const, isPk: true, isFk: false, isNullable: false, isUnique: true },
        {
          id: "attr-4",
          name: "user_id",
          type: "UUID" as const,
          isPk: false,
          isFk: true,
          isNullable: false,
          isUnique: false,
          fkReference: { entityId: "ent-1", attributeId: "attr-1" },
        },
      ],
    },
  ];

  const mockRelationships = [
    {
      id: "rel-1",
      sourceEntityId: "ent-1",
      targetEntityId: "ent-2",
      sourceCardinality: "1",
      targetCardinality: "*",
      identifying: true,
      label: "author of",
    },
  ];

  it("should generate DDL SQL schema compilers", () => {
    const postgresSql = generateSql(mockEntities, mockRelationships, "postgres");
    expect(postgresSql).toContain("CREATE TABLE users");
    expect(postgresSql).toContain("PRIMARY KEY");
    expect(postgresSql).toContain("FOREIGN KEY (user_id) REFERENCES users(id)");

    const sqliteSql = generateSql(mockEntities, mockRelationships, "sqlite");
    expect(sqliteSql).toContain("CREATE TABLE posts");
  });

  it("should validate database schema integrity", () => {
    // Valid schema should return no errors
    const errors = validateSchema(mockEntities, mockRelationships);
    expect(errors.length).toBe(0);

    // Duplicate table name error check
    const duplicateEntities = [
      ...mockEntities,
      {
        id: "ent-3",
        name: "users",
        attributes: [
          { id: "attr-5", name: "id", type: "UUID" as const, isPk: true, isFk: false, isNullable: false, isUnique: true },
        ],
      },
    ];
    const dupErrors = validateSchema(duplicateEntities, mockRelationships);
    expect(dupErrors.some(e => e.message.includes("Duplicate entity name"))).toBe(true);

    // Missing primary key warning check
    const noPkEntities = [
      {
        id: "ent-4",
        name: "comments",
        attributes: [
          { id: "attr-6", name: "body", type: "String" as const, isPk: false, isFk: false, isNullable: false, isUnique: false },
        ],
      },
    ];
    const pkWarnings = validateSchema(noPkEntities, []);
    expect(pkWarnings.some(e => e.message.includes("no primary key"))).toBe(true);
  });

  it("should contain complete starter templates", () => {
    expect(ER_TEMPLATES.blog.entities.length).toBeGreaterThan(0);
    expect(ER_TEMPLATES.ecommerce.entities.length).toBeGreaterThan(0);
  });
});
