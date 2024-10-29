import { motion } from "framer-motion";
import { Check } from "lucide-react";

export function FormSubmissionMessage() {
    return (
      <div className="flex flex-col items-start space-y-3">
        <motion.div
          className="flex items-center space-x-2"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <div className="bg-blue-100 rounded-full p-1">
            <Check className="w-5 h-5 text-blue-500" />
          </div>
          <span className="whitespace-normal flex flex-col gap-y-1 text-[14px] leading-[1.4] min-h-[10px] font-medium">
            Thank you for your submission!
          </span>
        </motion.div>
      </div>
    );
  }