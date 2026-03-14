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
import { Shield, Loader2, Store, ShoppingBag, Users } from "lucide-react";

/**
 * Test account credentials for quick login (demo / production).
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

/**
 * Login page client component
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isNavigatingToHome, setIsNavigatingToHome] = useState(false);
  const [selectMounted, setSelectMounted] = useState(false);
  const { login, isLoggedIn, user } = useAuth();

  useLayoutEffect(() => {
    setSelectMounted(true);
  }, []);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const navigatingFromSubmitRef = useRef(false);

  useEffect(() => {
    if (isLoggedIn && !navigatingFromSubmitRef.current) {
      const dest =
        user?.role === "client"
          ? "/client"
          : user?.role === "supplier"
            ? "/supplier"
            : "/";
      window.location.href = dest;
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      let errorMessage = "An error occurred during Google sign-in.";
      switch (error) {
        case "oauth_not_configured":
          errorMessage = "Google OAuth is not configured. Please contact support.";
          break;
        case "oauth_failed":
          errorMessage = "Google sign-in was cancelled or failed. Please try again.";
          break;
        default:
          errorMessage = `OAuth error: ${error}. Please try again.`;
      }
      toast({
        title: "Google Sign-In Failed",
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

  const handleGoogleSignIn = async () => {
    try {
      const redirectUrl = searchParams.get("redirect") || "/";
      const oauthUrl = `/api/auth/oauth/google?callback=${encodeURIComponent(redirectUrl)}`;
      window.location.href = oauthUrl;
    } catch (error) {
      console.error("Error initiating Google OAuth:", error);
      toast({
        title: "OAuth Error",
        description: "Failed to initiate Google sign-in. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userData = await login(email, password);
      const userName = userData.name || userData.email.split("@")[0] || "User";
      navigatingFromSubmitRef.current = true;
      setIsNavigatingToHome(true);
      toast({
        title: `Welcome back, ${userName}! 👋`,
        description: "You have successfully logged in. Enjoy your stay!",
      });
      const dest = userData.role === "client" ? "/client" : userData.role === "supplier" ? "/supplier" : "/";
      window.location.href = dest;
    } catch (error: any) {
      const serverMessage = error?.response?.data?.error;
      toast({
        title: "Login Failed",
        description: serverMessage || "Invalid email or password. Please try again.",
        variant: "destructive",
      });
    } finally {
      if (!navigatingFromSubmitRef.current) setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),transparent_55%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.12),transparent_65%)] dark:bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),transparent_55%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.12),transparent_65%)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.3),transparent_60%)] dark:bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.05),transparent_60%)]"></div>

      <div className="relative z-10 w-full">
        <div className="flex flex-col lg:flex-row min-h-screen">
          <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-8 lg:p-12">
            <div className="absolute inset-0 opacity-25 dark:opacity-20">
              <Image src="/stock_inventory.svg" alt="Stock Inventory Illustration" fill className="object-contain" priority />
            </div>
            <div className="relative z-10 max-w-2xl w-full space-y-6">
              <div className="rounded-[28px] border dark:border-white/10 backdrop-blur-sm dark:shadow-lg p-4 sm:p-8">
                <h1 className="text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white mb-3 tracking-tight text-center">Demo Accounts Guide</h1>
                <p className="text-md lg:text-lg text-gray-700 dark:text-white/80 font-medium leading-relaxed text-center">Use the dropdown on the right to sign in as Admin, Client, or Supplier.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-[20px] border dark:border-white/10 backdrop-blur-sm dark:shadow-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="rounded-xl border bg-sky-500/20 dark:bg-sky-500/10 backdrop-blur-sm p-2"><Shield className="h-5 w-5 text-sky-600 dark:text-sky-400" /></div>
                    <h3 className="text-md font-semibold text-gray-900 dark:text-white">Admin</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-white/70">Full access to the entire system.</p>
                </div>
                <div className="rounded-[20px] border dark:border-white/10 backdrop-blur-sm dark:shadow-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="rounded-xl border bg-emerald-500/20 dark:bg-emerald-500/10 backdrop-blur-sm p-2"><ShoppingBag className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /></div>
                    <h3 className="text-md font-semibold text-gray-900 dark:text-white">Client</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-white/70">Access to catalog and orders.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-12">
            <div className="w-full max-w-md rounded-[28px] border dark:border-white/10 backdrop-blur-sm dark:shadow-lg p-6 sm:p-8">
              <div className="space-y-2 mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white text-center">Welcome Back</h2>
                <p className="text-sm text-gray-600 dark:text-white/70 text-center">Sign in to your account</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 mb-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-white/80">Test Accounts</label>
                  {!selectMounted ? (
                    <div className="h-11 w-full rounded-md border px-3 py-2 text-sm text-gray-500">Select Account</div>
                  ) : (
                    <Select value={selectedRole} onValueChange={handleRoleSelect}>
                      <SelectTrigger className="w-full dark:border-white/20 bg-white/10 dark:bg-white/5 text-gray-900 dark:text-white">
                        <SelectValue placeholder="Select Account" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="guest-user">Admin (test@admin.com)</SelectItem>
                        <SelectItem value="guest-supplier">Supplier (test@supplier.com)</SelectItem>
                        <SelectItem value="guest-client">Client (test@client.com)</SelectItem>
                        {selectedRole && <SelectItem value="clear">Clear Selection</SelectItem>}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-white/80">Email</label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="bg-white/10 dark:bg-white/5 border dark:border-white/20 text-gray-900 dark:text-white" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" name="password-label" className="text-sm font-medium text-gray-700 dark:text-white/80">Password</label>
                    <Link href="/forgot-password" name="forgot-password-link" className="text-xs text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors">Forgot password?</Link>
                  </div>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required className="bg-white/10 dark:bg-white/5 border dark:border-white/20 text-gray-900 dark:text-white" />
                </div>

                <Button type="submit" className="w-full rounded-xl" disabled={isLoading || isNavigatingToHome}>
                  {isNavigatingToHome ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : isLoading ? "Signing In..." : "Sign In"}
                </Button>
              </form>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t dark:border-white/10" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-transparent px-2 text-gray-600 dark:text-white/60">Or continue with</span></div>
              </div>

              <Button type="button" variant="outline" onClick={handleGoogleSignIn} disabled={isLoading || isNavigatingToHome} className="w-full mb-6">
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </Button>

              <div className="text-center text-sm">
                <p className="text-gray-600 dark:text-white/70">Don&apos;t have an account? <Link href="/register" className="text-sky-600 dark:text-sky-400 font-medium">Sign up</Link></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
