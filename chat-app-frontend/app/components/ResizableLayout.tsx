import { useState, useRef, ReactNode } from "react";

interface ResizableLayoutProps {
  leftComponent: ReactNode;
  rightComponent: ReactNode;
}

const ResizableLayout: React.FC<ResizableLayoutProps> = ({ leftComponent, rightComponent }) => {
  const [leftWidth, setLeftWidth] = useState<number>(window.innerWidth * 0.4);
  const isDraggingRef = useRef<boolean>(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    document.body.style.userSelect = "none";

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (isDraggingRef.current) {
        const newWidth = Math.max(250, Math.min(moveEvent.clientX, window.innerWidth - 300));
        setLeftWidth(newWidth);
      }
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.userSelect = "auto";
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Left Section */}
      <div
        className="flex-shrink-0 bg-black border-r border-gray-300 p-2"
        style={{ width: `${leftWidth}px`, minWidth: "250px", maxWidth: "75vw" }}
      >
        {leftComponent}
      </div>

      {/* Resizable Divider */}
      <div
        className="cursor-col-resize bg-gray-400 w-[6px] hover:bg-white transition"
        onMouseDown={handleMouseDown}
      />

      {/* Right Section */}
      <div className="flex-grow bg-black">{rightComponent}</div>
    </div>
  );
};

export default ResizableLayout;
