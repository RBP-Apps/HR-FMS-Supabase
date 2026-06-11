import React, { useEffect, useRef } from 'react';
import { Users, TrendingUp, CreditCard, PiggyBank, Shield, Wallet, Banknote, Calendar, CheckCircle } from 'lucide-react';
import { fmt } from './payrollConstants';

function AnimatedValue({ value, isCurrency, duration = 800 }) {
  const ref = useRef(null);
  const prev = useRef(0);
  useEffect(() => {
    const target = Number(value || 0);
    const start = prev.current;
    const startTime = performance.now();
    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (target - start) * eased);
      if (ref.current) {
        ref.current.textContent = isCurrency
          ? `₹${current.toLocaleString('en-IN')}`
          : current.toLocaleString('en-IN');
      }
      if (progress < 1) requestAnimationFrame(step);
      else prev.current = target;
    };
    requestAnimationFrame(step);
  }, [value, isCurrency, duration]);
  return <span ref={ref}>{isCurrency ? fmt(value) : Number(value || 0).toLocaleString('en-IN')}</span>;
}

const CARDS = [
  {
    key: 'totalEmployees',
    label: 'Total Employees',
    icon: Users,
    gradient: 'from-blue-500 via-blue-600 to-cyan-500',
    glow: 'shadow-blue-400/40',
    filter: 'all',
    isCurrency: false,
  },
  {
    key: 'totalGrossSalary',
    label: 'Total Gross Salary',
    icon: TrendingUp,
    gradient: 'from-emerald-500 via-green-600 to-teal-500',
    glow: 'shadow-green-400/40',
    filter: 'gross',
    isCurrency: true,
  },
  {
    key: 'totalNetSalary',
    label: 'Total Net Salary',
    icon: CreditCard,
    gradient: 'from-purple-500 via-violet-600 to-fuchsia-500',
    glow: 'shadow-purple-400/40',
    filter: 'net',
    isCurrency: true,
  },
  {
    key: 'totalPFAmount',
    label: 'Total PF Amount',
    icon: PiggyBank,
    gradient: 'from-orange-500 via-amber-500 to-yellow-500',
    glow: 'shadow-orange-400/40',
    filter: 'pf',
    isCurrency: true,
  },
  {
    key: 'totalESICAmount',
    label: 'Total ESIC Amount',
    icon: Shield,
    gradient: 'from-indigo-500 via-blue-600 to-sky-500',
    glow: 'shadow-indigo-400/40',
    filter: 'esic',
    isCurrency: true,
  },
  {
    key: 'totalAdvanceDeduction',
    label: 'Advance Deduction',
    icon: Wallet,
    gradient: 'from-rose-500 via-red-500 to-pink-500',
    glow: 'shadow-rose-400/40',
    filter: 'advance',
    isCurrency: true,
  },
  {
    key: 'totalPayrollAmount',
    label: 'Total Payroll',
    icon: Banknote,
    gradient: 'from-lime-500 via-green-500 to-emerald-600',
    glow: 'shadow-lime-400/40',
    filter: 'payroll',
    isCurrency: true,
  },
  {
    key: 'payrollMonth',
    label: 'Payroll Month',
    icon: Calendar,
    gradient: 'from-slate-600 via-gray-700 to-zinc-700',
    glow: 'shadow-slate-400/40',
    filter: 'month',
    isCurrency: false,
    isText: true,
  },
  {
    key: 'payrollStatus',
    label: 'Payroll Status',
    icon: CheckCircle,
    gradient: 'from-teal-500 via-cyan-600 to-blue-600',
    glow: 'shadow-cyan-400/40',
    filter: 'status',
    isCurrency: false,
    isStatus: true,
  },
];

export default function PayrollCards({ summary, activeCardFilter, onCardClick }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-9 gap-4">
      {CARDS.map((card) => {
        const Icon = card.icon;
        const isActive = activeCardFilter === card.filter;
        const val = summary[card.key];
        return (
          <div
            key={card.key}
            onClick={() => onCardClick(card.filter)}
            className={`
              relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient}
              p-4 cursor-pointer select-none
              shadow-lg ${card.glow}
              transition-all duration-300
              hover:-translate-y-1.5 hover:shadow-2xl hover:scale-[1.03]
              ${isActive ? 'ring-4 ring-white/60 scale-[1.04] -translate-y-1.5' : ''}
            `}
          >
            {/* Background orb */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full" />

            {/* Active indicator */}
            {isActive && (
              <div className="absolute top-2 left-2 w-2 h-2 bg-white rounded-full animate-ping" />
            )}

            <div className="relative z-10 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-white/80 text-xs font-semibold uppercase tracking-wide leading-tight">
                  {card.label}
                </p>
                <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl">
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </div>

              {card.isText ? (
                <p className="text-white font-bold text-sm leading-snug">{val || '—'}</p>
              ) : card.isStatus ? (
                <span className="inline-flex self-start mt-1 px-2 py-1 text-xs font-bold rounded-full bg-white text-gray-800 shadow">
                  {val || 'Pending'}
                </span>
              ) : (
                <p className="text-white font-extrabold text-lg leading-none">
                  <AnimatedValue value={val} isCurrency={card.isCurrency} />
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
