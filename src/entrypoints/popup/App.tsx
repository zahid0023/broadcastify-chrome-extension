import { useState } from "react";
import "./style.css";

export default function App() {
  const [status, setStatus] = useState("idle");

  const startCapture = () => {
    setStatus("capturing");
    chrome.runtime.sendMessage({ type: "START_RECORDING" });
  };

  return (
    <div className="w-[380px] p-4 font-sans text-black">

      {/* Top Header Section */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="logo" className="w-10 h-10 rounded" />
          <h1 className="text-lg font-bold">Capture & Transcribe</h1>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t-2 border-red-800 mb-4"></div>

      {/* Central Button */}
      <div className="flex justify-center">
        <button
          onClick={startCapture}
          className="w-40 py-2 border border-black rounded-md bg-white hover:bg-gray-100 active:scale-[0.98] transition font-medium shadow-sm"
        >
          {status === "idle" && "Start Capture"}
          {status === "capturing" && "Capturing..."}
        </button>
      </div>

      {/* Description Text */}
      <p className="text-[11px] mt-4 text-center leading-relaxed max-w-[240px] mx-auto line-clamp-2">
        After capture is finished, a new tab will be opened automatically for you to
        name and save the file. Please do not close the tab before saving the file!
      </p>

      {/* Hotkey Section */}
      <div className="mt-5 space-y-1">
        <h3 className="font-semibold text-base">Hotkeys</h3>

        <div className="bg-gray-100 p-2 rounded-md border border-gray-300">
          <p className="text-sm">
            <span className="font-medium">Ctrl + Shift + S</span> — Start capture
          </p>
          <p className="text-sm">
            <span className="font-medium">Ctrl + Shift + X</span> — Stop capture
          </p>
        </div>

         <p className="text-[11px] mt-4 text-center leading-relaxed max-w-[240px] mx-auto line-clamp-2">
          Hotkeys may not work if another extension uses the same shortcut.
          Maximum capture duration is 30 minutes due to Chrome memory constraints.
        </p>
      </div>

      {/* Footer Links */}
      <div className="flex justify-between mt-6">
        <a className="text-blue-600 underline text-sm cursor-pointer hover:opacity-80">
          Options
        </a>
        <a className="text-blue-600 underline text-sm cursor-pointer hover:opacity-80">
          Transcribe File
        </a>
      </div>
    </div>
  );
}
