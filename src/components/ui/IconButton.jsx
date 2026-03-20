import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function IconButton({ icon, tooltip, onClick, variant = "ghost", size = "icon", className = "", disabled = false, id, ...props }) {
  const iconElement = React.isValidElement(icon)
    ? icon
    : React.createElement(icon, { className: "w-4 h-4" });

  const button = (
    <Button
      id={id}
      variant={variant}
      size={size}
      onClick={onClick}
      className={className}
      disabled={disabled}
      {...props}
    >
      {iconElement}
    </Button>
  );

  if (!tooltip) {
    return button;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {button}
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}