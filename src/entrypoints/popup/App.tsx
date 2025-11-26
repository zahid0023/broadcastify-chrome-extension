import "./style.css";
import Button from "../../components/button";
import { useState } from "react";

export default function App() {
  const [isRecording, setIsRecording] = useState(false);

  function handleButtonClick() { setIsRecording(!isRecording); }

  return (
    <div className="w-[380px] p-4 font-sans text-black">

      {/* Top Header Section */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="logo" className="w-10 h-10 rounded" />
          <h1 className="text-2xl font-bold">Capture & Transcribe</h1>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t-2 border-red-800 mb-4"></div>

      {/* Central Buttons */}
      <div>
  {!isRecording ? (

    // NOT RECORDING UI
    <Button onClick={handleButtonClick}>
      Start Capture
    </Button>

  ) : (

    // RECORDING UI
    <div>

      <div className="text-center mb-3">
        <p className="text-[22px] font-semibold text-black">
          Tab is currently being captured
        </p>
      </div>

      <div className="flex justify-center gap-4">
        <Button onClick={handleButtonClick}>Cancel</Button>
        <Button onClick={handleButtonClick}>Stop</Button>
      </div>

    </div>

  )}
</div>


      {/* Description Text */}
      <p className="text-[10px] mt-4 leading-relaxed mx-auto">
        After capture is finished,a new tab will be opened automatically for you to
        name and save the file. Please do not close the tab before saving the file!
      </p>

      {/* Hotkey Section */}
      <div className="mt-5 space-y-1">
        <h3 className="font-semibold text-base">Hotkeys</h3>

        <div className="bg-gray-100 p-2 rounded-md border border-gray-300">
          <p className="text-sm">
            <span className="font-medium">Ctrl + Shift + S</span> —to Start capture on current tab
          </p>
          <p className="text-sm">
            <span className="font-medium">Ctrl + Shift + X</span> —to Stop capture on current tab
          </p>
        </div>

        <p className="text-[11px] mt-4 leading-relaxed mx-auto">
          Hotkeys may not work if another extension uses them.
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
