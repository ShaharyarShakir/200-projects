import { ErEntity, ErRelationship } from "./types";

export interface ValidationError {
  targetId: string; // The ID of the Entity or Relationship that triggered this
  type: "entity" | "relationship" | "attribute";
  severity: "error" | "warning";
  message: string;
}

export function validateSchema(
  entities: ErEntity[],
  relationships: ErRelationship[]
): ValidationError[] {
  const errors: ValidationError[] = [];
  const entityNames = new Set<string>();

  for (const entity of entities) {
    const normName = entity.name.trim().toLowerCase();

    // 1. Check duplicate entity name
    if (entityNames.has(normName)) {
      errors.push({
        targetId: entity.id,
        type: "entity",
        severity: "error",
        message: `Duplicate entity name: "${entity.name}". Entity names must be unique.`,
      });
    } else if (normName) {
      entityNames.add(normName);
    }

    // 2. Check empty entity name
    if (!normName) {
      errors.push({
        targetId: entity.id,
        type: "entity",
        severity: "warning",
        message: "Entity has an empty or missing name.",
      });
    }

    // 3. Check duplicate attribute names & missing PKs
    const attrNames = new Set<string>();
    let hasPk = false;

    for (const attr of entity.attributes) {
      const normAttr = attr.name.trim().toLowerCase();
      if (attr.isPk) {
        hasPk = true;
      }

      if (attrNames.has(normAttr)) {
        errors.push({
          targetId: entity.id,
          type: "attribute",
          severity: "error",
          message: `Duplicate attribute "${attr.name}" in entity "${entity.name}".`,
        });
      } else if (normAttr) {
        attrNames.add(normAttr);
      }

      // Check empty attribute name
      if (!normAttr) {
        errors.push({
          targetId: entity.id,
          type: "attribute",
          severity: "warning",
          message: `Empty attribute name in entity "${entity.name}".`,
        });
      }

      // Check foreign key reference integrity
      if (attr.isFk && attr.fkReference) {
        const refEntity = entities.find((e) => e.id === attr.fkReference?.entityId);
        if (!refEntity) {
          errors.push({
            targetId: entity.id,
            type: "attribute",
            severity: "error",
            message: `Foreign Key "${attr.name}" in entity "${entity.name}" references a non-existent entity.`,
          });
        } else {
          const refAttr = refEntity.attributes.find((a) => a.id === attr.fkReference?.attributeId);
          if (!refAttr) {
            errors.push({
              targetId: entity.id,
              type: "attribute",
              severity: "error",
              message: `Foreign Key "${attr.name}" in entity "${entity.name}" references a non-existent attribute in "${refEntity.name}".`,
            });
          }
        }
      }
    }

    // Warning: Missing primary key
    if (entity.attributes.length > 0 && !hasPk) {
      errors.push({
        targetId: entity.id,
        type: "entity",
        severity: "warning",
        message: `Entity "${entity.name}" has no primary key defined.`,
      });
    }
  }

  // 4. Validate relationships dangling endpoints
  for (const rel of relationships) {
    const source = entities.find((e) => e.id === rel.sourceEntityId);
    const target = entities.find((e) => e.id === rel.targetEntityId);

    if (!source || !target) {
      errors.push({
        targetId: rel.id,
        type: "relationship",
        severity: "error",
        message: `Relationship connects to missing or deleted entities.`,
      });
    }
  }

  return errors;
}
