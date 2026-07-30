import TaskColumn from "./TaskColumn";

const COLUMNS = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];

export default function KanbanBoard({ tasks = [], onStatusChange, onDelete }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {COLUMNS.map((column) => {
        // Filter tasks for the current column
        const columnTasks = tasks.filter((task) => task.status === column);
        return (
          <TaskColumn
            key={column}
            title={column}
            tasks={columnTasks}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
          />
        );
      })}
    </div>
  );
}
