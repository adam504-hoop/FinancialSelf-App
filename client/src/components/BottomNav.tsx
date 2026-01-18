import { Link, useLocation } from "wouter";
import { Home, PieChart, Gamepad2, Archive, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/allocator", icon: PieChart, label: "Allocator" },
    { href: "/playing", icon: Gamepad2, label: "Playing" },
    { href: "/dump-bin", icon: Archive, label: "Dump Bin" },
    { href: "/debt", icon: AlertTriangle, label: "Debt" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-bottom">
      <div className="flex justify-between items-center px-2 py-3 max-w-md mx-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = location === href;
          return (
            <Link key={href} href={href}>
              <div className="flex flex-col items-center justify-center w-14 cursor-pointer group">
                <div className="relative">
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 -m-1 bg-primary/20 rounded-full"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <Icon
                    className={`relative z-10 w-6 h-6 transition-colors duration-200 ${
                      isActive ? "text-primary fill-primary/10" : "text-muted-foreground group-hover:text-foreground"
                    }`}
                  />
                </div>
                <span className={`text-[10px] mt-1 font-medium transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}>
                  {label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
