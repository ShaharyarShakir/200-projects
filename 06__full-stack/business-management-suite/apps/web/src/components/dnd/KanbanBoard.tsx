import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useState } from 'react';
import { DroppableColumn } from './DroppableColumn';
import { DraggableCard } from './DraggableCard';

export interface KanbanItem {
  id: string;
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  assignee?: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  items: KanbanItem[];
}

interface KanbanBoardProps {
  columns: KanbanColumn[];
  onItemMove: (itemId: string, fromColumn: string, toColumn: string) => void;
}

export function KanbanBoard({ columns, onItemMove }: KanbanBoardProps) {
  const [activeItem, setActiveItem] = useState<KanbanItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findColumn = (itemId: string) =>
    columns.find((col) => col.items.some((item) => item.id === itemId));

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const item = columns
      .flatMap((col) => col.items)
      .find((i) => i.id === active.id);
    setActiveItem(item ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);

    if (!over) return;

    const fromColumn = findColumn(active.id as string);
    const toColumn = columns.find((col) => col.id === over.id)
      ?? findColumn(over.id as string);

    if (!fromColumn || !toColumn || fromColumn.id === toColumn.id) return;

    onItemMove(active.id as string, fromColumn.id, toColumn.id);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <SortableContext
            key={column.id}
            items={column.items.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <DroppableColumn column={column} />
          </SortableContext>
        ))}
      </div>
      <DragOverlay>
        {activeItem ? <DraggableCard item={activeItem} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
