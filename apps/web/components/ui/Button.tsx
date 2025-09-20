import React, { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary";

type ButtonProps = {
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const baseStyle: React.CSSProperties = {
  padding: "0.5rem 1.25rem",
  border: "none",
  borderRadius: "0.375rem",
  fontSize: "1rem",
  fontWeight: 500,
  cursor: "pointer",
  transition: "background 0.2s",
  outline: "none",
  display: "inline-block",
  boxShadow: "0 6px 0 #007658",
  height: "61px",
  width: "300px",
  fontSize: "24px",
};

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: "#0AD6A1",
    color: "#000",
  },
  secondary: {
    backgroundColor: "#ffffff",
    color: "#000000",
    boxShadow: "0 6px 0 #A6A6A6",
  },
};

const hoverStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    // backgroundColor: "#1d4ed8",
  },
  secondary: {
    // backgroundColor: "#e5e7eb",
  },
};

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = "primary",
  ...props
}) => {
  const [hover, setHover] = React.useState(false);

  const style = {
    ...baseStyle,
    ...variantStyles[variant],
    ...(hover ? hoverStyles[variant] : {}),
  };

  return (
    <button
      style={style}
      className={className}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      {...props}
    >
      {children}
    </button>
  );
};
