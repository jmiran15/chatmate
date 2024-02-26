export default function Preview({
  primaryColor,
  publicName,
  starterMessages,
}: {
  primaryColor: string;
  publicName: string;
  starterMessages: string[];
}) {
  return (
    <div className="w-96 bg-white rounded-md shadow-md flex flex-col transition-all text-sm h-[70vh] max-h-[70vh] duration-300 overflow-hidden border-none">
      <div
        className={`flex justify-between items-center p-4 rounded-t-md text-white`}
        style={{ backgroundColor: primaryColor }}
      >
        <h3 className="m-0 text-lg">{publicName}</h3>
        <button className="bg-transparent border-none text-white cursor-pointer">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>{" "}
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        {starterMessages.map((message, index) => (
          <div
            key={index}
            className="bg-gray-200 text-black rounded-lg py-2 px-4 max-w-[70%] w-fit mb-3"
          >
            {message}
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-4 items-center">
          <input
            type="text"
            className="flex-1 border border-gray-300 rounded-md px-4 py-2 outline-none w-3/4"
            placeholder="Type your message..."
          />
          <button
            className={`text-white rounded-md px-4 py-2 cursor-pointer`}
            style={{ backgroundColor: primaryColor }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
