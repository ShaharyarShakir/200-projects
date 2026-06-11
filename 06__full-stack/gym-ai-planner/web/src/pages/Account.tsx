import { AccountView } from "@neondatabase/neon-js/auth/react";
import { useParams } from "react-router-dom";

export default function Account() {
  const { pathname } = useParams();
  return (
    <div className="px-6 pt-24 pb-12 min-h-screen">
      <div className="mx-auto max-w-4xl">
        <AccountView pathname={pathname} />
      </div>
    </div>
  );
}