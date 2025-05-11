import React from "react";

interface ButtonProps {
  name: string;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  name,
  onClick,
  className = "",
  disabled = false,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`bg-blue-800 text-white rounded-2xl transition-all mt-4 ml-2
        hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed ${className}`}
    >
      {name}
    </button>
  );
};

export default Button;
