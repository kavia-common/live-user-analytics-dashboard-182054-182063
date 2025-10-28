import React from "react";
import "./Switch.css";

/**
 * PUBLIC_INTERFACE
 * Switch component for toggle controls (e.g., theme switcher).
 */
export default function Switch({ 
  checked = false, 
  onChange, 
  label = "",
  disabled = false,
  className = "",
  ...props 
}) {
  return (
    <label className={`ui-switch ${className} ${disabled ? "ui-switch--disabled" : ""}`}>
      <input
        type="checkbox"
        className="ui-switch__input"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        {...props}
      />
      <span className="ui-switch__slider" />
      {label && <span className="ui-switch__label">{label}</span>}
    </label>
  );
}
