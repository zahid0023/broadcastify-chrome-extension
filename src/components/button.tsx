import React from "react";

type ButtonProps = {
    children: React.ReactNode;
    onClick?: () => void;
    type?: "button" | "submit" | "reset";
};

export default function Button({ children, onClick, type = "button" }: ButtonProps) {
    return (
        <button
            type={type}
            onClick={onClick}
            className="w-[140px] px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
            {children}
        </button>
    );
}