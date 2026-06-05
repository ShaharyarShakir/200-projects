import { Dumbbell } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { UserButton } from "@neondatabase/neon-js/auth/react";

export default function Navbar() {
  const { user } = useAuth();
  return (
    <header className="right-0 left-0 z-50 fixed bg-background/80 backdrop-blur-md border border-border border-b">
      <div className="flex justify-between items-center mx-auto px-6 max-w-6xl h-15">
        <Link to={"/"} className="flex items-center gap-2 text-foreground">
          <Dumbbell className="w-6 h-6 text-accent" />
          <span className="font-semibold text-lg">SymAI</span>
        </Link>
        <nav>
          {user ? (
            <>
              {" "}
              <Link to={"/profile"}>
                <Button size="sm" variant="ghost">
                  My Plan
                </Button>
              </Link>
              <UserButton className="bg-accent" size="icon" />
            </>
          ) : (
            <>
              <Link to={"/auth/sign-in"}>
                <Button size="sm" variant="ghost">
                  Sign In
                </Button>
              </Link>
              <Link to={"/auth/sign-up"}>
                <Button size="sm">Sign up</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
