import api from "../api/axios";

/**
 * Create a new task.
 * @param {Object} data - { title, description, project, assignedTo, priority, labels, dueDate }
 */
export const createTask = async (data) => {
  const response = await api.post("/tasks", data);
  return response.data;
};

/**
 * Get all tasks for a project.
 * @param {string} projectId
 */
export const getTasks = async (projectId) => {
  const response = await api.get(`/tasks/project/${projectId}`);
  return response.data;
};

/**
 * Update task details (e.g. status, assignment, details).
 * @param {string} id
 * @param {Object} data
 */
export const updateTask = async (id, data) => {
  const response = await api.patch(`/tasks/${id}`, data);
  return response.data;
};

/**
 * Delete a task.
 * @param {string} id
 */
export const deleteTask = async (id) => {
  const response = await api.delete(`/tasks/${id}`);
  return response.data;
};
