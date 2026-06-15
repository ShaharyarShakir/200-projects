import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    ArrowRightIcon,
    EyeIcon,
    RocketIcon,
    SparklesIcon,
    UsersIcon,
} from "lucide-react";
import Link from "next/link";
import StatsCard from "./stats-card";

const LiveBadge = () => {
    return (
        <Badge
            variant="outline"
            className="backdrop-blur-sm mb-8 px-4 py-2 text-sm"
        >
            <span className="relative flex w-2 h-2">
                <span className="inline-flex absolute bg-primary opacity-75 rounded-full w-full h-full animate-ping" />
                <span className="inline-flex relative bg-primary rounded-full w-2 h-2" />
            </span>
            <span className="text-muted-foreground">
                Join thousands of creators sharing their work
            </span>
        </Badge>
    );
};

const statsData = [
    {
        icon: RocketIcon,
        value: "2.5K+",
        label: "Projects Shared",
    },
    {
        icon: UsersIcon,
        value: "10K+",
        label: "Active Creators",
        hasBorder: true,
    },
    {
        icon: EyeIcon,
        value: "50K+",
        label: "Monthly Visitors",
    },
];

export default function HeroSection() {
    return (
        <section className="relative bg-linear-to-b from-background via-background to-muted/20 overflow-hidden">
            <div className="wrapper">
                <div className="flex flex-col justify-center items-center py-12 lg:py-24 text-center">
                    <LiveBadge />
                    <h1 className="mb-6 max-w-5xl font-bold text-5xl sm:text-6xl lg:text-7xl tracking-tight">
                        Share What You&apos;ve Built, Discover What&apos;s Launching
                    </h1>
                    <p className="mb-10 max-w-2xl text-muted-foreground text-lg sm:text-xl leading-relaxed">
                        A community platform for creators to showcase their apps, AI tools,
                        SaaS products, and creative projects. Authentic launches, real
                        builders, genuine feedback.
                    </p>
                    <div className="flex sm:flex-row flex-col gap-4 mb-16">
                        <Button asChild size="lg" className="shadow-lg px-8 text-base">
                            <Link href="/submit">
                                <SparklesIcon className="size-5" />
                                Share Your Project
                            </Link>
                        </Button>
                        <Button
                            asChild
                            size="lg"
                            className="shadow-lg px-8 text-base"
                            variant="secondary"
                        >
                            <Link href="/explore">
                                Explore Projects <ArrowRightIcon className="size-5" />
                            </Link>
                        </Button>
                    </div>

                    <div className="gap-8 sm:gap-12 grid grid-cols-1 sm:grid-cols-3 w-full max-w-2xl">
                        {statsData.map((stat) => (
                            <StatsCard key={stat.label} {...stat} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}