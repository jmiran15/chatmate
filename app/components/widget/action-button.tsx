import { Chatbot } from "@prisma/client";
import { Bot, Minimize } from "lucide-react";
import { useState } from "react";
import tinycolor from "tinycolor2";
import { cn } from "~/lib/utils";

export default function ActionButton({
  toggle,
  visible,
  chatbot,
}: {
  toggle: () => void;
  visible: boolean;
  chatbot: Chatbot;
}) {
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
      className="transition duration-300 transform hover:scale-110 p-3 rounded-full overflow-hidden border-none cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
      onClick={toggle}
    >
      {visible ? (
        <Minimize className="h-8 w-8 text-white" />
      ) : (
        <Bot className="h-8 w-8 text-white" />
      )}
    </button>
  );
}
