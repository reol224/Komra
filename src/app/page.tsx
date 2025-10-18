"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/waitlist");
  }, [router]);

  // Show loading state while redirecting
  // return (
  //   <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
  //     <div className="text-center">
  //       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
  //       <p className="text-white">Redirecting...</p>
  //     </div>
  //   </div>
  // );
}
