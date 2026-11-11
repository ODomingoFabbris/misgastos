import { LogOut } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export function LogoutButton({ className }: { className?: string }) {
  return (
    <form action={logout}>
      <Button type="submit" variant="outline" className={`h-11 w-full justify-start gap-3 ${className ?? ""}`}>
        <LogOut className="size-4" aria-hidden />
        Cerrar sesión
      </Button>
    </form>
  );
}
