import {
  CompassIcon,
  HomeIcon,
  LoaderIcon,
  MenuIcon,
  SparkleIcon,
} from "lucide-react";
import Link from "next/link";
import React, { Suspense } from "react";
import { Button } from "../ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "../ui/sheet";
import {
  Show,
  SignInButton,
  SignUpButton,
} from "@clerk/nextjs";
import CustomUserButton from "./custom-user-button";

const Logo = () => {
  return (
    <Link href="/" className="group flex items-center gap-2">
      <div className="flex justify-center items-center bg-primary rounded-lg size-8">
        <SparkleIcon className="size-5 text-primary-foreground" />
      </div>

      <span className="font-bold text-lg sm:text-xl">
        i<span className="text-primary">Build</span>This
      </span>
    </Link>
  );
};

export default function Header() {
  return (
    <header className="top-0 z-50 sticky bg-background/95 supports-backdrop-filter:bg-background/60 backdrop-blur border-b">
      <div className="px-4 sm:px-6 lg:px-12 wrapper">
        <div className="flex justify-between items-center h-16">
          <Logo />

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className="flex items-center gap-2 hover:bg-muted/50 px-3 py-2 rounded-md font-medium text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              <HomeIcon className="size-4" />
              <span>Home</span>
            </Link>

            <Link
              href="/explore"
              className="flex items-center gap-2 hover:bg-muted/50 px-3 py-2 rounded-md font-medium text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              <CompassIcon className="size-4" />
              <span>Explore</span>
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Suspense
              fallback={<LoaderIcon className="size-4 animate-spin" />}
            >
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <Button variant="ghost">Sign In</Button>
                </SignInButton>

                <SignUpButton mode="modal">
                  <Button>Sign Up</Button>
                </SignUpButton>
              </Show>

              <Show when="signed-in">
                <Button asChild>
                  <Link href="/submit">
                    <SparkleIcon className="size-4" />
                    Submit Project
                  </Link>
                </Button>

                <CustomUserButton />
              </Show>
            </Suspense>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MenuIcon className="size-5" />
                </Button>
              </SheetTrigger>

              <SheetContent side="right" className="w-70">
                <div className="flex flex-col gap-4 mt-8">
                  <Link
                    href="/"
                    className="flex items-center gap-2 hover:bg-muted px-3 py-2 rounded-md"
                  >
                    <HomeIcon className="size-4" />
                    Home
                  </Link>

                  <Link
                    href="/explore"
                    className="flex items-center gap-2 hover:bg-muted px-3 py-2 rounded-md"
                  >
                    <CompassIcon className="size-4" />
                    Explore
                  </Link>

                  <Suspense
                    fallback={
                      <div className="flex justify-center py-4">
                        <LoaderIcon className="size-5 animate-spin" />
                      </div>
                    }
                  >
                    <Show when="signed-out">
                      <div className="flex flex-col gap-2 mt-4">
                        <SignInButton mode="modal">
                          <Button
                            variant="outline"
                            className="w-full"
                          >
                            Sign In
                          </Button>
                        </SignInButton>

                        <SignUpButton mode="modal">
                          <Button className="w-full">
                            Sign Up
                          </Button>
                        </SignUpButton>
                      </div>
                    </Show>

                    <Show when="signed-in">
                      <div className="flex flex-col gap-3 mt-4">
                        <Button asChild className="w-full">
                          <Link href="/submit">
                            <SparkleIcon className="size-4" />
                            Submit Project
                          </Link>
                        </Button>

                        <div className="flex justify-center">
                          <CustomUserButton />
                        </div>
                      </div>
                    </Show>
                  </Suspense>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}