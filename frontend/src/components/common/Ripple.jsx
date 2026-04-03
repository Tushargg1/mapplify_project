import React from "react";

function cn(...parts) {
  return parts.filter(Boolean).join(" ");
}

const Ripple = React.memo(function Ripple({
  mainCircleSize = 210,
  mainCircleOpacity = 0.24,
  numCircles = 8,
  className,
  ...props
}) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 select-none",
        className,
      )}
      style={{
        WebkitMaskImage: "linear-gradient(to bottom, white, transparent)",
        maskImage: "linear-gradient(to bottom, white, transparent)",
      }}
      {...props}
    >
      {Array.from({ length: numCircles }, (_, i) => {
        const size = mainCircleSize + i * 200;
        const opacity = mainCircleOpacity - i * 0.010;
        const animationDelay = `${i * 0.06}s`;
        const borderStyle = "solid";

        return (
          <div
            key={i}
            className="animate-ripple absolute rounded-full border bg-(--page-fg)/25 shadow-xl"
            style={{
              "--i": i,
              width: `${size}px`,
              height: `${size}px`,
              opacity,
              animationDelay,
              borderStyle,
              borderWidth: "1px",
              borderColor: "var(--page-fg)",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%) scale(1)",
            }}
          />
        );
      })}
    </div>
  );
});

Ripple.displayName = "Ripple";

export { Ripple };