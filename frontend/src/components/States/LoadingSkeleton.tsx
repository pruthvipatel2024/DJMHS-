import React from 'react';

interface LoadingSkeletonProps {
  rows?: number;
  type?: 'table' | 'card' | 'form';
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ rows = 4, type = 'table' }) => {
  if (type === 'card') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
        {[...Array(4)].map((_, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-soft space-y-3">
            <div className="flex justify-between items-center">
              <div className="w-10 h-10 rounded-xl bg-slate-200"></div>
              <div className="w-16 h-5 rounded bg-slate-200"></div>
            </div>
            <div className="w-2/3 h-7 rounded bg-slate-200"></div>
            <div className="w-1/2 h-4 rounded bg-slate-200"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-soft overflow-hidden animate-pulse p-6 space-y-4">
      <div className="flex justify-between items-center mb-6">
        <div className="w-48 h-8 rounded-xl bg-slate-200"></div>
        <div className="flex gap-2">
          <div className="w-24 h-9 rounded-xl bg-slate-200"></div>
          <div className="w-24 h-9 rounded-xl bg-slate-200"></div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="w-full h-10 rounded-xl bg-slate-200 mb-4"></div>
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="w-full h-14 rounded-xl bg-slate-100 flex items-center justify-between px-4">
            <div className="w-1/4 h-5 rounded bg-slate-200"></div>
            <div className="w-1/5 h-5 rounded bg-slate-200"></div>
            <div className="w-1/6 h-5 rounded bg-slate-200"></div>
            <div className="w-1/12 h-6 rounded-full bg-slate-200"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingSkeleton;
