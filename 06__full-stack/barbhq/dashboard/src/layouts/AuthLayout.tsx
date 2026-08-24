import React from "react";
import authBanner from "../assets/auth_banner.png";
import { Scissors } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen w-full bg-background select-none">
      {/* Left side: Premium Image Banner (Desktop only) */}
      <div className="relative hidden w-1/2 lg:flex flex-col justify-between p-12 bg-black text-white overflow-hidden">
        {/* Background Image overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={authBanner}
            alt="Barber Shop Interior"
            className="h-full w-full object-cover opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/40 mix-blend-multiply" />
        </div>

        {/* Logo and Brand */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Scissors className="h-5.5 w-5.5 -rotate-45" />
          </div>
          <div>
            <h1 className="font-serif text-xl font-bold tracking-wider uppercase text-primary">
              BarbHQ
            </h1>
            <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground -mt-0.5">
              Shop Management
            </p>
          </div>
        </div>

        {/* Bottom luxury slogan */}
        <div className="relative z-10 max-w-md">
          <blockquote className="space-y-2">
            <p className="font-serif text-2xl font-medium italic leading-relaxed text-white/95">
              &ldquo;Craftsmanship is in the details. Elevating the grooming
              experience, one cut at a time.&rdquo;
            </p>
            <footer className="text-xs uppercase tracking-widest text-primary font-semibold">
              The BarbHQ Philosophy
            </footer>
          </blockquote>
        </div>
      </div>

      {/* Right side: Auth Form Shell */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12 md:p-20 bg-background/50">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile-only branding */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Scissors className="h-5 w-5 -rotate-45" />
            </div>
            <div className="text-left">
              <h1 className="font-serif text-lg font-bold tracking-wider uppercase text-primary leading-none">
                BarbHQ
              </h1>
              <p className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground mt-0.5">
                Shop Management
              </p>
            </div>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
