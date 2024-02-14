import { Chatbot } from "@prisma/client";
import { Bot, Minimize } from "lucide-react";
import { useState } from "react";
import tinycolor from "tinycolor2";

export default function ActionButton({
  isOpen,
  toggleOpen,
  chatbot,
}: {
  isOpen: boolean;
  toggleOpen: () => void;
  chatbot: Chatbot;
}) {
  // can move this stuff into a hook
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const hslColor = tinycolor(chatbot.color).toHsl();
  hslColor.l -= 0.1;
  const hoverColor = tinycolor(hslColor).toHexString();

  const hslActiveColor = tinycolor(chatbot.color).toHsl();
  hslActiveColor.l -= 0.2;
  const activeColor = tinycolor(hslActiveColor).toHexString();

  const buttonStyle = {
    backgroundColor: isActive
      ? activeColor
      : isHovered
      ? hoverColor
      : chatbot.color,
  };

  return (
    <button
      style={buttonStyle}
      aria-label="Toggle Menu"
      className={`flex items-center justify-center p-4 rounded-full transition duration-300 transform hover:scale-110 cursor-pointer border-none`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
      onClick={toggleOpen}
    >
      {isOpen ? (
        <Minimize className="h-8 w-8 text-white" />
      ) : (
        <Bot className="h-8 w-8 text-white" />
      )}
    </button>
  );
}
