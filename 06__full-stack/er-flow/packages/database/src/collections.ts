import { z } from "zod";

export const COLLECTIONS = {
  USERS: "user",
  SESSIONS: "session",
  ACCOUNTS: "account",
  VERIFICATIONS: "verification",
  WORKSPACES: "workspaces",
  WORKSPACE_MEMBERS: "workspaceMembers",
  DOCUMENTS: "documents",
  PAGES: "pages",
  WHITEBOARDS: "whiteboards",
  SHAPES: "shapes",
  COMMENTS: "comments",
  NOTIFICATIONS: "notifications",
} as const;

export const UserDbSchema = z.object({
  _id: z.string(),
  name: z.string(),
  email: z.string().email(),
  emailVerified: z.boolean().optional(),
  image: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type UserDb = z.infer<typeof UserDbSchema>;

export const WorkspaceDbSchema = z.object({
  _id: z.string(),
  name: z.string(),
  slug: z.string(),
  ownerId: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type WorkspaceDb = z.infer<typeof WorkspaceDbSchema>;

export const DocumentDbSchema = z.object({
  _id: z.string(),
  organizationId: z.string().optional(),
  workspaceId: z.string(),
  folderId: z.string().nullable().optional(),
  title: z.string(),
  slug: z.string(),
  icon: z.string().nullable().optional(),
  cover: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  createdBy: z.string(),
  updatedBy: z.string(),
  visibility: z.enum(["workspace", "private", "public"]).default("workspace"),
  isArchived: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type DocumentDb = z.infer<typeof DocumentDbSchema>;

export const FolderDbSchema = z.object({
  _id: z.string(),
  workspaceId: z.string(),
  parentId: z.string().nullable().optional(),
  name: z.string(),
  icon: z.string().nullable().optional(),
  order: z.number().default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type FolderDb = z.infer<typeof FolderDbSchema>;

export const DocumentSnapshotDbSchema = z.object({
  _id: z.string(),
  documentId: z.string(),
  creatorId: z.string(),
  createdAt: z.date(),
  yjsSnapshot: z.any(),
});

export type DocumentSnapshotDb = z.infer<typeof DocumentSnapshotDbSchema>;
