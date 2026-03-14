"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useAuth } from "@/contexts";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Shield, Loader2, Store, ShoppingBag } from "lucide-react";

/**
 * Test account credentials for quick login
 */
const testAccounts = {
  "guest-user": {
    email: "test@admin.com",
    password: "12345678",
  },
  "guest-supplier": {
    email: "test@supplier.com",
    password: "12345678",
  },
  "guest-client": {
    email: "test@client.com",
    password: "12345678",
  },
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isNavigatingToHome, setIsNavigatingToHome] = useState(false);
  const [selectMounted, setSelectMounted] = useState(false);
  const { login, isLoggedIn, user } = useAuth();
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const navigatingFromSubmitRef = useRef(false);

  useLayoutEffect(() => {
    setSelectMounted(true);
  }, []);

  useEffect(() => {
    if (isLoggedIn && !navigatingFromSubmitRef.current) {
      const dest = user?.role === "client" ? "/client" : user?.role === "supplier" ? "/supplier" : "/";
      window.location.href = dest;
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      let errorMessage = "An error occurred during Google sign-in.";
      if (error === "oauth_not_configured") errorMessage = "Google OAuth is not configured.";
      else if (error === "oauth_failed") errorMessage = "Google sign-in was cancelled or failed.";
      
      toast({
        title: "Sign-In Failed",
        description: errorMessage,
        variant: "destructive",
      });
      router.replace("/login");
    }
  }, [searchParams, router, toast]);

  const handleRoleSelect = (value: string) => {
    if (value === "clear") {
      setSelectedRole("");
      setEmail("");
      setPassword("");
    } else {
      setSelectedRole(value);
      const account = testAccounts[value as keyof typeof testAccounts];
      if (account) {
        setEmail(account.email);
        setPassword(account.password);
      }
    }
  };

  const handleGoogleSignIn = () => {
    const redirectUrl = searchParams.get("redirect") || "/";
    window.location.href = `/api/auth/oauth/google?callback=${encodeURIComponent(redirectUrl)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userData = await login(email, password);
      navigatingFromSubmitRef.current = true;
      setIsNavigatingToHome(true);
      toast({ title: `Welcome back! 👋` });
      window.location.href = userData.role === "client" ? "/client" : userData.role === "supplier" ? "/supplier" : "/";
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error?.response?.data?.error || "Invalid credentials",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),transparent_55%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.12),transparent_65%)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.3),transparent_60%)] dark:bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.05),transparent_60%)]"></div>

      <div className="relative z-10 w-full">
        <div className="flex flex-col lg:flex-row min-h-screen">
          <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-8">
            <div className="absolute inset-0 opacity-25">
              <Image src="/stock_inventory.svg" alt="Illustration" fill className="object-contain" priority />
            </div>
            <div className="relative z-10 max-w-2xl text-center">
              <div className="rounded-[28px] border bg-white/40 dark:bg-white/5 backdrop-blur-sm p-8 shadow-xl">
                <h1 className="text-2xl font-semibold mb-4">Inventory System</h1>
                <p className="text-muted-foreground">Manage your products, orders, and suppliers in one place.</p>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
            <div className="w-full max-w-md rounded-[28px] border bg-white/60 dark:bg-white/5 backdrop-blur-sm p-8 shadow-2xl">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold">Welcome Back</h2>
                <p className="text-muted-foreground">Sign in to your account</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 mb-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quick Access</label>
                  {!selectMounted ? (
                    <div className="h-11 w-full rounded-md border px-3 py-2 text-sm">Loading...</div>
                  ) : (
                    <Select value={selectedRole} onValueChange={handleRoleSelect}>
                      <SelectTrigger className="w-full bg-white/10">
                        <SelectValue placeholder="Select demo account" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="guest-user">Admin</SelectItem>
                        <SelectItem value="guest-supplier">Supplier</SelectItem>
                        <SelectItem value="guest-client">Client</SelectItem>
                        {selectedRole && <SelectItem value="clear">Clear</SelectItem>}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">Email</label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" required className="bg-white/10" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="password" name="password-label" className="text-sm font-medium">Password</label>
                    <Link href="/forgot-password" name="forgot-password-link" className="text-xs text-primary hover:underline transition-all">
                      Forgot password?
                    </Link>
                  </div>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="bg-white/10" />
                </div>

                <Button type="submit" className="w-full rounded-xl" disabled={isLoading || isNavigatingToHome}>
                  {isLoading || isNavigatingToHome ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign In"}
                </Button>
              </form>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or</span></div>
              </div>

              <Button type="button" variant="outline" onClick={handleGoogleSignIn} disabled={isLoading} className="w-full mb-6 gap-2">
                <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Continue with Google
              </Button>

              <div className="text-center text-sm">
                <p className="text-muted-foreground">Don't have an account? <Link href="/register" className="text-primary font-medium hover:underline">Sign up</Link></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
