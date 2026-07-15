import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatPromptTemplate } from "@langchain/core/prompts";

export class SchemaAgent {
  constructor(private model: BaseChatModel) {}

  async explainSchema(schemaAstJson: string): Promise<string> {
    const systemPrompt = `You are a database design, normalization, and optimization expert.
Analyze the provided Database Schema AST and provide a comprehensive explanation.
Highlight:
1. Normalization level (1NF, 2NF, 3NF, BCNF) and recommendations for improvements.
2. Key suggestions (primary keys, foreign keys, constraints, naming conventions).
3. Performance implications (suggested indexes, redundant columns, optimization techniques).
4. Potential issues (circular dependencies, orphan relationships, performance bottlenecks).

Output your explanation in a clean, professional Markdown format.`;

    const promptTemplate = ChatPromptTemplate.fromMessages([
      ["system", systemPrompt],
      ["user", "Analyze this schema AST:\n{schemaAst}"],
    ]);

    const formattedPrompt = await promptTemplate.formatMessages({
      schemaAst: schemaAstJson,
    });

    const result = await this.model.invoke(formattedPrompt);
    return result.content.toString();
  }

  async generateCode(schemaAstJson: string, targetDialect: string): Promise<string> {
    const systemPrompt = `You are a senior database engineer.
Generate clean, production-ready configuration or schema code ({dialect}) from the provided Database Schema AST.
Ensure all tables, keys, types, nullable properties, and foreign keys match the AST exactly.
Do not wrap your explanation with conversational text. Simply output the raw code.`;

    const promptTemplate = ChatPromptTemplate.fromMessages([
      ["system", systemPrompt],
      ["user", "Target Dialect/Format: {dialect}\n\nSchema AST:\n{schemaAst}"],
    ]);

    const formattedPrompt = await promptTemplate.formatMessages({
      schemaAst: schemaAstJson,
      dialect: targetDialect,
    });

    const result = await this.model.invoke(formattedPrompt);
    return result.content.toString();
  }
}
