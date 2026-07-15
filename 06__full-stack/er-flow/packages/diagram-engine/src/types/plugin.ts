import React from "react";

export interface NodeDefinition<TNode = any> {
  type: string;
  label: string;
  icon?: any; // Component or icon name
  defaultWidth?: number;
  defaultHeight?: number;
  render: (props: {
    node: TNode;
    isSelected: boolean;
    isEditing: boolean;
    zoom: number;
    onChangeText?: (text: string) => void;
    onBlurText?: () => void;
  }) => React.ReactNode;
  createDefault: (id: string, x: number, y: number) => Partial<TNode>;
}

export interface EdgeDefinition<TEdge = any> {
  type: string;
  label: string;
  render?: (props: {
    edge: TEdge;
    sourceNode: any;
    targetNode: any;
    points: { x: number; y: number }[];
    isSelected: boolean;
  }) => React.ReactNode;
  createDefault: (id: string, source: string, target: string) => Partial<TEdge>;
}

export interface PropertyEditorProps<TElement = any> {
  element: TElement;
  updateElement: (props: Partial<TElement>) => void;
  allShapes: any[];
}

export interface PropertyEditorDefinition {
  type: string; // node or edge type
  component: React.ComponentType<PropertyEditorProps>;
}

export interface Diagnostic {
  id: string;
  severity: "error" | "warning" | "info";
  message: string;
  elementId?: string; // Node or edge ID
}

export interface ValidationRule {
  id: string;
  validate: (shapes: any[]) => Diagnostic[];
}

export interface ToolbarEntry {
  id: string;
  type: "node" | "edge" | "action";
  targetType: string;
  label: string;
  icon: any; // Lucide icon
  tooltip: string;
}

export interface DiagramTemplate {
  id: string;
  name: string;
  description: string;
  shapes: any[];
}

export interface Importer {
  id: string;
  name: string;
  fileExtensions: string[];
  importData: (content: string) => Promise<any[]>;
}

export interface Exporter {
  id: string;
  name: string;
  fileExtension: string;
  exportData: (shapes: any[]) => Promise<string | Blob>;
}

export interface DiagramPlugin {
  id: string;
  name: string;
  description: string;
  nodeTypes: NodeDefinition[];
  edgeTypes?: EdgeDefinition[];
  propertyEditors?: PropertyEditorDefinition[];
  validationRules?: ValidationRule[];
  toolbarEntries?: ToolbarEntry[];
  templates?: DiagramTemplate[];
  importers?: Importer[];
  exporters?: Exporter[];
}
