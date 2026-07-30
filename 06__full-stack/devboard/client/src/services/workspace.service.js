import api from "../api/axios";

export const createWorkspace = async (data) => {
  const response = await api.post("/workspaces", data);
  return response.data;
};

export const getWorkspaces = async () => {
  const response = await api.get("/workspaces");
  return response.data;
};
