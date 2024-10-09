export default function PolicyWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  // "container mx-auto px-4 py-8 h-full flex flex-col gap-4 sm:gap-8 overflow-y-auto no-scrollbar",

  return (
    <div className="container mx-auto px-4 py-8 h-full flex flex-col overflow-y-auto no-scrollbar prose-sm prose-zinc max-w-5xl">
      {children}
    </div>
  );
}
