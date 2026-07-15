import {
  DiagramPlugin,
  NodeDefinition,
  EdgeDefinition,
  PropertyEditorDefinition,
  ValidationRule,
  ToolbarEntry,
  DiagramTemplate,
  Importer,
  Exporter,
} from "../types/plugin";

export class DiagramRegistry {
  private plugins = new Map<string, DiagramPlugin>();
  private nodeDefs = new Map<string, NodeDefinition>();
  private edgeDefs = new Map<string, EdgeDefinition>();
  private propertyEditors = new Map<string, PropertyEditorDefinition>();
  private validationRules: ValidationRule[] = [];
  private toolbarEntries: ToolbarEntry[] = [];
  private templates = new Map<string, DiagramTemplate>();
  private importers = new Map<string, Importer>();
  private exporters = new Map<string, Exporter>();

  public registerPlugin(plugin: DiagramPlugin): void {
    if (this.plugins.has(plugin.id)) return;
    this.plugins.set(plugin.id, plugin);

    // Register node types
    for (const nodeDef of plugin.nodeTypes) {
      this.nodeDefs.set(nodeDef.type, nodeDef);
    }

    // Register edge types
    if (plugin.edgeTypes) {
      for (const edgeDef of plugin.edgeTypes) {
        this.edgeDefs.set(edgeDef.type, edgeDef);
      }
    }

    // Register property editors
    if (plugin.propertyEditors) {
      for (const pe of plugin.propertyEditors) {
        this.propertyEditors.set(pe.type, pe);
      }
    }

    // Register validation rules
    if (plugin.validationRules) {
      this.validationRules.push(...plugin.validationRules);
    }

    // Register toolbar entries
    if (plugin.toolbarEntries) {
      this.toolbarEntries.push(...plugin.toolbarEntries);
    }

    // Register templates
    if (plugin.templates) {
      for (const temp of plugin.templates) {
        this.templates.set(temp.id, temp);
      }
    }

    // Register importers
    if (plugin.importers) {
      for (const imp of plugin.importers) {
        this.importers.set(imp.id, imp);
      }
    }

    // Register exporters
    if (plugin.exporters) {
      for (const exp of plugin.exporters) {
        this.exporters.set(exp.id, exp);
      }
    }
  }

  public getPlugins(): DiagramPlugin[] {
    return Array.from(this.plugins.values());
  }

  public getNodeDefinition(type: string): NodeDefinition | undefined {
    return this.nodeDefs.get(type);
  }

  public getEdgeDefinition(type: string): EdgeDefinition | undefined {
    return this.edgeDefs.get(type);
  }

  public getPropertyEditor(type: string): PropertyEditorDefinition | undefined {
    return this.propertyEditors.get(type);
  }

  public getValidationRules(): ValidationRule[] {
    return this.validationRules;
  }

  public getToolbarEntries(): ToolbarEntry[] {
    return this.toolbarEntries;
  }

  public getTemplates(): DiagramTemplate[] {
    return Array.from(this.templates.values());
  }

  public getTemplate(id: string): DiagramTemplate | undefined {
    return this.templates.get(id);
  }

  public getImporters(): Importer[] {
    return Array.from(this.importers.values());
  }

  public getExporters(): Exporter[] {
    return Array.from(this.exporters.values());
  }
}
export default DiagramRegistry;
