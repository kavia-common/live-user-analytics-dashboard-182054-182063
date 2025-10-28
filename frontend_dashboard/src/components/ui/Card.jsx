import React from "react";
import "./Card.css";

/**
 * PUBLIC_INTERFACE
 * Card component with gradient accents, shadows, and hover effects.
 */
export default function Card({ 
  children, 
  className = "", 
  gradient = false,
  hover = false,
  padding = "md",
  ...props 
}) {
  const classes = [
    "ui-card",
    gradient && "ui-card--gradient",
    hover && "ui-card--hover",
    `ui-card--padding-${padding}`,
    className
  ].filter(Boolean).join(" ");

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
