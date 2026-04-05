"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface LoginPageProps {
  isSetup: boolean;
  error: string;
  onLogin: (password: string) => Promise<boolean>;
  onCreatePassword: (password: string) => Promise<boolean>;
}

export function LoginPage({ isSetup, error, onLogin, onCreatePassword }: LoginPageProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    if (!isSetup) {
      if (password !== confirmPassword) {
        setLocalError("Passwords do not match");
        return;
      }
      await onCreatePassword(password);
    } else {
      await onLogin(password);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[40%] -left-[20%] h-[600px] w-[600px] rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute -bottom-[40%] -right-[20%] h-[600px] w-[600px] rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <Card className="relative w-full max-w-sm border-0 shadow-xl">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white text-xl font-bold shadow-lg shadow-violet-500/25">
              FT
            </div>
            <h1 className="text-xl font-semibold tracking-tight">
              {isSetup ? "Welcome Back" : "Get Started"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isSetup
                ? "Enter your password to continue"
                : "Create a password to protect your data"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-lg"
                autoFocus
              />
            </div>

            {!isSetup && (
              <div className="space-y-2">
                <Label htmlFor="confirm" className="text-xs font-medium">
                  Confirm Password
                </Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11 rounded-lg"
                />
              </div>
            )}

            {(error || localError) && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
                {localError || error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0 shadow-lg shadow-violet-500/25 transition-all"
            >
              {isSetup ? "Unlock" : "Create Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
