"use client";
import React, { useState, useEffect } from "react";
import { Theme } from "@radix-ui/themes";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return (
        (localStorage.getItem("theme") as "light" | "dark") ||
        (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      );
    }
    return "dark";
  });

  // Sync Tailwind's dark mode with Radix theme
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      localStorage.setItem("theme", theme);
    }
  }, [theme]);

  // Only pass theme/setTheme to the Home component
  const child = React.Children.only(children);
  const isHome =
    typeof child === "object" &&
    child !== null &&
    "type" in child &&
    (child.type.displayName === "Home" || child.type.name === "Home");

  return (
    <Theme appearance={theme}>
      {isHome
        ? React.cloneElement(child as React.ReactElement, { theme, setTheme })
        : child}
    </Theme>
  );
} 