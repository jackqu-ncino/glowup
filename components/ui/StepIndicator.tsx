"use client";

import { cn } from "@/lib/utils";

const STEPS = [
  { number: 1, label: "Basic Info" },
  { number: 2, label: "Services" },
  { number: 3, label: "Location" },
  { number: 4, label: "Portfolio" },
];

export default function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1 last:flex-initial">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                  step.number < currentStep
                    ? "bg-success text-white"
                    : step.number === currentStep
                    ? "bg-primary text-white"
                    : "bg-gray-200 text-gray-500"
                )}
              >
                {step.number < currentStep ? "\u2713" : step.number}
              </div>
              <span className="mt-1 text-xs text-muted hidden sm:block">
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-2 h-0.5 flex-1",
                  step.number < currentStep ? "bg-success" : "bg-gray-200"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
