import React, { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "tertiary";

type ButtonProps = {
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const baseStyle: React.CSSProperties = {
  padding: "0.5rem 2rem",
  borderRadius: "12px",
  fontWeight: 500,
  cursor: "pointer",
  transition: "120ms ease-out",
  display: "inline-block",
  height: "55px",
  fontSize: "20px",
};

const activeStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    boxShadow: "0 2px 0 #007658",
    transform: "translateY(4px)",
  },
  secondary: {
    boxShadow: "0 2px 0 #A6A6A6",
    transform: "translateY(4px)",
  },
  tertiary: {
    boxShadow: "0 2px 0 #082E53",
    transform: "translateY(4px)",
  },
};

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: "#0AD6A1",
    color: "#000",
    boxShadow: "0 6px 0 #007658",
  },
  secondary: {
    backgroundColor: "#ffffff",
    color: "#000000",
    boxShadow: "0 6px 0 #A6A6A6",
  },
  tertiary: {
    backgroundColor: "#2B5D8E",
    color: "#ffffff",
    boxShadow: "0 6px 0 #082E53",
  },
};
const hoverStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: "#09af83ff",
  },
  secondary: {
    backgroundColor: "#cfd1d6ff",
  },
  tertiary: {
    backgroundColor: "#1f4c79ff",
  },
};

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = "primary",
  ...props
}) => {
  const [hover, setHover] = React.useState(false);
  const [active, setActive] = React.useState(false);

  const style = {
    ...baseStyle,
    ...variantStyles[variant],
    ...(hover ? hoverStyles[variant] : {}),
    ...(active ? activeStyles[variant] : {}),
  };

  return (
    <button
      style={style}
      className={`${variant} ${className ?? ""}`.trim()}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setActive(false);
      }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      onBlur={() => setActive(false)}
      {...props}
    >
      {children}
    </button>
  );
};
