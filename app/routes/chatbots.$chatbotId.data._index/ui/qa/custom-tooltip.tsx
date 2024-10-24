import {
  autoUpdate,
  flip,
  offset,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import React, { useRef, useState } from "react";

interface CustomTooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
}

export function CustomTooltip({ content, children }: CustomTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipContentRef = useRef<HTMLDivElement | null>(null);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      offset(5),
      flip({ fallbackAxisSideDirection: "start" }),
      shift({ padding: 5 }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(context, {
    handleClose: null,
    delay: { open: 0, close: 150 },
  });

  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "tooltip" });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ]);

  return (
    <>
      {React.cloneElement(children, {
        ref: refs.setReference,
        ...getReferenceProps(),
      })}
      {isOpen && (
        <div
          ref={(el) => {
            refs.setFloating(el);
            tooltipContentRef.current = el;
          }}
          style={floatingStyles}
          {...getFloatingProps()}
          className="z-50 rounded-md bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md border"
        >
          {content}
        </div>
      )}
    </>
  );
}
