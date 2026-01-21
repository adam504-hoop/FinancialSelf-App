import { Link, useLocation } from "wouter";
import { LayoutDashboard, PieChart, ArrowDownRight, PiggyBank } from "lucide-react";

export function BottomNav() {
  const [location] = useLocation();

  const menus = [
    { 
      name: "Dasboard", 
      path: "/", 
      icon: LayoutDashboard 
    },
    { 
      name: "Allocator", 
      path: "/allocator", 
      icon: PieChart 
    },
    { 
      name: "Debt", 
      path: "/debt", 
      icon: ArrowDownRight 
    },
    { 
      name: "Dump Bin", 
      path: "/dump-bin", 
      icon: PiggyBank 
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#18181b] border-t border-white/10 pb-4 pt-2 px-6 z-50">
      <div className="flex justify-between items-center max-w-lg mx-auto">
        {menus.map((menu) => {
          const isActive = location === menu.path;
          return (
            <Link key={menu.name} href={menu.path}>
              <a className={`flex flex-col items-center gap-1 transition-all duration-300 w-16 ${
                isActive ? "text-primary -translate-y-1" : "text-muted-foreground hover:text-white"
              }`}>
                {/* Indikator Aktif (Titik Bersinar) */}
                {isActive && (
                  <span className="absolute -top-2 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_currentColor]" />
                )}
                
                <div className={`p-2 rounded-xl transition-colors ${
                    isActive ? "bg-primary/10" : "bg-transparent"
                }`}>
                    <menu.icon className={`w-6 h-6 ${isActive ? "stroke-2" : "stroke-1"}`} />
                </div>
                
                <span className={`text-[10px] font-medium truncate w-full text-center ${
                    isActive ? "opacity-100" : "opacity-0 h-0 overflow-hidden"
                }`}>
                  {menu.name}
                </span>
              </a>
            </Link>
          );
        })}
      </div>
    </div>
  );
}