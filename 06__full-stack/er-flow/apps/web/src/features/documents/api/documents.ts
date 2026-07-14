import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { documentsApi, foldersApi } from "@eraser/api-client";

// Documents Hooks
export const useDocuments = (workspaceId: string, folderId?: string | null) => {
  return useQuery({
    queryKey: ["documents", workspaceId, folderId],
    queryFn: () => documentsApi.list(workspaceId, folderId),
    enabled: !!workspaceId,
  });
};

export const useDocument = (documentId: string) => {
  return useQuery({
    queryKey: ["document", documentId],
    queryFn: () => documentsApi.get(documentId),
    enabled: !!documentId,
  });
};

export const useFolders = (workspaceId: string) => {
  return useQuery({
    queryKey: ["folders", workspaceId],
    queryFn: () => foldersApi.list(workspaceId),
    enabled: !!workspaceId,
  });
};

export const useSnapshots = (documentId: string) => {
  return useQuery({
    queryKey: ["snapshots", documentId],
    queryFn: () => documentsApi.listSnapshots(documentId),
    enabled: !!documentId,
  });
};

// Document Mutations
export const useCreateDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: documentsApi.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["documents", variables.workspaceId] });
    },
  });
};

export const useUpdateDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => documentsApi.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["document", data.id] });
      queryClient.invalidateQueries({ queryKey: ["documents", data.workspaceId] });
    },
  });
};

export const useArchiveDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: documentsApi.archive,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["document", data.id] });
      queryClient.invalidateQueries({ queryKey: ["documents", data.workspaceId] });
    },
  });
};

export const useRestoreDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: documentsApi.restore,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["document", data.id] });
      queryClient.invalidateQueries({ queryKey: ["documents", data.workspaceId] });
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; workspaceId: string }) => documentsApi.delete(vars.id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["documents", variables.workspaceId] });
    },
  });
};

// Folder Mutations
export const useCreateFolder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: foldersApi.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["folders", variables.workspaceId] });
    },
  });
};

export const useUpdateFolder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => foldersApi.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["folders", data.workspaceId] });
    },
  });
};

export const useDeleteFolder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; workspaceId: string }) => foldersApi.delete(vars.id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["folders", variables.workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["documents", variables.workspaceId] });
    },
  });
};

// Snapshot Mutations
export const useCreateSnapshot = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: documentsApi.createSnapshot,
    onSuccess: (_, documentId) => {
      queryClient.invalidateQueries({ queryKey: ["snapshots", documentId] });
    },
  });
};

export const useRestoreSnapshot = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, snapshotId }: { documentId: string; snapshotId: string }) =>
      documentsApi.restoreSnapshot(documentId, snapshotId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["document", data.id] });
      // Invalidate queries so collaborative client triggers a reload
      window.location.reload();
    },
  });
};
