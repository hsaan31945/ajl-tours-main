import React from "react";
import { useI18n } from "../i18n";

const CheckoutProgress = ({ currentStep }) => {
  const { t } = useI18n();
  const steps = [
    t("booking.flexibility"),
    t("booking.userDetails"),
    t("booking.payment"),
  ];

  return (
    <section
      className="mb-8 w-full max-w-3xl mx-auto select-none"
      aria-label="Booking progress"
    >
      <ol className="flex items-center justify-center gap-2 sm:gap-4">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCurrent = stepNumber === currentStep;
          const isComplete = stepNumber < currentStep;

          return (
            <li
              key={step}
              className="flex min-w-0 items-center gap-2 cursor-default"
              aria-current={isCurrent ? "step" : undefined}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold sm:h-8 sm:w-8 sm:text-base ${
                  isCurrent
                    ? "border-blue-700 bg-blue-700 text-white"
                    : isComplete
                      ? "border-blue-700 bg-blue-50 text-blue-700"
                      : "border-blue-400 bg-white text-blue-700"
                }`}
                aria-hidden="true"
              >
                {stepNumber}
              </span>
              <span
                className={`whitespace-nowrap text-xs font-semibold sm:text-base ${
                  isCurrent ? "text-blue-700" : isComplete ? "text-gray-700" : "text-gray-500"
                }`}
              >
                {step}
              </span>
              {index < steps.length - 1 && (
                <span className="h-0.5 w-4 shrink-0 rounded-full bg-blue-200 sm:w-8" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
};

export default CheckoutProgress;
