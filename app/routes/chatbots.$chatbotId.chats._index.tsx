import InboxIndexLg from "~/components/indexes/inbox-lg";
import { useMobileScreen } from "~/utils/mobile";

export default function ChatsIndex() {
  const isMobile = useMobileScreen();

  if (isMobile) return null;

  return (
    <div className="h-full col-span-7 flex flex-col items-center md:justify-center justify-start p-4 lg:p-6 overflow-y-auto">
      <InboxIndexLg />
    </div>
  );
}
