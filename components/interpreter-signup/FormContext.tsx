'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

export interface FormData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  country: string;
  city: string;
  bio: string;
  interpreterType: string;
  workMode: string;
  yearsExp: string;
  website: string;
  linkedin: string;
  regions: string[];
  eventCoordination: boolean;
  coordinationBio: string;
  signLangs: string[];
  spokenLangs: string[];
  specs: string[];
  certs: string[];
  hourlyRate: string;
  currency: string;
  minBooking: string;
  cancellationPolicy: string;
  videoUrl: string;
  videoDesc: string;
  agreeTerms: boolean;
  agreeDirectory: boolean;
}

export const defaultForm: FormData = {
  firstName: '', lastName: '', phone: '', email: '', password: '',
  country: '', city: '', bio: '',
  interpreterType: '', workMode: '', yearsExp: '',
  website: '', linkedin: '',
  regions: [], eventCoordination: false, coordinationBio: '',
  signLangs: [], spokenLangs: [], specs: [], certs: [],
  hourlyRate: '', currency: 'USD', minBooking: '60', cancellationPolicy: '48 hours notice required',
  videoUrl: '', videoDesc: '',
  agreeTerms: false, agreeDirectory: false,
};

interface FormContextValue {
  form: FormData;
  update: (field: keyof FormData, value: unknown) => void;
  toggleArrayItem: (field: keyof FormData, value: string) => void;
}

const FormContext = createContext<FormContextValue | null>(null);

export function useSignupForm() {
  const ctx = useContext(FormContext);
  if (!ctx) throw new Error('useSignupForm must be used inside <SignupFormProvider>');
  return ctx;
}

export function SignupFormProvider({ children }: { children: ReactNode }) {
  const [form, setForm] = useState<FormData>(defaultForm);

  function update(field: keyof FormData, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleArrayItem(field: keyof FormData, value: string) {
    const current = form[field] as string[];
    update(field, current.includes(value) ? current.filter((v) => v !== value) : [...current, value]);
  }

  return (
    <FormContext.Provider value={{ form, update, toggleArrayItem }}>
      {children}
    </FormContext.Provider>
  );
}
