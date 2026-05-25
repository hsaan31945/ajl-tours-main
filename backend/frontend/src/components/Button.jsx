import React from "react";

const Button = ({ children, className = "", ...props }) => (
  <button className={`button-31 ${className}`.trim()} {...props}>
    {children}
  </button>
);

export default Button; 