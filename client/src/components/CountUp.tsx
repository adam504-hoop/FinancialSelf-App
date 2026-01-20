import { useEffect, useState } from "react";

interface CountUpProps {
  value: number;
  className?: string;
  prefix?: string;
}

export function CountUp({ value, className, prefix = "" }: CountUpProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1500; // 1.5 detik
    const startValue = 0;
    const endValue = value;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Rumus Easing: Keluar Cepat, Melambat di Akhir
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      const currentVal = startValue + (endValue - startValue) * easeProgress;
      setDisplayValue(currentVal);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [value]);

  // Format Rupiah di dalam komponen
  const formatted = new Intl.NumberFormat('id-ID', { 
      maximumFractionDigits: 0 
  }).format(displayValue);

  return (
    <span className={className}>
      {prefix}{formatted}
    </span>
  );
}