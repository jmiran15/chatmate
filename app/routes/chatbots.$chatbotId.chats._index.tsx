import InboxIndexLg from "~/components/indexes/inbox-lg";

export default function ChatsIndex() {
  return (
    <div className="h-full col-span-7 flex flex-col items-center md:justify-center justify-start p-4 lg:p-6 overflow-y-auto">
      <InboxIndexLg />
    </div>
  );
}
