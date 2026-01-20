"use client";

import clsx from "clsx";
import { Minus, Plus } from "lucide-react";
import { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface QuantityProps {
  className?: string;
  max?: number;
  min?: number;
  onValueChange: (value: number) => void;
  renderLeftIcon?: () => ReactNode;
  renderRightIcon?: () => ReactNode;
  inputProps?: React.ComponentProps<"input">;
}

const QuantityInput = ({
  onValueChange,
  inputProps,
  className,
  renderRightIcon,
  renderLeftIcon,
  ...props
}: QuantityProps) => {
  const { min = 1, max = 99 } = props;

  const clamp = (num: number) => Math.max(min, Math.min(max, num));
  const handleIncrement = () => {
    const newValue = clamp((inputProps?.value as number) + 1 || min);
    onValueChange?.(newValue);
  };

  const handleDecrement = () => {
    const newValue = clamp((inputProps?.value as number) - 1 || min);
    onValueChange?.(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val)) val = min;
    val = clamp(val);
    onValueChange?.(val);
  };

  return (
    <div
      className={clsx(
        "shadow-xs flex h-9 w-full items-center overflow-hidden rounded-full border",
        className,
      )}
      aria-label="quantity"
    >
      <Button
        onClick={handleDecrement}
        variant="ghost"
        type="button"
        size="icon"
        className="shrink-0 rounded-none"
      >
        {renderLeftIcon?.() ?? <Minus />}
      </Button>
      <Input
        type="number"
        min={min}
        max={max}
        className="w-full min-w-10 flex-1 rounded-none border-0 !bg-inherit px-1 text-center shadow-none [appearance:textfield] focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        value={inputProps?.value ?? min}
        onChange={handleInputChange}
        {...inputProps}
      />
      <Button
        onClick={handleIncrement}
        variant="ghost"
        type="button"
        size="icon"
        className="shrink-0 rounded-none"
      >
        {renderRightIcon?.() ?? <Plus />}
      </Button>
    </div>
  );
};

export default QuantityInput;
