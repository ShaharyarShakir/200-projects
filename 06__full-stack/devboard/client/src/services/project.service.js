import api from "../api/axios";

/**
 * Create a new project.
 * @param {Object} data - { name, description, workspace }
 */
export const createProject = async (data) => {
  const response = await api.post("/projects", data);
  return response.data;
};

/**
 * Get all projects in a workspace.
 * @param {string} workspaceId
 */
export const getProjects = async (workspaceId) => {
  const response = await api.get(`/projects/workspace/${workspaceId}`);
  return response.data;
};

/**
 * Get a single project.
 * @param {string} projectId
 */
export const getProject = async (projectId) => {
  const response = await api.get(`/projects/${projectId}`);
  return response.data;
};

/**
 * Update a project's details (restricted to owner).
 * @param {string} projectId
 * @param {Object} data - { name, description, status }
 */
export const updateProject = async (projectId, data) => {
  const response = await api.put(`/projects/${projectId}`, data);
  return response.data;
};

/**
 * Delete a project (restricted to owner).
 * @param {string} projectId
 */
export const deleteProject = async (projectId) => {
  const response = await api.delete(`/projects/${projectId}`);
  return response.data;
};
