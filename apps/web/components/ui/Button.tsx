import React, { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "tertiary";

type ButtonProps = {
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export const Button: React.FC<ButtonProps> = ({
  children,
  className = "",
  variant = "primary",
  ...props
}) => {
  return (
    <button className={`btn ${variant} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
};
