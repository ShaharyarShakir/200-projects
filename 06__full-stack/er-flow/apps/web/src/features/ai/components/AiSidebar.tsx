import React, { useState, useRef, useEffect } from "react";
import { Sparkles, MessageSquare, Send, Bot, Database, Play, AlertCircle, RefreshCw } from "lucide-react";
import { api } from "@eraser/api-client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AiSidebarProps {
  workspaceId: string;
  documentId?: string;
  engine: any; // CanvasEngine
}

export const AiSidebar: React.FC<AiSidebarProps> = ({ workspaceId, documentId, engine }) => {
  const [activeTab, setActiveTab] = useState<"chat" | "generate">("chat");
  const [chatInput, setChatInput] = useState("");
  const [generateInput, setGenerateInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I am your AI architecture assistant. How can I help you design, normalize, or optimize your database schemas today?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getDiagramContextString = (): string => {
    if (!engine) return "";
    const shapes = engine.getShapes();
    const entities = shapes.filter((s: any) => s.type === "er-entity");
    const relationships = shapes.filter((s: any) => s.type === "er-relationship");
    
    let ctx = "Entities/Tables:\n";
    entities.forEach((ent: any) => {
      ctx += `- Name: ${ent.text || "Untitled"} (ID: ${ent.id})\n`;
      const attrs = ent.attributes || [];
      attrs.forEach((attr: any) => {
        ctx += `  * ${attr.name}: ${attr.type}${attr.isPk ? " (PK)" : ""}${attr.isFk ? " (FK)" : ""}\n`;
      });
    });
    ctx += "\nRelationships:\n";
    relationships.forEach((rel: any) => {
      ctx += `- ${rel.sourceEntityId} -> ${rel.targetEntityId} [SourceCard: ${rel.sourceCardinality}, TargetCard: ${rel.targetCardinality}]\n`;
    });
    return ctx;
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isLoading) return;

    const userMsg = chatInput.trim();
    setChatInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);
    setErrorMsg(null);

    // Initial placeholder for assistant message
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const baseURL = api.defaults.baseURL || "http://localhost:3001";
      const diagramContext = getDiagramContextString();
      const response = await fetch(`${baseURL}/ai/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMsg,
          history: messages.slice(1).map((m) => ({ role: m.role, content: m.content })),
          workspaceId,
          documentId,
          diagramContext,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to communicate with AI service");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantResponse = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const textChunk = decoder.decode(value);
          const lines = textChunk.split("\n");
          
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.replace("data: ", "").trim();
              if (dataStr === "[DONE]") continue;

              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.token) {
                  assistantResponse += parsed.token;
                  setMessages((prev) => {
                    const newMsgs = [...prev];
                    newMsgs[newMsgs.length - 1] = {
                      role: "assistant",
                      content: assistantResponse,
                    };
                    return newMsgs;
                  });
                } else if (parsed.error) {
                  throw new Error(parsed.error);
                }
              } catch (e) {
                // Ignore incomplete JSON chunks
              }
            }
          }
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while fetching stream.");
      setMessages((prev) => {
        const newMsgs = [...prev];
        newMsgs.pop(); // Remove empty assistant message
        return newMsgs;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateDiagram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generateInput.trim() || isLoading) return;

    const prompt = generateInput.trim();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const baseURL = api.defaults.baseURL || "http://localhost:3001";
      const diagramContext = getDiagramContextString();
      
      const res = await fetch(`${baseURL}/ai/diagram/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          workspaceId,
          diagramContext,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to generate diagram");
      }

      applyGraphOperations(engine, data.operations);
      setGenerateInput("");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `🎨 Successfully applied **${data.operations.length}** diagram operations to build the schema components.`,
        },
      ]);
      setActiveTab("chat");
    } catch (err: any) {
      setErrorMsg(err.message || "Could not generate diagram components.");
    } finally {
      setIsLoading(false);
    }
  };

  const applyGraphOperations = (engineInstance: any, operations: any[]) => {
    if (!engineInstance) return;

    engineInstance.transact(() => {
      const entityMap = new Map<string, string>();

      for (const op of operations) {
        if (op.type === "create_entity") {
          const entityId = crypto.randomUUID();
          entityMap.set(op.name, entityId);
          entityMap.set(op.name.toLowerCase(), entityId);

          engineInstance.addShape({
            id: entityId,
            type: "er-entity",
            x: Math.random() * 300 + 100,
            y: Math.random() * 200 + 100,
            width: 170,
            height: 140,
            rotation: 0,
            fill: "#0f172a",
            stroke: "#1e293b",
            strokeWidth: 2,
            opacity: 1,
            text: op.name,
            attributes: [],
          });
        } else if (op.type === "add_column") {
          let entityId = op.entityId;
          if (entityMap.has(entityId)) {
            entityId = entityMap.get(entityId);
          } else if (entityMap.has(entityId.toLowerCase())) {
            entityId = entityMap.get(entityId.toLowerCase());
          }

          const shape = engineInstance.getShape(entityId);
          if (shape && shape.type === "er-entity") {
            const attrs = shape.attributes || [];
            attrs.push({
              id: crypto.randomUUID(),
              name: op.columnName,
              type: op.columnType,
              isPk: op.isPk ?? false,
              isFk: op.isFk ?? false,
              isNullable: op.isNullable ?? true,
              isUnique: op.isUnique ?? false,
            });
            // Scale height to prevent text clipping
            const newHeight = Math.max(140, 60 + attrs.length * 28);
            engineInstance.updateShape(entityId, { attributes: attrs, height: newHeight });
          }
        } else if (op.type === "create_relationship") {
          let sourceId = op.sourceEntityId;
          let targetId = op.targetEntityId;

          if (entityMap.has(sourceId)) sourceId = entityMap.get(sourceId);
          else if (entityMap.has(sourceId.toLowerCase())) sourceId = entityMap.get(sourceId.toLowerCase());

          if (entityMap.has(targetId)) targetId = entityMap.get(targetId);
          else if (entityMap.has(targetId.toLowerCase())) targetId = entityMap.get(targetId.toLowerCase());

          const relId = crypto.randomUUID();
          engineInstance.addShape({
            id: relId,
            type: "er-relationship",
            sourceEntityId: sourceId,
            targetEntityId: targetId,
            sourceCardinality: op.sourceCardinality || "1",
            targetCardinality: op.targetCardinality || "*",
            identifying: true,
            label: op.label || "",
            points: [],
          });
        } else if (op.type === "apply_layout") {
          engineInstance.triggerAutoLayout(op.mode || "dagre");
        }
      }
    });
  };

  const handleIndexWorkspace = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const baseURL = api.defaults.baseURL || "http://localhost:3001";
      const res = await fetch(`${baseURL}/ai/workspace/index`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `🧠 Workspace successfully reindexed! Indexed **${data.indexedCount}** documents into Qdrant semantic memory.`,
        },
      ]);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to index workspace.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0c0c0e]/95 text-slate-100 rounded-lg overflow-hidden border border-white/5 shadow-2xl">
      {/* Sidebar Header */}
      <div className="flex border-b border-slate-800 bg-[#08080a] px-3 py-2 items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-indigo-400 animate-pulse" />
          <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-300">
            AI Assistant
          </span>
        </div>
        <button
          onClick={handleIndexWorkspace}
          disabled={isLoading}
          className="text-[9px] font-bold bg-slate-900 border border-slate-800 text-slate-400 hover:text-white px-2 py-0.5 rounded flex items-center gap-1 hover:border-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
          title="Index workspace documents to semantic memory"
        >
          <RefreshCw className={`h-2.5 w-2.5 ${isLoading ? "animate-spin" : ""}`} />
          Index RAG
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 text-[10px] font-bold bg-[#0b0c0f]">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 py-2 text-center transition-all cursor-pointer border-b ${
            activeTab === "chat"
              ? "border-indigo-500 text-indigo-400 bg-indigo-500/5 font-extrabold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <div className="flex items-center justify-center gap-1">
            <MessageSquare className="h-3 w-3" />
            Chat Architect
          </div>
        </button>
        <button
          onClick={() => setActiveTab("generate")}
          className={`flex-1 py-2 text-center transition-all cursor-pointer border-b ${
            activeTab === "generate"
              ? "border-indigo-500 text-indigo-400 bg-indigo-500/5 font-extrabold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <div className="flex items-center justify-center gap-1">
            <Database className="h-3 w-3" />
            Generate Diagram
          </div>
        </button>
      </div>

      {/* Body content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar flex flex-col justify-between">
        {activeTab === "chat" ? (
          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 p-2.5 rounded-lg border leading-relaxed animate-fade-in ${
                  msg.role === "assistant"
                    ? "bg-slate-950/40 border-slate-900 text-slate-200"
                    : "bg-indigo-950/20 border-indigo-900/30 text-slate-100 self-end ml-4"
                }`}
              >
                {msg.role === "assistant" ? (
                  <Bot className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                ) : null}
                <div className="text-[11px] whitespace-pre-wrap font-sans">
                  {msg.content || (
                    <span className="inline-flex gap-1 items-center text-slate-500">
                      Thinking
                      <span className="w-1 h-1 rounded-full bg-slate-500 animate-bounce delay-75" />
                      <span className="w-1 h-1 rounded-full bg-slate-500 animate-bounce delay-150" />
                      <span className="w-1 h-1 rounded-full bg-slate-500 animate-bounce delay-300" />
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        ) : (
          <div className="flex-1 flex flex-col space-y-4">
            <div className="bg-[#111215] border border-white/5 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center gap-2 text-indigo-400">
                <Sparkles className="h-4 w-4" />
                <h4 className="text-xs font-extrabold uppercase tracking-wide">Generate Canvas Diagram</h4>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                Describe the schema or entities you need. The AI agent will perform operations sequentially to draw tables and map references directly on your board.
              </p>
              <div className="text-[9px] bg-slate-950/40 text-slate-500 rounded p-2 font-mono border border-white/5 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 block">Try prompts like:</span>
                <div>• "Create a blog application with users, posts, and comments"</div>
                <div>• "Design a retail product catalog system with categories"</div>
              </div>
            </div>
          </div>
        )}

        {/* Errors view */}
        {errorMsg && (
          <div className="p-2 border border-red-950 bg-red-950/20 text-red-400 rounded-lg text-[10px] flex items-start gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Input panel at bottom */}
        <div className="border-t border-slate-900 pt-3 mt-auto bg-[#0c0c0e]">
          {activeTab === "chat" ? (
            <form onSubmit={handleSendChat} className="flex gap-1.5 items-center">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isLoading}
                placeholder="Ask about this schema, convert to ORMs..."
                className="flex-1 bg-slate-950/60 border border-slate-800 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-650 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isLoading || !chatInput.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg p-2 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleGenerateDiagram} className="flex flex-col gap-2">
              <textarea
                value={generateInput}
                onChange={(e) => setGenerateInput(e.target.value)}
                disabled={isLoading}
                placeholder="Describe your database schema layout in detail..."
                rows={3}
                className="bg-slate-950/60 border border-slate-800 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-650 disabled:opacity-50 resize-none font-sans"
              />
              <button
                type="submit"
                disabled={isLoading || !generateInput.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-2 px-3 text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Play className="h-3 w-3 fill-current" />
                Generate Schema Elements
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
