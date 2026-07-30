import { useState } from "react";
import { useAuthStore } from "../store/authStore";
import useWorkspaceStore from "../store/workspace.store";
import { addProjectMember, removeProjectMember, updateProjectMemberRole } from "../services/projectMember.service";
import Avatar from "./ui/Avatar";
import Button from "./ui/Button";
import Card from "./ui/Card";
import toast from "react-hot-toast";
import { Users, Plus, X, UserMinus, ShieldAlert } from "lucide-react";

export default function TeamMembers({ project, onUpdate }) {
  const user = useAuthStore((state) => state.user);
  const { currentWorkspace } = useWorkspaceStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("MEMBER");
  const [loading, setLoading] = useState(false);

  const isOwner = user && project.owner && (project.owner._id === user._id || project.owner === user._id);
  const requesterMember = project.members?.find(m => m.user?._id === user?._id || m.user === user?._id);
  const isAuthorized = isOwner || (requesterMember && ["OWNER", "ADMIN"].includes(requesterMember.role));

  // Find workspace members who are NOT already in this project
  const availableWorkspaceMembers = currentWorkspace?.members?.filter(
    wsMember => wsMember.user && !project.members?.some(pMember => pMember.user?._id === wsMember.user?._id)
  ) || [];

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedEmail) {
      toast.error("Please select a member to add");
      return;
    }

    setLoading(true);
    try {
      const response = await addProjectMember(project._id, selectedEmail, selectedRole);
      if (response && response.success) {
        toast.success("Member added to project successfully!");
        setSelectedEmail("");
        setSelectedRole("MEMBER");
        setShowAddForm(false);
        onUpdate();
      }
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.error || error.response?.data?.message || "Failed to add member";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberUserId, memberName) => {
    const isSelf = memberUserId === user?._id;
    const confirmMsg = isSelf 
      ? "Are you sure you want to leave this project?" 
      : `Are you sure you want to remove ${memberName} from this project?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const response = await removeProjectMember(project._id, memberUserId);
      if (response && response.success) {
        toast.success(isSelf ? "You left the project" : "Member removed successfully");
        onUpdate();
      }
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.error || error.response?.data?.message || "Failed to remove member";
      toast.error(errMsg);
    }
  };

  const handleRoleChange = async (memberUserId, newRole) => {
    try {
      const response = await updateProjectMemberRole(project._id, memberUserId, newRole);
      if (response && response.success) {
        toast.success("Role updated successfully!");
        onUpdate();
      }
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.error || error.response?.data?.message || "Failed to update role";
      toast.error(errMsg);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      {/* Component Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-500" />
          <span>Project Team</span>
        </h3>
        <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-indigo-50/70 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-950/30">
          {project.members?.length || 0} Members
        </span>
      </div>

      {/* Inline Add Member Trigger */}
      {isAuthorized && !showAddForm && (
        <button
          onClick={() => {
            if (availableWorkspaceMembers.length === 0) {
              toast.error("All workspace members are already added to this project.");
              return;
            }
            setShowAddForm(true);
          }}
          className="mb-4 w-full flex items-center justify-center gap-1.5 py-2 px-3 border border-dashed border-indigo-200 dark:border-indigo-900/60 hover:border-indigo-500 rounded-xl text-xs font-semibold text-indigo-600 hover:text-white hover:bg-indigo-650 dark:text-indigo-400 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-305 transition cursor-pointer"
          type="button"
        >
          <Plus className="w-4 h-4" />
          <span>Add Team Member</span>
        </button>
      )}

      {/* Inline Add Member Form */}
      {showAddForm && (
        <form onSubmit={handleAddMember} className="p-3.5 mb-4 rounded-xl border border-indigo-105 bg-indigo-50/20 dark:border-indigo-950/30 dark:bg-indigo-950/10 space-y-3 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-350">Add Member from Workspace</span>
            <button 
              type="button" 
              onClick={() => setShowAddForm(false)} 
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2.5">
            <div>
              <label htmlFor="select-email" className="sr-only">Select Member</label>
              <select
                id="select-email"
                value={selectedEmail}
                onChange={(e) => setSelectedEmail(e.target.value)}
                required
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Select a workspace member...</option>
                {availableWorkspaceMembers.map((m) => (
                  <option key={m.user._id} value={m.user.email}>
                    {m.user.name} ({m.user.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="select-role" className="sr-only">Select Role</label>
              <select
                id="select-role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
                <option value="VIEWER">Viewer</option>
              </select>

              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="py-1.5 px-3 text-xs font-semibold rounded-lg"
              >
                {loading ? "Adding..." : "Add"}
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Members List */}
      <div className="space-y-4 flex-1 overflow-y-auto max-h-[400px] pr-1">
        {project.members && project.members.length > 0 ? (
          project.members.map((member) => {
            const memberUser = member.user || {};
            const isMemberOwner = project.owner && (project.owner._id === memberUser._id || project.owner === memberUser._id);
            const isCurrentUser = memberUser._id === user?._id;

            return (
              <div 
                key={memberUser._id} 
                className="flex items-center justify-between gap-3 p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={memberUser.name} className="w-9 h-9 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                      <span>{memberUser.name || "Unknown User"}</span>
                      {isCurrentUser && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 rounded-sm">
                          You
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-450 truncate">
                      {memberUser.email || ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Role Selector or Badge */}
                  {isAuthorized && !isMemberOwner && !isCurrentUser ? (
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(memberUser._id, e.target.value)}
                      className="bg-transparent border border-slate-205 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 rounded-md px-1.5 py-0.5 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none"
                    >
                      <option value="MEMBER">Member</option>
                      <option value="ADMIN">Admin</option>
                      <option value="VIEWER">Viewer</option>
                    </select>
                  ) : (
                    <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-slate-100/80 text-slate-650 dark:bg-slate-800/40 dark:text-slate-400">
                      {isMemberOwner ? "OWNER" : member.role}
                    </span>
                  )}

                  {/* Actions (Leave or Remove) */}
                  {isAuthorized && !isMemberOwner && !isCurrentUser && (
                    <button
                      onClick={() => handleRemoveMember(memberUser._id, memberUser.name)}
                      className="p-1 rounded-lg text-slate-400 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer"
                      title="Remove Member"
                      type="button"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  )}

                  {isCurrentUser && !isMemberOwner && (
                    <button
                      onClick={() => handleRemoveMember(memberUser._id, memberUser.name)}
                      className="p-1 rounded-lg text-slate-400 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer"
                      title="Leave Project"
                      type="button"
                    >
                      <UserMinus className="w-4 h-4 text-red-500" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-sm text-slate-500 dark:text-slate-400">
            No team members listed.
          </div>
        )}
      </div>
    </Card>
  );
}
