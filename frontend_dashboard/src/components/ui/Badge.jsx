import React from "react";
import "./Badge.css";

/**
 * PUBLIC_INTERFACE
 * Badge component for labels, status indicators, and metadata display.
 */
export default function Badge({ 
  children, 
  variant = "default",
  size = "md",
  icon = null,
  className = "",
  ...props 
}) {
  const classes = [
    "ui-badge",
    `ui-badge--${variant}`,
    `ui-badge--${size}`,
    className
  ].filter(Boolean).join(" ");

  return (
    <span className={classes} {...props}>
      {icon && <span className="ui-badge__icon">{icon}</span>}
      <span className="ui-badge__text">{children}</span>
    </span>
  );
}
