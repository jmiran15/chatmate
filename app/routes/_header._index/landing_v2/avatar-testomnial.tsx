import { motion } from "framer-motion";
import { Star } from "lucide-react";

const avatarUrls = [
  "https://avatars.githubusercontent.com/u/16860528",
  "https://avatars.githubusercontent.com/u/20110627",
  "https://avatars.githubusercontent.com/u/106103625",
  "https://avatars.githubusercontent.com/u/59228569",
  "https://avatars.githubusercontent.com/u/1234567",
];

const ease = [0.16, 1, 0.3, 1];

export function AvatarCirclesDemo() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center space-y-4 mt-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.0, duration: 0.8, ease }}
    >
      <div className="flex items-center space-x-2">
        <div className="flex -space-x-3 rtl:space-x-reverse">
          {avatarUrls.map((url, index) => (
            <motion.img
              key={index}
              className="h-10 w-10 rounded-full border-2 border-background"
              src={url}
              width={40}
              height={40}
              alt={`Avatar ${index + 1}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2 + index * 0.1, duration: 0.5, ease }}
            />
          ))}
        </div>
        <div className="flex flex-col items-start ml-4">
          <div className="flex">
            {[...Array(5)].map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.5 + index * 0.1, duration: 0.5, ease }}
              >
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              </motion.div>
            ))}
          </div>
          <motion.p
            className="text-sm text-muted-foreground mt-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.0, duration: 0.5, ease }}
          >
            Trusted by +1000 makers
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}
