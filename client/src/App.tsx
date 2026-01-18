import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/use-auth";
import { BottomNav } from "@/components/BottomNav";

// Pages
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Allocator from "@/pages/Allocator";
import Playing from "@/pages/Playing";
import DumpBin from "@/pages/DumpBin";
import Debt from "@/pages/Debt";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Landing />;
  }

  return (
    <div className="bg-background min-h-screen font-sans text-foreground">
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/allocator" component={Allocator} />
        <Route path="/playing" component={Playing} />
        <Route path="/dump-bin" component={DumpBin} />
        <Route path="/debt" component={Debt} />
        <Route component={NotFound} />
      </Switch>
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
