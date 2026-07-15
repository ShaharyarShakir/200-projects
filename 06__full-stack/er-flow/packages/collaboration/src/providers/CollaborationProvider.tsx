import { createContext, useContext, useEffect, useState } from "react";
import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";

interface CollaborationContextType {
  provider: HocuspocusProvider | null;
  doc: Y.Doc | null;
  status: "connecting" | "connected" | "disconnected";
  awareness: any;
}

const CollaborationContext = createContext<CollaborationContextType>({
  provider: null,
  doc: null,
  status: "disconnected",
  awareness: null,
});

interface CollaborationProviderProps {
  url: string;
  documentName: string;
  token?: string;
  children: React.ReactNode;
}

export const CollaborationProvider: React.FC<CollaborationProviderProps> = ({
  url,
  documentName,
  token,
  children,
}) => {
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [doc, setDoc] = useState<Y.Doc | null>(null);
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected");
  const [awareness, setAwareness] = useState<any>(null);

  useEffect(() => {
    const ydoc = new Y.Doc();

    const hocuspocusProvider = new HocuspocusProvider({
      url,
      name: documentName,
      document: ydoc,
      token,
      onStatus: ({ status }) => setStatus(status),
    });

    setDoc(ydoc);
    setProvider(hocuspocusProvider);
    setAwareness(hocuspocusProvider.awareness);

    return () => {
      hocuspocusProvider.destroy();
      ydoc.destroy();
    };
  }, [url, documentName, token]);

  return (
    <CollaborationContext.Provider value={{ provider, doc, status, awareness }}>
      {children}
    </CollaborationContext.Provider>
  );
};

export const useCollaboration = () => useContext(CollaborationContext);
