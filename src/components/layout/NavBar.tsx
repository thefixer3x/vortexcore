
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebar } from "@/contexts/SidebarContext";
import { NavBarBrand } from "./NavBarBrand";
import { NavBarMobileMenu } from "./NavBarMobileMenu";
import { VortexAISearch } from "@/components/ai/VortexAISearch"; // Directly import search
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  const { sidebarOpen } = useSidebar();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isDashboardRoute = location.pathname !== "/" && location.pathname !== "/ecosystem";

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-background/80 backdrop-blur-md shadow-sm" : "bg-transparent"
      }`}
    >
      <div className={`flex items-center justify-between px-4 h-16 ${
        isDashboardRoute && sidebarOpen && !isMobile ? "md:ml-[280px]" : ""
      }`}>
        <div className="flex items-center gap-3">
          {isDashboardRoute && <NavBarMobileMenu />}
          <NavBarBrand />
        </div>

        {/* On mobile dashboard: only show search; On desktop: regular nav */}
        {isDashboardRoute && isMobile ? (
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <VortexAISearch />
          </div>
        ) : (
          // Hide NavBarLinks and NavBarActions on mobile dashboard, but show them elsewhere
          <>
            {isDashboardRoute && !isMobile && (
              <>
                {/* Desktop: no navBarLinks, only search as agreed */}
                <div className="flex items-center gap-4">
                  <LanguageSwitcher />
                  <VortexAISearch />
                </div>
              </>
            )}
            {!isDashboardRoute && (
              <div className="flex items-center gap-4">
                <LanguageSwitcher />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
