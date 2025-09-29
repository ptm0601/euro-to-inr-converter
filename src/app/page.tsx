"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ArrowLeftRight, Moon, Sun } from "lucide-react";

export default function Home() {
  const [fromCurrency, setFromCurrency] = useState<"EUR" | "INR">("EUR");
  const [toCurrency, setToCurrency] = useState<"EUR" | "INR">("INR");
  const [amount, setAmount] = useState<string>("1");
  const [result, setResult] = useState<string>("");
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const currencyToMeta = (code: "EUR" | "INR") => {
    switch (code) {
      case "INR":
        return { code: "INR" as const, icon: "/inr.svg", label: "INR" };
      case "EUR":
      default:
        return { code: "EUR" as const, icon: "/eur.svg", label: "EUR" };
    }
  };

  const pair = useMemo(() => `${fromCurrency}_${toCurrency}`, [fromCurrency, toCurrency]);

  useEffect(() => {
    // initialize theme from localStorage or system preference
    const stored = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    const prefersDark = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme = (stored as "light" | "dark") || (prefersDark ? "dark" : "light");
    setTheme(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("theme", next);
  };

  useEffect(() => {
    let ignore = false;
    async function fetchRate() {
      setError(null);
      setLoading(true);
      try {
        // Reliable CORS-friendly endpoint
        const res = await fetch(
          `https://api.frankfurter.app/latest?from=${fromCurrency}&to=${toCurrency}`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error("Network response was not ok");
        const data = await res.json();
        const r = data?.rates?.[toCurrency];
        if (!ignore) setRate(typeof r === "number" ? r : null);
        if (!ignore && typeof r !== "number") {
          setError("Rate unavailable right now. Try again later.");
        }
      } catch (e) {
        if (!ignore) setError("Failed to fetch rates. Please try again.");
        if (!ignore) setRate(null);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchRate();
    return () => {
      ignore = true;
    };
  }, [pair, fromCurrency, toCurrency]);

  // Live conversion whenever amount or rate changes
  useEffect(() => {
    if (!rate) {
      setResult("");
      return;
    }
    const amt = parseFloat(amount || "0");
    if (isNaN(amt)) {
      setResult("");
      return;
    }
    const value = amt * rate;
    const formatted = new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 4,
    }).format(value);
    setResult(formatted);
  }, [amount, rate]);

  const handleConvert = () => {
    // Kept for UX parity with the reference primary CTA
    // No-op because conversion is live; still validate to show error
    if (isNaN(parseFloat(amount || ""))) setError("Enter a valid number");
  };

  const swap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setResult("");
  };

  return (
    <div className="min-h-dvh w-full grid place-items-center px-4">
      {/* Top-left site title */}
      <div className="fixed top-4 left-4 text-lg font-semibold tracking-tight">
        CurrencyConverter
      </div>
      {/* Top-right theme toggle */}
      <Button
        type="button"
        variant="outline"
        onClick={toggleTheme}
        className="fixed top-3 right-3 h-9 rounded-full border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--secondary)]"
        aria-label="Toggle dark mode"
      >
        {theme === "dark" ? (
          <div className="flex items-center gap-2"><Sun className="h-4 w-4" /> <span className="hidden sm:inline">Light</span></div>
        ) : (
          <div className="flex items-center gap-2"><Moon className="h-4 w-4" /> <span className="hidden sm:inline">Dark</span></div>
        )}
      </Button>

      <div className="w-full max-w-xl">
        <Card className="rounded-[32px] shadow-sm border border-transparent bg-[var(--card)]">
          <CardContent className="p-6 sm:p-8 space-y-6">
            {rate && (
              <div className="text-center text-sm text-[var(--muted-foreground)]">
                <div className="font-medium">Mid-market exchange rate</div>
                <div className="mt-1">
                  {fromCurrency === "INR" ? "₹" : "€"}1 {fromCurrency} = {new Intl.NumberFormat(undefined, { maximumFractionDigits: 6 }).format(rate)} {toCurrency}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm text-[var(--muted-foreground)]">Amount</label>
              <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-3 py-2">
                <Input
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 border-0 focus-visible:ring-0 h-12 text-base"
                />
                <Select value={fromCurrency} onValueChange={(v) => setFromCurrency(v as any)}>
                  <SelectTrigger className="w-[130px] h-10 rounded-xl border-0 bg-[var(--secondary)]">
                    <div className="flex items-center gap-2">
                      <img
                        src={currencyToMeta(fromCurrency).icon}
                        alt={currencyToMeta(fromCurrency).code}
                        className="h-4 w-4 rounded-full"
                      />
                      <span className="text-sm font-medium">
                        {currencyToMeta(fromCurrency).label}
                      </span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">
                      <span className="flex items-center gap-2">
                        <img src="/inr.svg" alt="INR" className="h-4 w-4 rounded-full" />
                        <span>INR</span>
                      </span>
                    </SelectItem>
                    <SelectItem value="EUR">
                      <span className="flex items-center gap-2">
                        <img src="/eur.svg" alt="EUR" className="h-4 w-4 rounded-full" />
                        <span>EUR</span>
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={swap}
                className="h-12 w-12 rounded-full grid place-items-center bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                aria-label="Swap"
              >
                <ArrowLeftRight className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-[var(--muted-foreground)]">Converted to</label>
              <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-3 py-2">
                <Input value={result} readOnly placeholder={loading ? "Fetching rate..." : "0.00"} className="flex-1 border-0 focus-visible:ring-0 h-12 text-base" />
                <Select value={toCurrency} onValueChange={(v) => setToCurrency(v as any)}>
                  <SelectTrigger className="w-[130px] h-10 rounded-xl border-0 bg-[var(--secondary)]">
                    <div className="flex items-center gap-2">
                      <img
                        src={currencyToMeta(toCurrency).icon}
                        alt={currencyToMeta(toCurrency).code}
                        className="h-4 w-4 rounded-full"
                      />
                      <span className="text-sm font-medium">
                        {currencyToMeta(toCurrency).label}
                      </span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">
                      <span className="flex items-center gap-2">
                        <img src="/eur.svg" alt="EUR" className="h-4 w-4 rounded-full" />
                        <span>EUR</span>
                      </span>
                    </SelectItem>
                    <SelectItem value="INR">
                      <span className="flex items-center gap-2">
                        <img src="/inr.svg" alt="INR" className="h-4 w-4 rounded-full" />
                        <span>INR</span>
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {error && <p className="text-xs text-[var(--destructive)]">{error}</p>}
            </div>

            <div className="space-y-3 pt-2">
              <Button
                type="button"
                onClick={handleConvert}
                disabled={loading || !rate}
                className="w-full h-12 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] hover:brightness-95"
              >
                Convert
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 rounded-full bg-[var(--card)] text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--secondary)]"
              >
                Track exchange rate
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}