import { useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import AppRoutes from "./routes/AppRoutes";
import { Toaster } from "react-hot-toast";
import useThemeStore from "./store/theme.store";

function App() {
  const { checkSession } = useAuth();
  const dark = useThemeStore((state) => state.dark);

  useEffect(() => {
    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [dark]);

  return (
    <>
      <AppRoutes />
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: "var(--code-bg)",
            color: "var(--text-h)",
            border: "1px solid var(--border)",
            fontFamily: "var(--sans)",
          },
        }}
      />
    </>
  );
}

export default App;
