import {
    Home,
    FolderGit2,
    Bug,
    GitPullRequest,
    ChartColumn,
    User,
    Settings
} from "lucide-svelte";

export const navigation = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: Home
    },
    {
        title: "Repositories",
        href: "/repositories",
        icon: FolderGit2
    },
    {
        title: "Issues",
        href: "/issues",
        icon: Bug
    },
    {
        title: "Pull Requests",
        href: "/pull-requests",
        icon: GitPullRequest
    },
    {
        title: "Analytics",
        href: "/analytics",
        icon: ChartColumn
    },
    {
        title: "Profile",
        href: "/profile",
        icon: User
    },
    {
        title: "Settings",
        href: "/settings",
        icon: Settings
    }
];