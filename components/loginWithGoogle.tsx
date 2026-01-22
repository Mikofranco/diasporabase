import { supabase } from "@/lib/supabase/client";
import { Button } from "./ui/button";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";

export function SignInWithGoogle() {

  const handleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message || "Google sign in failed");
    }
  };

  return (
    <Button
      onClick={handleSignIn}
      variant="outline"
      className="w-full flex items-center justify-center gap-3 py-6 text-base font-medium bg-slate-100 text-diaspora-blue hover:bg-white hover:text-primary"
    >
      <FcGoogle className="h-6 w-6" />
      Sign in with Google
    </Button>
  );
}