import React from "react";
import "./Button.css";

/**
 * PUBLIC_INTERFACE
 * Button component with variants (primary, secondary, ghost, danger), sizes, and states.
 */
export default function Button({ 
  children, 
  variant = "primary",
  size = "md",
  icon = null,
  iconPosition = "left",
  loading = false,
  disabled = false,
  className = "",
  ...props 
}) {
  const classes = [
    "ui-button",
    `ui-button--${variant}`,
    `ui-button--${size}`,
    loading && "ui-button--loading",
    disabled && "ui-button--disabled",
    icon && `ui-button--with-icon-${iconPosition}`,
    className
  ].filter(Boolean).join(" ");

  return (
    <button 
      className={classes} 
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="ui-button__spinner" />}
      {!loading && icon && iconPosition === "left" && (
        <span className="ui-button__icon">{icon}</span>
      )}
      <span className="ui-button__text">{children}</span>
      {!loading && icon && iconPosition === "right" && (
        <span className="ui-button__icon">{icon}</span>
      )}
    </button>
  );
}
