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
                className="flex items-center"
                prefetch="viewport"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative"
                >
                  {/* Supptraq Full Logo Cropped */}
                  <svg 
                    viewBox="10 140 350 100" 
                    className="h-12 w-auto text-white"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g>
                      {/* Icon paths */}
                      <path d="M 46.914062 148.613281 C 41.480469 150.054688 37.878906 152.933594 24.195312 166.683594 C 10.574219 180.5 9.527344 182.003906 10.96875 187.046875 C 11.886719 190.453125 15.355469 194.707031 19.085938 197 C 21.773438 198.636719 23.082031 199.027344 27.402344 199.226562 C 32.511719 199.421875 32.511719 199.421875 38.074219 193.988281 C 41.152344 191.042969 43.640625 188.226562 43.640625 187.832031 C 43.640625 187.375 41.675781 185.214844 39.320312 182.988281 C 36.242188 180.042969 35.195312 178.667969 35.71875 178.144531 C 36.109375 177.75 40.628906 177.226562 45.800781 176.964844 C 52.21875 176.636719 55.820312 176.179688 57.128906 175.523438 C 60.007812 174.019531 84.496094 149.136719 83.972656 148.285156 C 83.253906 147.109375 51.496094 147.371094 46.914062 148.613281 Z M 46.914062 148.613281" />
                      <path d="M 61.972656 180.238281 C 59.289062 181.941406 13.585938 228.425781 14.113281 228.953125 C 14.4375 229.277344 21.511719 229.410156 29.957031 229.277344 C 45.277344 229.082031 45.277344 229.082031 49.859375 226.921875 C 53.921875 225.023438 55.820312 223.386719 66.164062 212.910156 C 72.582031 206.363281 78.40625 200.078125 79.0625 199.027344 C 81.484375 195.101562 80.4375 191.042969 75.917969 186.785156 C 69.242188 180.433594 64.921875 178.40625 61.972656 180.238281 Z M 61.972656 180.238281" />
                      
                      {/* Text paths */}
                      <path d="M 96.316406 177.835938 C 96.316406 175.179688 96.996094 172.835938 98.363281 170.804688 C 99.738281 168.765625 101.636719 167.171875 104.066406 166.023438 C 106.503906 164.878906 109.320312 164.304688 112.519531 164.304688 C 117.121094 164.304688 120.792969 165.503906 123.535156 167.898438 C 126.285156 170.285156 127.722656 173.535156 127.847656 177.648438 L 119.863281 177.648438 C 119.777344 175.691406 119.070312 174.164062 117.738281 173.070312 C 116.414062 171.96875 114.632812 171.414062 112.394531 171.414062 C 109.933594 171.414062 107.964844 171.96875 106.488281 173.070312 C 105.019531 174.164062 104.285156 175.671875 104.285156 177.585938 C 104.285156 179.203125 104.730469 180.476562 105.628906 181.414062 C 106.523438 182.351562 107.925781 183.050781 109.832031 183.507812 L 117.003906 185.070312 C 120.910156 185.894531 123.816406 187.328125 125.722656 189.367188 C 127.636719 191.398438 128.597656 194.117188 128.597656 197.523438 C 128.597656 200.359375 127.910156 202.820312 126.535156 204.914062 C 125.167969 207.007812 123.238281 208.628906 120.738281 209.773438 C 118.246094 210.917969 115.320312 211.492188 111.957031 211.492188 C 108.714844 211.492188 105.886719 210.949219 103.472656 209.867188 C 101.066406 208.785156 99.183594 207.238281 97.832031 205.226562 C 96.488281 203.207031 95.773438 200.847656 95.691406 198.148438 L 103.660156 198.148438 C 103.699219 200.066406 104.457031 201.578125 105.925781 202.679688 C 107.402344 203.773438 109.414062 204.320312 111.957031 204.320312 C 114.613281 204.320312 116.714844 203.785156 118.269531 202.710938 C 119.832031 201.628906 120.613281 200.128906 120.613281 198.210938 C 120.613281 196.679688 120.195312 195.457031 119.363281 194.539062 C 118.539062 193.625 117.191406 192.957031 115.316406 192.539062 L 108.082031 190.914062 C 100.238281 189.21875 96.316406 184.859375 96.316406 177.835938 Z M 96.316406 177.835938" />
                      <path d="M 155.582031 179.882812 L 163.175781 179.882812 L 163.175781 210.679688 L 156.144531 210.679688 L 155.582031 206.570312 C 154.664062 208.019531 153.289062 209.203125 151.457031 210.117188 C 149.632812 211.03125 147.679688 211.492188 145.597656 211.492188 C 142.066406 211.492188 139.300781 210.382812 137.300781 208.164062 C 135.308594 205.9375 134.316406 202.929688 134.316406 199.148438 L 134.316406 179.882812 L 141.925781 179.882812 L 141.925781 196.476562 C 141.925781 199.382812 142.480469 201.484375 143.597656 202.773438 C 144.722656 204.054688 146.347656 204.695312 148.472656 204.695312 C 153.210938 204.695312 155.582031 201.8125 155.582031 196.039062 Z M 155.582031 179.882812" />
                      <path d="M 171.023438 224.945312 L 171.023438 179.882812 L 178.070312 179.882812 L 178.570312 184.570312 C 179.527344 182.78125 180.949219 181.398438 182.835938 180.429688 C 184.730469 179.453125 186.839844 178.960938 189.164062 178.960938 C 192.070312 178.960938 194.589844 179.617188 196.726562 180.929688 C 198.871094 182.234375 200.546875 184.082031 201.757812 186.476562 C 202.964844 188.863281 203.570312 191.675781 203.570312 194.914062 C 203.570312 198.113281 203.007812 200.960938 201.882812 203.460938 C 200.757812 205.953125 199.121094 207.914062 196.976562 209.351562 C 194.839844 210.777344 192.234375 211.492188 189.164062 211.492188 C 186.882812 211.492188 184.792969 211.054688 182.898438 210.179688 C 181.011719 209.304688 179.589844 208.101562 178.632812 206.570312 L 178.632812 224.945312 Z M 178.695312 195.289062 C 178.695312 198.070312 179.480469 200.328125 181.054688 202.054688 C 182.636719 203.773438 184.734375 204.632812 187.351562 204.632812 C 190.058594 204.632812 192.15625 203.765625 193.648438 202.023438 C 195.148438 200.273438 195.898438 198.03125 195.898438 195.289062 C 195.898438 192.539062 195.148438 190.285156 193.648438 188.523438 C 192.15625 186.753906 190.058594 185.867188 187.351562 185.867188 C 184.734375 185.867188 182.636719 186.742188 181.054688 188.492188 C 179.480469 190.234375 178.695312 192.5 178.695312 195.289062 Z M 178.695312 195.289062" />
                      <path d="M 209.59375 224.945312 L 209.59375 179.882812 L 216.640625 179.882812 L 217.140625 184.570312 C 218.097656 182.78125 219.519531 181.398438 221.40625 180.429688 C 223.300781 179.453125 225.410156 178.960938 227.734375 178.960938 C 230.640625 178.960938 233.160156 179.617188 235.296875 180.929688 C 237.441406 182.234375 239.117188 184.082031 240.328125 186.476562 C 241.535156 188.863281 242.140625 191.675781 242.140625 194.914062 C 242.140625 198.113281 241.578125 200.960938 240.453125 203.460938 C 239.328125 205.953125 237.691406 207.914062 235.546875 209.351562 C 233.410156 210.777344 230.804688 211.492188 227.734375 211.492188 C 225.453125 211.492188 223.363281 211.054688 221.46875 210.179688 C 219.582031 209.304688 218.160156 208.101562 217.203125 206.570312 L 217.203125 224.945312 Z M 217.265625 195.289062 C 217.265625 198.070312 218.050781 200.328125 219.625 202.054688 C 221.207031 203.773438 223.304688 204.632812 225.921875 204.632812 C 228.628906 204.632812 230.726562 203.765625 232.21875 202.023438 C 233.71875 200.273438 234.46875 198.03125 234.46875 195.289062 C 234.46875 192.539062 233.71875 190.285156 232.21875 188.523438 C 230.726562 186.753906 228.628906 185.867188 225.921875 185.867188 C 223.304688 185.867188 221.207031 186.742188 219.625 188.492188 C 218.050781 190.234375 217.265625 192.5 217.265625 195.289062 Z M 217.265625 195.289062" />
                      <path d="M 258.324219 210.679688 L 250.730469 210.679688 L 250.730469 186.242188 L 244.808594 186.242188 L 244.808594 179.882812 L 250.730469 179.882812 L 250.730469 170.289062 L 258.324219 170.289062 L 258.324219 179.882812 L 264.308594 179.882812 L 264.308594 186.242188 L 258.324219 186.242188 Z M 258.324219 210.679688" />
                      <path d="M 288.371094 179.757812 L 288.371094 186.804688 L 285.558594 186.804688 C 282.816406 186.804688 280.644531 187.546875 279.042969 189.023438 C 277.449219 190.492188 276.652344 192.726562 276.652344 195.726562 L 276.652344 210.679688 L 269.042969 210.679688 L 269.042969 179.945312 L 276.214844 179.945312 L 276.652344 184.445312 C 277.316406 182.90625 278.363281 181.671875 279.792969 180.742188 C 281.230469 179.804688 282.964844 179.335938 284.996094 179.335938 C 286.078125 179.335938 287.203125 179.476562 288.371094 179.757812 Z M 288.371094 179.757812" />
                      <path d="M 301.457031 211.492188 C 298.175781 211.492188 295.597656 210.625 293.722656 208.882812 C 291.855469 207.132812 290.925781 204.804688 290.925781 201.898438 C 290.925781 199.066406 291.910156 196.800781 293.878906 195.101562 C 295.855469 193.394531 298.675781 192.394531 302.332031 192.101562 L 311.550781 191.414062 L 311.550781 190.742188 C 311.550781 188.660156 310.976562 187.164062 309.832031 186.257812 C 308.695312 185.34375 307.148438 184.882812 305.191406 184.882812 C 302.949219 184.882812 301.226562 185.332031 300.019531 186.226562 C 298.808594 187.113281 298.207031 188.367188 298.207031 189.992188 L 291.722656 189.992188 C 291.722656 186.671875 292.988281 184.003906 295.519531 181.992188 C 298.058594 179.972656 301.410156 178.960938 305.566406 178.960938 C 309.722656 178.960938 312.992188 180.0625 315.378906 182.257812 C 317.773438 184.457031 318.972656 187.695312 318.972656 191.976562 L 318.972656 210.679688 L 312.300781 210.679688 L 311.738281 206.132812 C 311.070312 207.707031 309.789062 208.992188 307.894531 209.992188 C 306.007812 210.992188 303.863281 211.492188 301.457031 211.492188 Z M 303.941406 205.757812 C 306.273438 205.757812 308.132812 205.097656 309.519531 203.773438 C 310.914062 202.441406 311.613281 200.585938 311.613281 198.210938 L 311.613281 196.585938 L 305.191406 197.085938 C 302.824219 197.296875 301.144531 197.785156 300.144531 198.554688 C 299.144531 199.328125 298.644531 200.335938 298.644531 201.585938 C 298.644531 204.367188 300.410156 205.757812 303.941406 205.757812 Z M 303.941406 205.757812" />
                      <path d="M 324.636719 194.914062 C 324.636719 191.675781 325.234375 188.863281 326.433594 186.476562 C 327.640625 184.082031 329.324219 182.234375 331.480469 180.929688 C 333.644531 179.617188 336.160156 178.960938 339.027344 178.960938 C 341.347656 178.960938 343.464844 179.453125 345.371094 180.429688 C 347.285156 181.398438 348.703125 182.78125 349.621094 184.570312 L 350.121094 179.882812 L 357.105469 179.882812 L 357.105469 224.945312 L 349.558594 224.945312 L 349.558594 206.570312 C 348.597656 208.101562 347.171875 209.304688 345.277344 210.179688 C 343.390625 211.054688 341.308594 211.492188 339.027344 211.492188 C 335.996094 211.492188 333.394531 210.777344 331.230469 209.351562 C 329.074219 207.914062 327.433594 205.953125 326.308594 203.460938 C 325.191406 200.960938 324.636719 198.113281 324.636719 194.914062 Z M 332.230469 195.289062 C 332.230469 198.03125 332.984375 200.273438 334.496094 202.023438 C 336.015625 203.765625 338.109375 204.632812 340.777344 204.632812 C 343.433594 204.632812 345.546875 203.773438 347.121094 202.054688 C 348.703125 200.328125 349.496094 198.070312 349.496094 195.289062 C 349.496094 192.5 348.703125 190.234375 347.121094 188.492188 C 345.546875 186.742188 343.433594 185.867188 340.777344 185.867188 C 338.109375 185.867188 336.015625 186.753906 334.496094 188.523438 C 332.984375 190.285156 332.230469 192.539062 332.230469 195.289062 Z M 332.230469 195.289062" />
                    </g>
                  </svg>
                </motion.div>
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