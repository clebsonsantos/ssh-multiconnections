"use client";

import dynamic from "next/dynamic";

// Dynamically import to avoid SSR issues with Tauri APIs
const AppLayout = dynamic(() => import("@/components/AppLayout"), {
  ssr: false,
});

export default function Home() {
  return <AppLayout />;
}
