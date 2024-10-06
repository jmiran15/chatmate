export default function Description({
  children,
}: {
  children: React.ReactNode;
}) {
  return <p className="leading-7 text-muted-foreground">{children}</p>;
}
