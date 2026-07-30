import Task from "../models/task.model.js";

/**
 * Create a new task.
 */
export const createTask = async (data, userId) => {
  // Ensure assignedTo is set to undefined if not provided or empty string
  const assignedTo = data.assignedTo && data.assignedTo !== "" ? data.assignedTo : undefined;

  const task = await Task.create({
    title: data.title,
    description: data.description || "",
    project: data.project,
    assignedTo,
    priority: data.priority || "MEDIUM",
    labels: data.labels || [],
    dueDate: data.dueDate || undefined,
    createdBy: userId
  });

  return await Task.findById(task._id).populate("assignedTo", "name email avatar");
};

/**
 * Get all tasks for a project.
 */
export const getProjectTasks = async (projectId) => {
  return await Task.find({
    project: projectId
  })
    .populate("assignedTo", "name email avatar")
    .sort({
      createdAt: -1
    });
};

/**
 * Update task details (e.g., status, priority, description, assignee).
 */
export const updateTask = async (id, data) => {
  // Handle assignedTo conversion if passed
  if (data.hasOwnProperty("assignedTo")) {
    if (!data.assignedTo || data.assignedTo === "") {
      data.assignedTo = null; // Unassign user
    }
  }

  return await Task.findByIdAndUpdate(
    id,
    data,
    {
      new: true,
      runValidators: true
    }
  ).populate("assignedTo", "name email avatar");
};

/**
 * Delete a task.
 */
export const deleteTask = async (id) => {
  return await Task.findByIdAndDelete(id);
};
