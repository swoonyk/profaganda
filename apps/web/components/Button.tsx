import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
  children: React.ReactNode;
};

const styles: Record<string, React.CSSProperties> = {
  base: {
    padding: "8px 16px",
    borderRadius: "4px",
    outline: "none",
    transition: "background-color 0.2s",
    fontWeight: 500,
    border: "none",
    cursor: "pointer",
  },
  primary: {
    backgroundColor: "#2563eb",
    color: "#fff",
  },
  secondary: {
    backgroundColor: "#e5e7eb",
    color: "#1f2937",
  },
  primaryHover: {
    backgroundColor: "#1d4ed8",
  },
  secondaryHover: {
    backgroundColor: "#d1d5db",
  },
};

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  children,
  className = "",
  ...props
}) => {
  const [hover, setHover] = React.useState(false);

  let style = {
    ...styles.base,
    ...(variant === "primary" ? styles.primary : styles.secondary),
    ...(hover
      ? variant === "primary"
        ? styles.primaryHover
        : styles.secondaryHover
      : {}),
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

export default Button;
