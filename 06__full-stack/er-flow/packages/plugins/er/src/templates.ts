import { ErEntity, ErRelationship } from "./types";

export interface ErTemplate {
  name: string;
  description: string;
  entities: ErEntity[];
  relationships: ErRelationship[];
}

export const ER_TEMPLATES = [
  {
    id: "blog",
    name: "Blog System",
    description: "Simple database model for users, blog posts, comments, and tags.",
    entities: [
      {
        id: "blog-user",
        name: "User",
        attributes: [
          { id: "bu-1", name: "id", type: "UUID", isPk: true, isFk: false, isNullable: false, isUnique: true },
          { id: "bu-2", name: "email", type: "String", isPk: false, isFk: false, isNullable: false, isUnique: true },
          { id: "bu-3", name: "password", type: "String", isPk: false, isFk: false, isNullable: false, isUnique: false },
          { id: "bu-4", name: "created_at", type: "Timestamp", isPk: false, isFk: false, isNullable: false, isUnique: false, defaultValue: "NOW()" },
        ],
      },
      {
        id: "blog-post",
        name: "Post",
        attributes: [
          { id: "bp-1", name: "id", type: "UUID", isPk: true, isFk: false, isNullable: false, isUnique: true },
          { id: "bp-2", name: "author_id", type: "UUID", isPk: false, isFk: true, isNullable: false, isUnique: false, fkReference: { entityId: "blog-user", attributeId: "bu-1" } },
          { id: "bp-3", name: "title", type: "String", isPk: false, isFk: false, isNullable: false, isUnique: false },
          { id: "bp-4", name: "content", type: "String", isPk: false, isFk: false, isNullable: true, isUnique: false },
          { id: "bp-5", name: "published_at", type: "Timestamp", isPk: false, isFk: false, isNullable: true, isUnique: false },
        ],
      },
      {
        id: "blog-comment",
        name: "Comment",
        attributes: [
          { id: "bc-1", name: "id", type: "UUID", isPk: true, isFk: false, isNullable: false, isUnique: true },
          { id: "bc-2", name: "post_id", type: "UUID", isPk: false, isFk: true, isNullable: false, isUnique: false, fkReference: { entityId: "blog-post", attributeId: "bp-1" } },
          { id: "bc-3", name: "author_id", type: "UUID", isPk: false, isFk: true, isNullable: false, isUnique: false, fkReference: { entityId: "blog-user", attributeId: "bu-1" } },
          { id: "bc-4", name: "body", type: "String", isPk: false, isFk: false, isNullable: false, isUnique: false },
          { id: "bc-5", name: "created_at", type: "Timestamp", isPk: false, isFk: false, isNullable: false, isUnique: false, defaultValue: "NOW()" },
        ],
      },
    ],
    relationships: [
      {
        id: "br-1",
        sourceEntityId: "blog-post",
        targetEntityId: "blog-user",
        sourceCardinality: "*",
        targetCardinality: "1",
        identifying: true,
        label: "",
      },
      {
        id: "br-2",
        sourceEntityId: "blog-comment",
        targetEntityId: "blog-post",
        sourceCardinality: "*",
        targetCardinality: "1",
        identifying: true,
        label: "belongs to",
      },
      {
        id: "br-3",
        sourceEntityId: "blog-comment",
        targetEntityId: "blog-user",
        sourceCardinality: "*",
        targetCardinality: "1",
        identifying: false,
        label: "",
      },
    ],
  },
  {
    id: "ecommerce",
    name: "E-Commerce Store",
    description: "Model managing customer profiles, storefront products, shopping orders, and items.",
    entities: [
      {
        id: "eco-user",
        name: "Customer",
        attributes: [
          { id: "eu-1", name: "id", type: "UUID", isPk: true, isFk: false, isNullable: false, isUnique: true },
          { id: "eu-2", name: "name", type: "String", isPk: false, isFk: false, isNullable: false, isUnique: false },
          { id: "eu-3", name: "email", type: "String", isPk: false, isFk: false, isNullable: false, isUnique: true },
        ],
      },
      {
        id: "eco-product",
        name: "Product",
        attributes: [
          { id: "ep-1", name: "id", type: "UUID", isPk: true, isFk: false, isNullable: false, isUnique: true },
          { id: "ep-2", name: "sku", type: "String", isPk: false, isFk: false, isNullable: false, isUnique: true },
          { id: "ep-3", name: "name", type: "String", isPk: false, isFk: false, isNullable: false, isUnique: false },
          { id: "ep-4", name: "price", type: "Decimal", isPk: false, isFk: false, isNullable: false, isUnique: false },
        ],
      },
      {
        id: "eco-order",
        name: "Order",
        attributes: [
          { id: "eo-1", name: "id", type: "UUID", isPk: true, isFk: false, isNullable: false, isUnique: true },
          { id: "eo-2", name: "customer_id", type: "UUID", isPk: false, isFk: true, isNullable: false, isUnique: false, fkReference: { entityId: "eco-user", attributeId: "eu-1" } },
          { id: "eo-3", name: "status", type: "String", isPk: false, isFk: false, isNullable: false, isUnique: false, defaultValue: "pending" },
          { id: "eo-4", name: "ordered_at", type: "Timestamp", isPk: false, isFk: false, isNullable: false, isUnique: false, defaultValue: "NOW()" },
        ],
      },
      {
        id: "eco-item",
        name: "LineItem",
        attributes: [
          { id: "ei-1", name: "id", type: "UUID", isPk: true, isFk: false, isNullable: false, isUnique: true },
          { id: "ei-2", name: "order_id", type: "UUID", isPk: false, isFk: true, isNullable: false, isUnique: false, fkReference: { entityId: "eco-order", attributeId: "eo-1" } },
          { id: "ei-3", name: "product_id", type: "UUID", isPk: false, isFk: true, isNullable: false, isUnique: false, fkReference: { entityId: "eco-product", attributeId: "ep-1" } },
          { id: "ei-4", name: "quantity", type: "Integer", isPk: false, isFk: false, isNullable: false, isUnique: false, defaultValue: "1" },
        ],
      },
    ],
    relationships: [
      {
        id: "er-1",
        sourceEntityId: "eco-order",
        targetEntityId: "eco-user",
        sourceCardinality: "*",
        targetCardinality: "1",
        identifying: true,
        label: "placed by",
      },
      {
        id: "er-2",
        sourceEntityId: "eco-item",
        targetEntityId: "eco-order",
        sourceCardinality: "*",
        targetCardinality: "1",
        identifying: true,
        label: "contains",
      },
      {
        id: "er-3",
        sourceEntityId: "eco-item",
        targetEntityId: "eco-product",
        sourceCardinality: "*",
        targetCardinality: "1",
        identifying: false,
        label: "refers to",
      },
    ],
  },
  {
    id: "crm",
    name: "CRM Database",
    description: "Customer relationship management mapping contacts, companies, and sales deals.",
    entities: [
      {
        id: "crm-company",
        name: "Company",
        attributes: [
          { id: "cc-1", name: "id", type: "UUID", isPk: true, isFk: false, isNullable: false, isUnique: true },
          { id: "cc-2", name: "name", type: "String", isPk: false, isFk: false, isNullable: false, isUnique: false },
          { id: "cc-3", name: "domain", type: "String", isPk: false, isFk: false, isNullable: true, isUnique: false },
        ],
      },
      {
        id: "crm-contact",
        name: "Contact",
        attributes: [
          { id: "cct-1", name: "id", type: "UUID", isPk: true, isFk: false, isNullable: false, isUnique: true },
          { id: "cct-2", name: "company_id", type: "UUID", isPk: false, isFk: true, isNullable: true, isUnique: false, fkReference: { entityId: "crm-company", attributeId: "cc-1" } },
          { id: "cct-3", name: "first_name", type: "String", isPk: false, isFk: false, isNullable: false, isUnique: false },
          { id: "cct-4", name: "last_name", type: "String", isPk: false, isFk: false, isNullable: false, isUnique: false },
          { id: "cct-5", name: "email", type: "String", isPk: false, isFk: false, isNullable: false, isUnique: true },
        ],
      },
      {
        id: "crm-deal",
        name: "Deal",
        attributes: [
          { id: "cd-1", name: "id", type: "UUID", isPk: true, isFk: false, isNullable: false, isUnique: true },
          { id: "cd-2", name: "company_id", type: "UUID", isPk: false, isFk: true, isNullable: false, isUnique: false, fkReference: { entityId: "crm-company", attributeId: "cc-1" } },
          { id: "cd-3", name: "name", type: "String", isPk: false, isFk: false, isNullable: false, isUnique: false },
          { id: "cd-4", name: "amount", type: "Decimal", isPk: false, isFk: false, isNullable: true, isUnique: false },
          { id: "cd-5", name: "stage", type: "String", isPk: false, isFk: false, isNullable: false, isUnique: false },
        ],
      },
    ],
    relationships: [
      {
        id: "crmr-1",
        sourceEntityId: "crm-contact",
        targetEntityId: "crm-company",
        sourceCardinality: "*",
        targetCardinality: "0..1",
        identifying: false,
        label: "works at",
      },
      {
        id: "crmr-2",
        sourceEntityId: "crm-deal",
        targetEntityId: "crm-company",
        sourceCardinality: "*",
        targetCardinality: "1",
        identifying: true,
        label: "associated with",
      },
    ],
  },
];
export default ER_TEMPLATES;
