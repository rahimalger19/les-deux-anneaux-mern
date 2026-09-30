type BookingStep = 1 | 2 | 3 | 4;

const steps = [
  { number: 1 as BookingStep, label: "Créneau" },
  { number: 2 as BookingStep, label: "Détails" },
  { number: 3 as BookingStep, label: "Devis" },
  { number: 4 as BookingStep, label: "Confirmation" },
];

export default function BookingStepper({
  currentStep,
}: {
  currentStep: BookingStep;
}) {
  return (
    <nav aria-label="Étapes de réservation" className="mt-9">
      <ol className="flex w-full">
        {steps.map((step, index) => {
          const complete = currentStep > step.number;
          const active = currentStep === step.number;

          return (
            <li
              key={step.number}
              className="relative flex flex-1 flex-col items-center"
            >
              {index < steps.length - 1 && (
                <span
                  className={`absolute left-1/2 top-5 h-0.5 w-full ${
                    currentStep > step.number
                      ? "bg-gold"
                      : "bg-foreground/20"
                  }`}
                />
              )}

              <span
                className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                  complete || active
                    ? "bg-black text-ivory dark:bg-gold dark:text-black"
                    : "bg-foreground/10 text-foreground/60"
                }`}
              >
                {complete ? "✓" : step.number}
              </span>

              <span
                className={`mt-3 text-center text-xs font-semibold sm:text-sm ${
                  complete || active
                    ? "text-foreground"
                    : "text-foreground/50"
                }`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}