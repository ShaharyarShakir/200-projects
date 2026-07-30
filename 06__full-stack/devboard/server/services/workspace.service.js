import Workspace from "../models/workspace.model.js";

export const createWorkspace = async (data, userId) => {
  const workspace = await Workspace.create({
    name: data.name,
    description: data.description || "",
    owner: userId,
    members: [
      {
        user: userId,
        role: "OWNER"
      }
    ]
  });
  return workspace;
};

export const getUserWorkspaces = async (userId) => {
  return await Workspace.find({
    "members.user": userId
  }).populate("members.user", "name email avatar");
};

export const getWorkspaceById = async (id) => {
  return await Workspace.findById(id).populate("members.user", "name email avatar");
};
