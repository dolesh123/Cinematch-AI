import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, Users, Cpu, Layers } from 'lucide-react';

export const AIProcessingLoader: React.FC = () => {
  const steps = [
    { text: "Analyzing your user taste vector...", icon: Brain },
    { text: "Comparing collaborative viewer profiles...", icon: Users },
    { text: "Computing TF-IDF content similarities...", icon: Layers },
    { text: "Running hybrid recommendation ranker...", icon: Cpu },
  ];

  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 400);
    return () => clearInterval(timer);
  }, [steps.length]);

  const CurrentIcon = steps[currentStep].icon;

  return (
    <div className="flex flex-col items-center justify-center p-12 glass-panel rounded-3xl border border-indigo-500/20 shadow-2xl my-8">
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-500/30 animate-bounce">
          <CurrentIcon className="w-8 h-8 text-white animate-pulse" />
        </div>
        <div className="absolute -top-1 -right-1">
          <Sparkles className="w-5 h-5 text-indigo-400 animate-spin" />
        </div>
      </div>

      <h3 className="text-xl font-extrabold text-white tracking-tight mb-2">
        CineMatch AI Engine Active
      </h3>
      <p className="text-sm text-indigo-300 font-semibold h-6 animate-fadeIn">
        {steps[currentStep].text}
      </p>

      {/* Progress Dots */}
      <div className="flex items-center gap-2 mt-6">
        {steps.map((_, idx) => (
          <div
            key={idx}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              idx === currentStep
                ? 'w-8 bg-indigo-500 shadow-md shadow-indigo-500/50'
                : 'bg-slate-800'
            }`}
          ></div>
        ))}
      </div>
    </div>
  );
};
