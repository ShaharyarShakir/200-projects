import {
  createTask,
  getProjectTasks,
  updateTask,
  deleteTask
} from "../services/task.service.js";

/**
 * Controller to create a new task
 */
export const create = async (req, res, next) => {
  try {
    const task = await createTask(req.body, req.user._id);
    res.status(201).json({
      success: true,
      task
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to get all tasks for a project
 */
export const getAll = async (req, res, next) => {
  try {
    const tasks = await getProjectTasks(req.params.projectId);
    res.json({
      success: true,
      tasks
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to update task details
 */
export const update = async (req, res, next) => {
  try {
    const task = await updateTask(req.params.id, req.body);
    res.json({
      success: true,
      task
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to delete a task
 */
export const remove = async (req, res, next) => {
  try {
    await deleteTask(req.params.id);
    res.json({
      success: true,
      message: "Task deleted"
    });
  } catch (error) {
    next(error);
  }
};
