import Project from "../models/project.model.js";
import Workspace from "../models/workspace.model.js";
import User from "../models/user.model.js";
import Activity from "../models/activity.model.js";

/**
 * Add a member to a project.
 * Restricts additions to users who are members of the parent workspace.
 * Requires requester to be project OWNER or ADMIN.
 */
export const addMember = async (projectId, email, role, currentUserId) => {
  const project = await Project.findById(projectId);
  if (!project) {
    const error = new Error("Project not found");
    error.statusCode = 404;
    throw error;
  }

  // Check authorization: Owner or Admin
  const isOwner = project.owner.toString() === currentUserId.toString();
  const requesterMember = project.members.find(m => m.user.toString() === currentUserId.toString());
  const isAuthorized = isOwner || (requesterMember && ["OWNER", "ADMIN"].includes(requesterMember.role));

  if (!isAuthorized) {
    const error = new Error("Not authorized to manage project members");
    error.statusCode = 403;
    throw error;
  }

  // Find user to add by email
  const userToAdd = await User.findOne({ email });
  if (!userToAdd) {
    const error = new Error("User with this email does not exist");
    error.statusCode = 404;
    throw error;
  }

  // Verify workspace membership
  const workspace = await Workspace.findOne({
    _id: project.workspace,
    "members.user": userToAdd._id
  });

  if (!workspace) {
    const error = new Error("User must be a member of the parent workspace before joining the project");
    error.statusCode = 400;
    throw error;
  }

  // Verify if already a member
  const alreadyMember = project.members.some(
    m => m.user.toString() === userToAdd._id.toString()
  );

  if (alreadyMember) {
    const error = new Error("User is already a member of this project");
    error.statusCode = 400;
    throw error;
  }

  // Add member
  project.members.push({
    user: userToAdd._id,
    role: role || "MEMBER"
  });

  await project.save();

  // Log activity
  await Activity.create({
    project: projectId,
    user: currentUserId,
    action: "MEMBER_ADDED",
    description: `Added ${userToAdd.name} to the project as a ${role || "MEMBER"}`
  });

  return await Project.findById(projectId).populate("members.user", "name email avatar");
};

/**
 * Remove a member from a project.
 * Allows self-removal (leaving) or deletion by OWNER/ADMIN.
 */
export const removeMember = async (projectId, userIdToRemove, currentUserId) => {
  const project = await Project.findById(projectId);
  if (!project) {
    const error = new Error("Project not found");
    error.statusCode = 404;
    throw error;
  }

  const isSelf = userIdToRemove.toString() === currentUserId.toString();
  const isOwner = project.owner.toString() === currentUserId.toString();
  const requesterMember = project.members.find(m => m.user.toString() === currentUserId.toString());
  const isAuthorized = isSelf || isOwner || (requesterMember && ["OWNER", "ADMIN"].includes(requesterMember.role));

  if (!isAuthorized) {
    const error = new Error("Not authorized to remove project members");
    error.statusCode = 403;
    throw error;
  }

  // Owner cannot be removed
  if (userIdToRemove.toString() === project.owner.toString()) {
    const error = new Error("Cannot remove the project owner");
    error.statusCode = 400;
    throw error;
  }

  // Check if member exists
  const memberIndex = project.members.findIndex(
    m => m.user.toString() === userIdToRemove.toString()
  );

  if (memberIndex === -1) {
    const error = new Error("User is not a member of this project");
    error.statusCode = 404;
    throw error;
  }

  // Get user details for description
  const userToRemove = await User.findById(userIdToRemove);
  const userToRemoveName = userToRemove ? userToRemove.name : "Member";

  // Remove member
  project.members.splice(memberIndex, 1);
  await project.save();

  // Log activity
  await Activity.create({
    project: projectId,
    user: currentUserId,
    action: "MEMBER_REMOVED",
    description: isSelf 
      ? `Left the project` 
      : `Removed ${userToRemoveName} from the project`
  });

  return await Project.findById(projectId).populate("members.user", "name email avatar");
};

/**
 * Update member's role.
 * Requires requester to be project OWNER or ADMIN.
 */
export const updateRole = async (projectId, userIdToUpdate, role, currentUserId) => {
  const project = await Project.findById(projectId);
  if (!project) {
    const error = new Error("Project not found");
    error.statusCode = 404;
    throw error;
  }

  const isOwner = project.owner.toString() === currentUserId.toString();
  const requesterMember = project.members.find(m => m.user.toString() === currentUserId.toString());
  const isAuthorized = isOwner || (requesterMember && ["OWNER", "ADMIN"].includes(requesterMember.role));

  if (!isAuthorized) {
    const error = new Error("Not authorized to manage project roles");
    error.statusCode = 403;
    throw error;
  }

  // Owner's role cannot be updated
  if (userIdToUpdate.toString() === project.owner.toString()) {
    const error = new Error("Cannot change project owner role");
    error.statusCode = 400;
    throw error;
  }

  // Find member to update
  const member = project.members.find(
    m => m.user.toString() === userIdToUpdate.toString()
  );

  if (!member) {
    const error = new Error("User is not a member of this project");
    error.statusCode = 404;
    throw error;
  }

  // Update role
  const oldRole = member.role;
  member.role = role;
  await project.save();

  const userUpdated = await User.findById(userIdToUpdate);
  const userUpdatedName = userUpdated ? userUpdated.name : "Member";

  // Log activity
  await Activity.create({
    project: projectId,
    user: currentUserId,
    action: "ROLE_UPDATED",
    description: `Updated role of ${userUpdatedName} from ${oldRole} to ${role}`
  });

  return await Project.findById(projectId).populate("members.user", "name email avatar");
};

/**
 * Get project activity history
 */
export const getProjectActivities = async (projectId, userId) => {
  // Validate workspace/project access
  const project = await Project.findOne({
    _id: projectId,
    "members.user": userId
  });

  if (!project) {
    const error = new Error("Project access denied or not found");
    error.statusCode = 403;
    throw error;
  }

  return await Activity.find({ project: projectId })
    .sort({ createdAt: -1 })
    .populate("user", "name email avatar");
};
