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
            className="w-30 py-2 mx-auto block border-2 border-red-700 rounded-md text-red-700 font-bold text-sm hover:bg-red-400 hover:text-white active:scale-[0.98] transition"
        >
            {children}
        </button>
    );
}