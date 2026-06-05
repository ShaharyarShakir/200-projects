import { AuthView } from "@neondatabase/neon-js/auth/react";
import { useParams } from "react-router-dom";

export default function Auth() {
  const { pathname } = useParams();
  return (
    <div className="flex justify-center items-center px-6 pt-24 pb-12 min-h-screen">
      <div className="w-full max-w-md">
        <AuthView pathname={pathname} />
      </div>
    </div>
  );
}
