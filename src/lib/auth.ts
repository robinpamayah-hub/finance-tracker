"use client";

import { useState, useEffect, useCallback } from "react";

const KEYS = {
  passwordHash: "finance-tracker-password-hash",
  session: "finance-tracker-session",
} as const;

const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function isSessionValid(): boolean {
  const session = localStorage.getItem(KEYS.session);
  if (!session) return false;
  const expiry = parseInt(session, 10);
  return Date.now() < expiry;
}

function setSession(): void {
  localStorage.setItem(KEYS.session, String(Date.now() + SESSION_DURATION));
}

function clearSession(): void {
  localStorage.removeItem(KEYS.session);
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSetup, setIsSetup] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const hasPassword = !!localStorage.getItem(KEYS.passwordHash);
    setIsSetup(hasPassword);
    if (hasPassword && isSessionValid()) {
      setIsAuthenticated(true);
    }
    setIsLoaded(true);
  }, []);

  const createPassword = useCallback(async (password: string) => {
    if (password.length < 4) {
      setError("Password must be at least 4 characters");
      return false;
    }
    const hash = await hashPassword(password);
    localStorage.setItem(KEYS.passwordHash, hash);
    setIsSetup(true);
    setIsAuthenticated(true);
    setSession();
    setError("");
    return true;
  }, []);

  const login = useCallback(async (password: string) => {
    const storedHash = localStorage.getItem(KEYS.passwordHash);
    if (!storedHash) return false;

    const hash = await hashPassword(password);
    if (hash === storedHash) {
      setIsAuthenticated(true);
      setSession();
      setError("");
      return true;
    }
    setError("Incorrect password");
    return false;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setIsAuthenticated(false);
    setError("");
  }, []);

  return {
    isAuthenticated,
    isSetup,
    isLoaded,
    error,
    createPassword,
    login,
    logout,
  };
}
