import { z } from "zod";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatPromptTemplate } from "@langchain/core/prompts";

export const GraphOperationSchema = z.object({
  operations: z.array(
    z.discriminatedUnion("type", [
      z.object({
        type: z.literal("create_entity"),
        name: z.string().describe("The name of the entity/table (e.g. 'User')"),
      }),
      z.object({
        type: z.literal("delete_entity"),
        entityId: z.string().describe("The ID of the entity/table to delete"),
      }),
      z.object({
        type: z.literal("rename_entity"),
        entityId: z.string().describe("The ID of the entity to rename"),
        newName: z.string().describe("The new name of the entity"),
      }),
      z.object({
        type: z.literal("add_column"),
        entityId: z.string().describe("The name or ID of the entity to add the column to"),
        columnName: z.string().describe("The name of the column (e.g. 'email')"),
        columnType: z.enum([
          "String", "Integer", "Boolean", "Float", "Decimal", "Date", "Timestamp", "UUID", "JSON"
        ]).describe("The data type of the column"),
        isPk: z.boolean().describe("Whether this column is a Primary Key"),
        isFk: z.boolean().describe("Whether this column is a Foreign Key"),
        isNullable: z.boolean().describe("Whether this column can be null"),
        isUnique: z.boolean().describe("Whether this column values are unique"),
      }),
      z.object({
        type: z.literal("create_relationship"),
        sourceEntityId: z.string().describe("The name or ID of the source entity/table"),
        targetEntityId: z.string().describe("The name or ID of the target entity/table"),
        sourceCardinality: z.enum(["1", "0..1", "*", "1..*", "0..*"]).describe("The cardinality at the source side (default '1')"),
        targetCardinality: z.enum(["1", "0..1", "*", "1..*", "0..*"]).describe("The cardinality at the target side (default '*')"),
        label: z.string().optional().describe("Optional label for relationship (e.g. 'owns', 'buys')"),
      }),
      z.object({
        type: z.literal("apply_layout"),
        mode: z.enum(["grid", "dagre", "circular", "force"]).describe("The graph auto-layout mode"),
      })
    ])
  ).describe("Sequence of graph modifications to perform in order")
});

export type GraphOperations = z.infer<typeof GraphOperationSchema>;

export class GraphAgent {
  constructor(private model: BaseChatModel) {}

  async generate(prompt: string, currentContext?: string): Promise<GraphOperations> {
    const systemPrompt = `You are an expert Database Architect specialized in generating Entity Relationship (ER) diagrams.
Your task is to analyze the user's instructions and generate a precise sequence of structured graph operations to build or update the diagram.
Do NOT attempt to write direct code (like SVG, SQL, or coordinates). You must only produce the sequence of operations.

Current diagram state (use this to find entity IDs or existing names if modifying):
{context}

Guidelines:
1. When generating new entities, first output 'create_entity' operations.
2. After creating entities, add columns to them using 'add_column' with correct entity names or IDs.
3. If creating relationships between tables, output 'create_relationship' operations.
4. Ensure primary keys (PK) and foreign keys (FK) are correctly flagged.
5. Finish by outputting an 'apply_layout' operation with mode 'dagre' or 'grid' to clean up coordinates automatically.`;

    const promptTemplate = ChatPromptTemplate.fromMessages([
      ["system", systemPrompt],
      ["user", "{input}"],
    ]);

    const formattedPrompt = await promptTemplate.formatMessages({
      context: currentContext || "Empty diagram. No entities or relationships currently exist.",
      input: prompt,
    });

    const modelWithStructuredOutput = this.model.withStructuredOutput(GraphOperationSchema);
    const result = await modelWithStructuredOutput.invoke(formattedPrompt);
    return result as GraphOperations;
  }
}
