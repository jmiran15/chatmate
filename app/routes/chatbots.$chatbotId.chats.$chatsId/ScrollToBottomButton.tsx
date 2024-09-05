import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown } from "lucide-react";

const ScrollToBottomButton = ({
  isVisible,
  onClick,
  promptInputHeight,
}: {
  isVisible: boolean;
  onClick: () => void;
  promptInputHeight: number;
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, y: 20, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: 20, x: "-50%" }}
          transition={{ duration: 0.2 }}
          whileHover={{ scale: 1.1 }}
          className="absolute left-1/2 bg-white text-gray-600 rounded-full p-2 shadow-lg hover:bg-muted"
          onClick={onClick}
          aria-label="Scroll to bottom"
          style={{
            boxShadow:
              "0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)",
            bottom: `${promptInputHeight + 16}px`,
          }}
        >
          <ArrowDown size={20} />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default ScrollToBottomButton;
