import {
  createWorkspace,
  getUserWorkspaces,
  getWorkspaceById
} from "../services/workspace.service.js";

export const create = async (req, res, next) => {
  try {
    const workspace = await createWorkspace(req.body, req.user._id);
    res.status(201).json({
      success: true,
      workspace
    });
  } catch (error) {
    next(error);
  }
};

export const getAll = async (req, res, next) => {
  try {
    const workspaces = await getUserWorkspaces(req.user._id);
    res.json({
      success: true,
      workspaces
    });
  } catch (error) {
    next(error);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const workspace = await getWorkspaceById(req.params.id);
    res.json({
      success: true,
      workspace
    });
  } catch (error) {
    next(error);
  }
};
