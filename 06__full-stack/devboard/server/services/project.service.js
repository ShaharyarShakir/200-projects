import Project from "../models/project.model.js";
import Workspace from "../models/workspace.model.js";

/**
 * Create a new project within a workspace.
 * Validates that the creator has membership access to the target workspace.
 */
export const createProject = async (data, userId) => {
  const workspace = await Workspace.findOne({
    _id: data.workspace,
    "members.user": userId
  });

  if (!workspace) {
    const error = new Error("Workspace access denied");
    error.statusCode = 403;
    throw error;
  }

  const project = await Project.create({
    name: data.name,
    description: data.description,
    workspace: data.workspace,
    owner: userId,
    members: [
      {
        user: userId,
        role: "OWNER"
      }
    ]
  });

  return project;
};

/**
 * Get all projects in a workspace where the user is a member.
 */
export const getProjects = async (workspaceId, userId) => {
  return await Project.find({
    workspace: workspaceId,
    "members.user": userId
  }).populate("members.user", "name email avatar");
};

/**
 * Get a single project by ID if the user has membership access.
 */
export const getProject = async (id, userId) => {
  const project = await Project.findOne({
    _id: id,
    "members.user": userId
  }).populate("members.user", "name email avatar");

  if (!project) {
    const error = new Error("Project not found");
    error.statusCode = 404;
    throw error;
  }

  return project;
};

/**
 * Update project details. Only the project owner can update it.
 */
export const updateProject = async (id, data, userId) => {
  // Ensure the project exists and is owned by the user
  const checkProject = await Project.findOne({ _id: id });
  if (!checkProject) {
    const error = new Error("Project not found");
    error.statusCode = 404;
    throw error;
  }

  if (checkProject.owner.toString() !== userId.toString()) {
    const error = new Error("Not authorized to update this project");
    error.statusCode = 403;
    throw error;
  }

  const project = await Project.findOneAndUpdate(
    {
      _id: id,
      owner: userId
    },
    data,
    {
      new: true,
      runValidators: true
    }
  ).populate("members.user", "name email avatar");

  return project;
};

/**
 * Delete a project. Only the project owner can delete it.
 */
export const deleteProject = async (id, userId) => {
  // Ensure the project exists and is owned by the user
  const checkProject = await Project.findOne({ _id: id });
  if (!checkProject) {
    const error = new Error("Project not found");
    error.statusCode = 404;
    throw error;
  }

  if (checkProject.owner.toString() !== userId.toString()) {
    const error = new Error("Not authorized to delete this project");
    error.statusCode = 403;
    throw error;
  }

  return await Project.findOneAndDelete({
    _id: id,
    owner: userId
  });
};
