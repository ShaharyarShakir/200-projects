"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/useAuth";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { MetricsBanner } from "@/components/landing/MetricsBanner";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { CtaBanner } from "@/components/landing/CtaBanner";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function Home() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const router = useRouter();

  // Instant redirect to /workspace when logged in
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/workspace");
    }
  }, [isAuthenticated, isLoading, router]);

  // Loading state while checking auth token
  if (isLoading || isAuthenticated) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#090d16] p-6 text-slate-100">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="mt-3 text-sm text-slate-400 font-mono">
          Connecting to Bisect Workspace...
        </p>
      </main>
    );
  }

  // Unauthenticated Visitor Landing Page
  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 selection:bg-blue-600 selection:text-white flex flex-col justify-between">
      <LandingNavbar onSignIn={login} />
      <main className="flex-1">
        <HeroSection />
        <MetricsBanner />
        <FeatureGrid />
        <HowItWorksSection />
        <TestimonialsSection />
        <CtaBanner />
      </main>
      <LandingFooter />
    </div>
  );
}
