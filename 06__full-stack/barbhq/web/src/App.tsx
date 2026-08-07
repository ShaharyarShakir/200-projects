import { RouterProvider, createRouter } from "@tanstack/react-router";
import { GlobalProviders } from "./providers/GlobalProviders";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Create a new router instance
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function App() {
  console.count("App Render");
  return (
    <GlobalProviders>
      <RouterProvider router={router} />
    </GlobalProviders>
  );
}

export default App;
