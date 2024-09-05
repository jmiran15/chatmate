import { DateTime } from "luxon";

export const DateSeparator = ({ date }: { date: Date }) => {
  const messageDate = DateTime.fromJSDate(date);
  const now = DateTime.local();

  let formattedDate;
  if (messageDate.hasSame(now, "day")) {
    formattedDate = "Today";
  } else if (messageDate.hasSame(now.minus({ days: 1 }), "day")) {
    formattedDate = "Yesterday";
  } else {
    formattedDate = messageDate.toFormat("MMMM d, yyyy");
  }

  return (
    <div className="flex items-center justify-center my-4">
      <div className="bg-gray-200 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">
        {formattedDate}
      </div>
    </div>
  );
};
