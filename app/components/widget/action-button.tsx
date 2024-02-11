import { Bot, Minimize } from "lucide-react";

export default function ActionButton({
  toggle,
  visible,
}: {
  toggle: () => void;
  visible: boolean;
}) {
  return (
    <button
      className="bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-400 transition duration-300 transform hover:scale-110 p-3 rounded-full overflow-hidden border-none cursor-pointer"
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
