import { Suspense } from "react";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

function ResetPasswordContent() {
  return <ResetPasswordForm />;
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}