'use client';

// app/(auth)/interpreter/signup/page.tsx
// DROP THIS FILE IN — replaces the current signup page entirely.
// Stepper + hero match prototype index.html ~line 2832–3486

import { useState } from 'react';
import { SignupFormProvider } from '@/components/interpreter-signup/FormContext';
import SignupStepper from '@/components/interpreter-signup/SignupStepper';
import Step1Personal from '@/components/interpreter-signup/Step1Personal';
import Step2Languages from '@/components/interpreter-signup/Step2Languages';
import Step3Credentials from '@/components/interpreter-signup/Step3Credentials';
import Step4Rates from '@/components/interpreter-signup/Step4Rates';
import Step5Video from '@/components/interpreter-signup/Step5Video';
import Step6Review from '@/components/interpreter-signup/Step6Review';

const TOTAL_STEPS = 6;

export default function InterpreterSignupPage() {
  const [currentStep, setCurrentStep] = useState(1);

  function goToStep(step: number) {
    if (step >= 1 && step <= TOTAL_STEPS) setCurrentStep(step);
  }

  function next() {
    goToStep(currentStep + 1);
  }

  function back() {
    goToStep(currentStep - 1);
  }

  return (
    <SignupFormProvider>
      <div
        style={{
          minHeight: '100vh',
          padding: '100px 40px 60px',
          background: 'var(--bg)',
        }}
      >
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>

          {/* ── Hero + Step indicator — persistent across all 6 steps ── */}
          <SignupStepper
            currentStep={currentStep}
            onStepClick={(step) => goToStep(step)}
          />

          {/* ── Step content ── */}
          {currentStep === 1 && <Step1Personal onNext={next} />}
          {currentStep === 2 && <Step2Languages onNext={next} onBack={back} />}
          {currentStep === 3 && <Step3Credentials onNext={next} onBack={back} />}
          {currentStep === 4 && <Step4Rates onNext={next} onBack={back} />}
          {currentStep === 5 && <Step5Video onNext={next} onBack={back} />}
          {currentStep === 6 && <Step6Review onBack={back} />}

        </div>
      </div>
    </SignupFormProvider>
  );
}
