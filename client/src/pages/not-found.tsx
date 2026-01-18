import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-6 text-center border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="flex justify-center mb-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold font-display mb-2">404 Page Not Found</h1>
        <p className="text-muted-foreground text-sm mb-6">
          The financial page you are looking for has been audited and removed.
        </p>
        <a href="/" className="text-primary hover:underline font-medium">
          Return to Dashboard
        </a>
      </Card>
    </div>
  );
}
