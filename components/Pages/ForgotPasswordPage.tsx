"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Mail, Lock } from "lucide-react";

/**
 * Forgot Password Page Component
 * "Easy Logic" version that allows password reset directly if email exists.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.userExists) {
        setIsEmailVerified(true);
        toast({
          title: "Email Verified! ✅",
          description: "User found. Please enter your new password below.",
        });
      } else {
        toast({
          title: "Not Found",
          description: data.error || "User with this email not found.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Too Short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });

      if (response.ok) {
        setIsSuccess(true);
        toast({
          title: "Password Updated! 🎉",
          description: "Your password has been reset successfully. You can now login.",
        });
        setTimeout(() => router.push("/login"), 2000);
      } else {
        throw new Error("Reset failed");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),transparent_55%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.12),transparent_65%)] dark:bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),transparent_55%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.12),transparent_65%)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.3),transparent_60%)] dark:bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.05),transparent_60%)]"></div>

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="rounded-[28px] border dark:border-white/10 backdrop-blur-sm dark:shadow-lg p-6 sm:p-8 bg-white/60 dark:bg-white/5">
          <Link 
            href="/login" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>

          {!isSuccess ? (
            <>
              {!isEmailVerified ? (
                // Step 1: Verify Email
                <>
                  <div className="space-y-2 mb-6 text-center">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Verify Your Email</h2>
                    <p className="text-sm text-gray-600 dark:text-white/70">
                      Enter your account email to continue the reset process.
                    </p>
                  </div>

                  <form onSubmit={handleVerifyEmail} className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-white/80">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="email" 
                          type="email" 
                          value={email} 
                          onChange={(e) => setEmail(e.target.value)} 
                          placeholder="name@example.com" 
                          required 
                          className="pl-10 bg-white/10 dark:bg-white/5 border dark:border-white/20 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full rounded-xl" disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Verify Email"}
                    </Button>
                  </form>
                </>
              ) : (
                // Step 2: Set New Password
                <>
                  <div className="space-y-2 mb-6 text-center">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Reset Password</h2>
                    <p className="text-sm text-gray-600 dark:text-white/70">
                      Email verified! You can now set your new password.
                    </p>
                  </div>

                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-white/80">Email (Verified)</label>
                      <Input value={email} disabled className="bg-muted opacity-60" />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="newPassword" className="text-sm font-medium text-gray-700 dark:text-white/80">New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="newPassword" 
                          type="password" 
                          value={newPassword} 
                          onChange={(e) => setNewPassword(e.target.value)} 
                          placeholder="••••••••" 
                          required 
                          className="pl-10 bg-white/10 dark:bg-white/5 border dark:border-white/20 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-white/80">Confirm New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="confirmPassword" 
                          type="password" 
                          value={confirmPassword} 
                          onChange={(e) => setConfirmPassword(e.target.value)} 
                          placeholder="••••••••" 
                          required 
                          className="pl-10 bg-white/10 dark:bg-white/5 border dark:border-white/20 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full rounded-xl" disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Update Password"}
                    </Button>
                  </form>
                </>
              )}
            </>
          ) : (
            <div className="text-center py-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Password Updated!</h2>
              <p className="text-sm text-gray-600 dark:text-white/70 mb-6">
                Redirecting to login...
              </p>
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
