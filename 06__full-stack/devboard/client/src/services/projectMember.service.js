import api from "../api/axios";

/**
 * Add a member to a project.
 * @param {string} projectId
 * @param {string} email
 * @param {string} role - "ADMIN" | "MEMBER" | "VIEWER"
 */
export const addProjectMember = async (projectId, email, role) => {
  const response = await api.post(`/projects/${projectId}/members`, { email, role });
  return response.data;
};

/**
 * Remove a member from a project.
 * @param {string} projectId
 * @param {string} userId
 */
export const removeProjectMember = async (projectId, userId) => {
  const response = await api.delete(`/projects/${projectId}/members/${userId}`);
  return response.data;
};

/**
 * Update the role of a project member.
 * @param {string} projectId
 * @param {string} userId
 * @param {string} role - "ADMIN" | "MEMBER" | "VIEWER"
 */
export const updateProjectMemberRole = async (projectId, userId, role) => {
  const response = await api.patch(`/projects/${projectId}/members`, { userId, role });
  return response.data;
};

/**
 * Get project activity history.
 * @param {string} projectId
 */
export const getProjectActivities = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/activities`);
  return response.data;
};
