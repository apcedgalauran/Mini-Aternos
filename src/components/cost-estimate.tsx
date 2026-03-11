'use client';

import { useState, useEffect } from 'react';

export function CostEstimate({
  startTime,
  priceHourly,
}: {
  startTime: string | null;
  priceHourly: number;
}) {
  const [cost, setCost] = useState('$0.000');

  useEffect(() => {
    if (!startTime) {
      setCost('$0.000');
      return;
    }

    const start = new Date(startTime).getTime();

    const interval = setInterval(() => {
      const hoursElapsed = (Date.now() - start) / 3600000;
      const currentCost = hoursElapsed * priceHourly;
      setCost(`$${currentCost.toFixed(4)}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, priceHourly]);

  return <span className="font-mono text-lg font-semibold text-emerald-400">{cost}</span>;
}
