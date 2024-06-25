import InboxIndexMd from "~/components/indexes/inbox-md";
import { useMobileScreen } from "~/utils/mobile";

export function EmptyState() {
  const isMobile = useMobileScreen();
  return isMobile ? (
    <InboxIndexMd />
  ) : (
    <p className="text-sm text-muted-foreground self-start w-full">
      This is where you will see all incoming messages from your customers.
    </p>
  );
}
