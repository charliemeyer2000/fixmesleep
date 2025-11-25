"use client";

import { useEffect } from "react";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Prevent body scroll only on chat page
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.style.height = "100%";
    
    return () => {
      document.body.style.overflow = "";
      document.body.style.height = "";
    };
  }, []);

  return <>{children}</>;
}

