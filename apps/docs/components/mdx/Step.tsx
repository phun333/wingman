import type { ReactNode } from "react";

interface StepProps {
  number: number;
  title: string;
  children: ReactNode;
}

export function Step({ number, title, children }: StepProps) {
  return (
    <div className="flex gap-4 my-4">
      <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[#e5a10e] text-[#07070a] text-sm font-bold">
        {number}
      </div>
      <div className="flex-1 pt-0.5">
        <h4 className="text-base font-semibold text-[#ededef] !m-0 !mb-1">{title}</h4>
        <div className="text-sm text-[#8b8b96] [&>p]:m-0">{children}</div>
      </div>
    </div>
  );
}

interface StepsProps {
  children: ReactNode;
}

export function Steps({ children }: StepsProps) {
  return (
    <div className="my-6 ml-4 border-l-2 border-[#27272f] pl-2 space-y-2">
      {children}
    </div>
  );
}
