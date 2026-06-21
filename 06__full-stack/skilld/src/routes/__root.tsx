import { ClerkProvider, useUser } from "@clerk/tanstack-react-start";
import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { useEffect } from "react";
import Crosshair from "#/components/Crosshair";
import Navbar from "#/components/Navbar";
import { insertUser } from "#/dataconnect-generated";
import { dataConnect } from "#/lib/firebase";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Skilld - The registry for agentic Intelligence",
			},
			{
				name: "description",
				content:
					"Discover, publish, and operate reusable agent capabilities from route-driven workspace",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	shellComponent: RootDocument,
	 notFoundComponent: () => (
    <div className="p-8">
      <h1>404 - Page Not Found</h1>
    </div>
  ),
});

function UserSync() {
	const { user, isSignedIn } = useUser();
	useEffect(() => {
		if (isSignedIn && user) {
			const email = user.primaryEmailAddress?.emailAddress || "";
			const username = user.username || user.firstName || "";
			const imageUrl = user.imageUrl;
			insertUser(dataConnect, {
				clerkId: user.id,
				email,
				username,
				imageUrl,
			}).catch((err) => {
				console.log("User sync status (could be already exists):", err);
			});
		}
	}, [isSignedIn, user]);
	return null;
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
				<script
					dangerouslySetInnerHTML={{
						__html: `
							(function() {
								try {
									const storedTheme = localStorage.getItem('theme');
									const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
									const theme = storedTheme || (systemPrefersDark ? 'dark' : 'light');
									if (theme === 'dark') {
										document.documentElement.classList.add('dark');
									} else {
										document.documentElement.classList.remove('dark');
									}
								} catch (e) {}
							})();
						`,
					}}
				/>
			</head>
			<body>
				<ClerkProvider>
					<UserSync />
					<div id="root-layout">
						<header>
							<div className="frame">
								<Navbar />
								<Crosshair />
								<Crosshair />
							</div>
						</header>

						<main>
							<div className="frame">{children}</div>
						</main>
					</div>

					<TanStackDevtools
						config={{
							position: "bottom-right",
						}}
						plugins={[
							{
								name: "Tanstack Router",
								render: <TanStackRouterDevtoolsPanel />,
							},
							TanStackQueryDevtools,
						]}
					/>
				</ClerkProvider>
				<Scripts />
			</body>
		</html>
	);
}
