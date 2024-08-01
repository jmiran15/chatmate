export default function HistoricalMessage({ message }: { message: string }) {
  return (
    <div
      className={`w-auto max-w-[75%] h-fit py-[17px] px-[20px] relative inline-block rounded-[10px] mb-[16px] bg-[#f2f2f2] text-black`}
    >
      <span className="whitespace-normal break-words flex flex-col gap-y-1 text-[14px] leading-[1.4] min-h-[10px]">
        {message}
      </span>
    </div>
  );
}
