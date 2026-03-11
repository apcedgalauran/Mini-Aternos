'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePlans } from '@/lib/hooks';

interface PlanSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export function PlanSelector({ value, onValueChange, disabled }: PlanSelectorProps) {
  const { data: plans } = usePlans();

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select VPS plan" />
      </SelectTrigger>
      <SelectContent>
        {(plans || []).map((plan) => (
          <SelectItem key={plan.slug} value={plan.slug}>
            <div className="flex items-center justify-between gap-4 w-full">
              <span>{plan.label}</span>
              <span className="text-xs text-slate-400">
                ${plan.priceHourly}/hr &middot; {plan.disk} GB SSD
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
