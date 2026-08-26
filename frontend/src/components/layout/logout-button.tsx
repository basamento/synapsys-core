import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/state/auth-context";

export function LogoutButton({ mobile = false }: { mobile?: boolean }) {
  const { signOut } = useAuth();

  if (mobile) {
    return (
      <Button
        aria-label="Sign out"
        title="Sign out"
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => void signOut()}
        className="text-faint"
      >
        <LogOut aria-hidden className="size-4.75" />
      </Button>
    );
  }

  return (
    <Button
      aria-label="Sign out"
      title="Sign out"
      type="button"
      variant="ghost"
      onClick={() => void signOut()}
      className="w-full justify-center text-body hover:bg-sunken wide:justify-start"
    >
      <LogOut aria-hidden className="size-4 text-faint" />
      <span className="hidden wide:inline">Sign out</span>
    </Button>
  );
}
