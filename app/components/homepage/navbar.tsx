"use client";
import { Menu, X, ArrowRight, Zap } from "lucide-react";
import React, { useCallback } from "react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const menuItems = [
  { name: "Features", href: "#features" },
  { name: "Solutions", href: "#solutions" },
  { name: "Results", href: "#results" },
  { name: "Pricing", href: "#pricing" },
];

export const Navbar = () => {
  const [menuState, setMenuState] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState("");

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
      
      // Update active section based on scroll position
      const sections = menuItems.map(item => item.href.substring(1));
      const currentSection = sections.find(section => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 120 && rect.bottom >= 120;
        }
        return false;
      });
      setActiveSection(currentSection || "");
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Enhanced detection for light sections
  const [isOverLightSection, setIsOverLightSection] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
      
      // Check ALL sections, not just menu items
      const allSections = ["hero", "problem", "solutions", "features", "ai", "results", "workflow", "security", "pricing"];
      
      // Update active section based on scroll position
      const menuSections = menuItems.map(item => item.href.substring(1));
      const currentMenuSection = menuSections.find(section => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 120 && rect.bottom >= 120;
        }
        return false;
      });
      setActiveSection(currentMenuSection || "");

      // Check if we're over ANY light section (including non-menu sections)
      const currentAnySection = allSections.find(section => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 120 && rect.bottom >= 120;
        }
        return false;
      });

      const explicitLightSections = ["problem", "security", "results"];
      
      if (explicitLightSections.includes(currentAnySection || "")) {
        setIsOverLightSection(true);
      } else if (currentAnySection === "features") {
        // For features section, detect based on scroll position within the section
        const featuresElement = document.getElementById("features");
        if (featuresElement) {
          const rect = featuresElement.getBoundingClientRect();
          const sectionHeight = featuresElement.offsetHeight;
          const scrollIntoSection = Math.abs(rect.top);
          const progress = scrollIntoSection / sectionHeight;
          
          // Features has 3 sub-sections: light (0-0.33), dark (0.33-0.66), light (0.66-1)
          const isInLightPart = progress < 0.33 || progress > 0.66;
          setIsOverLightSection(isInLightPart);
        }
      } else {
        setIsOverLightSection(false);
      }
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = useCallback((href: string) => {
    if (href.startsWith("#")) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
    setMenuState(false);
  }, []);

  // Public homepage - always show sign up CTA

  return (
    <header className="relative z-50">
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-0 w-full"
      >
        <div className="mx-auto px-4 lg:px-6">
          <motion.div
            className={cn(
              "mx-auto mt-4 max-w-7xl transition-all duration-500 ease-out",
              isScrolled 
                ? cn(
                    "max-w-5xl rounded-2xl backdrop-blur-xl px-6 py-3 shadow-2xl",
                    isOverLightSection 
                      ? "bg-gray-900/95 border border-gray-800/50 shadow-black/20" 
                      : "bg-white/10 border border-white/20 shadow-black/10"
                  )
                : "px-6 py-4"
            )}
            layout
          >
            <div className="flex items-center justify-between">
              
              {/* Logo */}
              <Link
                to="/"
                aria-label="home"
                className="flex items-center space-x-3"
                prefetch="viewport"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative"
                >
                  <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 opacity-30 blur" />
                  <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                </motion.div>
                <span className={cn(
                  "text-xl font-bold transition-colors duration-500",
                  isScrolled && isOverLightSection ? "text-white" : "text-white"
                )}>
                  SuppTraq
                </span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden lg:block">
                <ul className="flex items-center space-x-8">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <motion.button
                        onClick={() => handleNavClick(item.href)}
                        className={cn(
                          "relative px-3 py-2 text-sm font-medium transition-all duration-500",
                          activeSection === item.href.substring(1)
                            ? "text-white"
                            : isScrolled && isOverLightSection
                              ? "text-white/90 hover:text-white"
                              : "text-white/80 hover:text-white"
                        )}
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="relative z-10">{item.name}</span>
                        
                        {/* Active indicator */}
                        {activeSection === item.href.substring(1) && (
                          <motion.div
                            layoutId="activeIndicator"
                            className={cn(
                              "absolute inset-0 rounded-lg backdrop-blur-sm transition-all duration-500",
                              isScrolled && isOverLightSection
                                ? "bg-white/25 border border-white/40"
                                : "bg-white/20 border border-white/30"
                            )}
                            initial={false}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                        
                        {/* Hover background */}
                        <motion.div
                          className={cn(
                            "absolute inset-0 rounded-lg opacity-0 transition-all duration-200",
                            isScrolled && isOverLightSection ? "bg-white/15" : "bg-white/10"
                          )}
                          whileHover={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                        />
                      </motion.button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right side - Public CTAs */}
              <div className="flex items-center space-x-4">
                {/* Desktop CTA */}
                <div className="hidden lg:flex items-center space-x-3">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      asChild
                      variant="ghost"
                      className={cn(
                        "text-white/80 hover:text-white rounded-xl transition-all duration-500",
                        isScrolled && isOverLightSection 
                          ? "hover:bg-white/20 text-white/90" 
                          : "hover:bg-white/10"
                      )}
                    >
                      <Link to="/sign-in" prefetch="viewport">
                        Sign In
                      </Link>
                    </Button>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      asChild 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg rounded-xl px-6"
                    >
                      <Link to="/sign-up" prefetch="viewport">
                        <span>Get Started</span>
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </motion.div>
                </div>

                {/* Mobile menu button */}
                <motion.button
                  onClick={() => setMenuState(!menuState)}
                  aria-label={menuState ? "Close Menu" : "Open Menu"}
                  className={cn(
                    "lg:hidden relative z-50 p-2 rounded-xl transition-all duration-500",
                    isScrolled 
                      ? isOverLightSection
                        ? "bg-white/15 backdrop-blur-sm border border-white/30"
                        : "bg-white/10 backdrop-blur-sm border border-white/20"
                      : "bg-white/10 backdrop-blur-sm"
                  )}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    animate={{ rotate: menuState ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {menuState ? (
                      <X className="w-6 h-6 text-white" />
                    ) : (
                      <Menu className="w-6 h-6 text-white" />
                    )}
                  </motion.div>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {menuState && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden fixed inset-x-4 top-20 z-40"
            >
              <div className={cn(
                "rounded-2xl backdrop-blur-2xl shadow-2xl p-6 transition-all duration-500",
                isOverLightSection 
                  ? "bg-gray-900/95 border border-gray-800/50" 
                  : "bg-white/10 border border-white/20"
              )}>
                {/* Mobile Navigation Links */}
                <ul className="space-y-4 mb-6">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <motion.button
                        onClick={() => handleNavClick(item.href)}
                        className="block w-full text-left px-4 py-3 text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ x: 4 }}
                      >
                        {item.name}
                      </motion.button>
                    </li>
                  ))}
                </ul>

                {/* Mobile CTA Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-3 pt-4 border-t border-white/20"
                >
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full text-white/90 hover:text-white hover:bg-white/10 rounded-xl"
                  >
                    <Link to="/sign-in" prefetch="viewport">
                      Sign In
                    </Link>
                  </Button>
                  
                  <Button 
                    asChild 
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl"
                  >
                    <Link to="/sign-up" prefetch="viewport">
                      <span>Get Started</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile menu backdrop */}
        <AnimatePresence>
          {menuState && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn(
                "lg:hidden fixed inset-0 backdrop-blur-sm z-30 transition-all duration-300",
                isOverLightSection ? "bg-black/40" : "bg-black/20"
              )}
              onClick={() => setMenuState(false)}
            />
          )}
        </AnimatePresence>
      </motion.nav>
    </header>
  );
};