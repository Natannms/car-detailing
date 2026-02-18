"use client";

import { SignUp } from "@clerk/nextjs";

export default function RegisterPage() {
  return (
    <div className="min-h-screen w-full bg-white">
      <div className="grid min-h-screen w-full lg:grid-cols-2">
        <div className="relative hidden lg:block">
          <img
            src="https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=2070&auto=format&fit=crop"
            alt="Trabalho em equipe"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

          <div className="absolute left-10 top-10 flex items-center gap-2 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/15">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <rect width="7" height="7" x="3" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="14" rx="1" />
                <rect width="7" height="7" x="3" y="14" rx="1" />
              </svg>
            </div>
            <div className="text-sm font-semibold tracking-wide">Kanban AI</div>
          </div>

          <div className="absolute bottom-12 left-12 right-12 text-white">
            <div className="max-w-md">
              <p className="text-2xl font-semibold leading-snug tracking-tight">
                “Centralize seus projetos e colabore com o time em um único lugar.”
              </p>
              <div className="mt-5">
                <div className="text-sm font-semibold">Equipe Kanban AI</div>
                <div className="text-xs text-white/75">Workspace interno</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-h-screen items-center justify-center bg-[#EEF1F6] px-6 py-12 lg:bg-white lg:px-12">
          <div className="w-full max-w-sm">
            <div className="mb-8 text-center">
              <h1 className="text-[28px] font-semibold tracking-tight text-gray-900">Create your account</h1>
              <p className="mt-2 text-sm text-gray-600">Crie sua conta para começar a usar o Kanban AI.</p>
            </div>

            <SignUp
              routing="path"
              path="/register"
              signInUrl="/login"
              afterSignUpUrl="/dashboard"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "w-full shadow-none border-0 bg-transparent p-0",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlock: "hidden",
                  dividerRow: "hidden",
                  footer: "hidden",
                  formButtonPrimary:
                    "w-full rounded-full bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
                  formFieldInput:
                    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20",
                  formFieldLabel: "mb-2 block text-sm font-medium text-gray-700",
                  formFieldInputShowPasswordButton: "text-gray-500 hover:text-gray-700",
                  formFieldAction: "text-sm font-medium text-indigo-600 hover:text-indigo-700",
                  identityPreviewText: "text-gray-900 font-medium",
                  identityPreviewEditButton: "text-indigo-600 hover:text-indigo-700",
                },
                layout: {
                  socialButtonsPlacement: "bottom",
                  showOptionalFields: false,
                },
                variables: {
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                },
              }}
            />

            <div className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <a href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
                Sign in
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
