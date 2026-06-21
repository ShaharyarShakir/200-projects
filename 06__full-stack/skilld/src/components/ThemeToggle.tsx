import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
	const [theme, setTheme] = useState<"light" | "dark" | null>(null);

	useEffect(() => {
		// Sync local state with the actual class present on document.documentElement
		const isDark = document.documentElement.classList.contains("dark");
		setTheme(isDark ? "dark" : "light");
	}, []);

	const toggleTheme = () => {
		if (!theme) return;
		const nextTheme = theme === "light" ? "dark" : "light";
		setTheme(nextTheme);
		localStorage.setItem("theme", nextTheme);
		if (nextTheme === "dark") {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}
	};

	// Return a placeholder of matching size to prevent layout shifts during hydration
	if (!theme) {
		return (
			<div className="theme-toggle-btn opacity-50 cursor-not-allowed">
				<div className="w-4 h-4" />
			</div>
		);
	}

	return (
		<button
			type="button"
			onClick={toggleTheme}
			className="theme-toggle-btn"
			aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
		>
			{theme === "light" ? (
				<Moon className="w-4 h-4 text-text-muted hover:text-foreground transition-all duration-300" />
			) : (
				<Sun className="w-4 h-4 text-text-muted hover:text-foreground transition-all duration-300" />
			)}
		</button>
	);
}
