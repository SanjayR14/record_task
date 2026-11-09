import React from 'react';

export const ProgressBar = ({ currentStepIndex, totalSteps, stepName }) => {
  const percentage = Math.min(100, Math.round(((currentStepIndex + 1) / totalSteps) * 100));

  return (
    <div className="w-full space-y-1.5 mb-5">
      <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
        <span className="text-slate-700 font-semibold">{stepName || `Step ${currentStepIndex + 1}`}</span>
        <span>{percentage}% Complete</span>
      </div>
      <div className="w-full h-1.5 sm:h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;

