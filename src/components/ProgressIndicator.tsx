interface ProgressIndicatorProps {
  currentStep: number; // 1: Players, 2: Game, 3: Camera, 4: Play
}

export default function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
  const steps = [
    { label: 'Players', num: '01' },
    { label: 'Game', num: '02' },
    { label: 'Camera', num: '03' },
    { label: 'Play', num: '04' },
  ];

  return (
    <div className="flex items-center justify-center space-x-1 sm:space-x-2 md:space-x-3 select-none font-display text-[9px] sm:text-xs font-black uppercase tracking-wider">
      {steps.map((step, idx) => {
        const stepNum = idx + 1;
        const isActive = currentStep === stepNum;
        const isCompleted = currentStep > stepNum;
        
        return (
          <div key={idx} className="flex items-center">
            {/* Connecting Line (except for first step) */}
            {idx > 0 && (
              <div 
                className={`w-3 sm:w-6 md:w-8 h-[2px] mx-1 sm:mx-1.5 border-t-2 border-dashed transition-colors duration-300 ${
                  isCompleted ? 'border-brand-purple' : 'border-slate-300'
                }`}
              />
            )}

            {/* Step Capsule */}
            <div 
              className={`flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border-2 transition-all duration-300 ${
                isActive 
                  ? 'bg-brand-purple border-slate-950 text-white shadow-chunky-sm scale-105' 
                  : isCompleted 
                    ? 'bg-white border-slate-950 text-slate-800' 
                    : 'bg-slate-100/50 border-slate-300 text-slate-400'
              }`}
            >
              {/* Step Number */}
              <span className="font-mono text-[9px] sm:text-[11px]">{step.num}</span>
              
              {/* Step Label (Hidden on small mobile viewports) */}
              <span className="hidden sm:inline">{step.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
