"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

interface HeaderProps {
  onLogout: () => void;
  isMasked: boolean;
  onToggleMask: () => void;
  onUnlockRequest: (password: string) => Promise<boolean>;
}

export function Header({ onLogout, isMasked, onToggleMask, onUnlockRequest }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const now = new Date();
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLockToggle = () => {
    if (isMasked) {
      // Need password to unlock
      setPassword("");
      setError("");
      setUnlockOpen(true);
    } else {
      // Lock immediately, no password needed
      onToggleMask();
    }
  };

  const handleUnlock = async () => {
    if (!password) {
      setError("Enter your password");
      return;
    }
    setLoading(true);
    const valid = await onUnlockRequest(password);
    setLoading(false);
    if (valid) {
      setUnlockOpen(false);
      setPassword("");
      setError("");
    } else {
      setError("Incorrect password");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-violet-500/25">
              FT
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Finance Tracker</h1>
              <p className="text-xs text-muted-foreground">
                {format(now, "MMMM yyyy")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Mask / Unmask button */}
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-lg gap-1.5 ${isMasked ? "text-amber-500 hover:text-amber-600" : "text-muted-foreground hover:text-foreground"}`}
              onClick={handleLockToggle}
              title={isMasked ? "Data is hidden — click to unlock" : "Click to hide sensitive data"}
            >
              {isMasked ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                </svg>
              )}
              <span className="hidden sm:inline text-xs">{isMasked ? "Locked" : "Lock"}</span>
            </Button>

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <svg
                className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
              <svg
                className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Logout */}
            <Button
              variant="ghost"
              size="sm"
              className="rounded-lg text-muted-foreground hover:text-foreground"
              onClick={onLogout}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Unlock Password Dialog */}
      <Dialog open={unlockOpen} onOpenChange={(open) => { if (!open) { setUnlockOpen(false); setError(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Unlock Data</DialogTitle>
            <DialogDescription>
              Enter your password to reveal hidden financial data.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="unlock-pw">Password</Label>
              <Input
                id="unlock-pw"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                autoFocus
                placeholder="Enter password"
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnlockOpen(false)}>Cancel</Button>
            <Button onClick={handleUnlock} disabled={loading}>
              {loading ? "Verifying..." : "Unlock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
