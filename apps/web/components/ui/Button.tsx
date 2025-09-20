import React, { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonProps = {
    children: ReactNode;
    className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const buttonStyle: React.CSSProperties = {
    padding: '0.5rem 1.25rem',
    backgroundColor: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '0.375rem',
    fontSize: '1rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 0.2s',
    outline: 'none',
    display: 'inline-block',
};

const hoverStyle: React.CSSProperties = {
    backgroundColor: '#1d4ed8',
};

export const Button: React.FC<ButtonProps> = ({
    children,
    className,
    ...props
}) => {
    const [hover, setHover] = React.useState(false);

    return (
        <button
            style={hover ? { ...buttonStyle, ...hoverStyle } : buttonStyle}
            className={className}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            {...props}
        >
            {children}
        </button>
    );
};