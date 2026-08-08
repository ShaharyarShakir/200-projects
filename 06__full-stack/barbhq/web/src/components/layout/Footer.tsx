import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-border/30 py-4 mt-auto text-center text-[11px] sm:text-xs text-muted-foreground select-none">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>
          &copy; {new Date().getFullYear()} BarbHQ Console. All rights reserved.
        </span>
        <span className="font-semibold text-primary/80">
          Premium Barbershop Management Shell
        </span>
      </div>
    </footer>
  );
};
export default Footer;
