import {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject
} from "../services/project.service.js";
import {
  addMember,
  removeMember,
  updateRole,
  getProjectActivities
} from "../services/projectMember.service.js";

/**
 * Controller to create a new project
 */
export const create = async (req, res, next) => {
  try {
    const project = await createProject(req.body, req.user._id);
    res.status(201).json({
      success: true,
      project
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to retrieve all projects within a specific workspace for a user
 */
export const getAll = async (req, res, next) => {
  try {
    const projects = await getProjects(req.params.workspaceId, req.user._id);
    res.json({
      success: true,
      projects
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to retrieve a single project by its ID
 */
export const getOne = async (req, res, next) => {
  try {
    const project = await getProject(req.params.id, req.user._id);
    res.json({
      success: true,
      project
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to update a project. Restricted to owners.
 */
export const update = async (req, res, next) => {
  try {
    const project = await updateProject(req.params.id, req.body, req.user._id);
    res.json({
      success: true,
      project
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to delete a project. Restricted to owners.
 */
export const remove = async (req, res, next) => {
  try {
    await deleteProject(req.params.id, req.user._id);
    res.json({
      success: true,
      message: "Project deleted"
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to add a member to the project.
 */
export const addProjectMember = async (req, res, next) => {
  try {
    const project = await addMember(
      req.params.id,
      req.body.email,
      req.body.role,
      req.user._id
    );
    res.json({
      success: true,
      project
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to remove a member from the project.
 */
export const removeProjectMember = async (req, res, next) => {
  try {
    const project = await removeMember(
      req.params.id,
      req.params.userId,
      req.user._id
    );
    res.json({
      success: true,
      project
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to update a project member's role.
 */
export const updateProjectMemberRole = async (req, res, next) => {
  try {
    const project = await updateRole(
      req.params.id,
      req.body.userId,
      req.body.role,
      req.user._id
    );
    res.json({
      success: true,
      project
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to retrieve project activities.
 */
export const getActivities = async (req, res, next) => {
  try {
    const activities = await getProjectActivities(req.params.id, req.user._id);
    res.json({
      success: true,
      activities
    });
  } catch (error) {
    next(error);
  }
};
