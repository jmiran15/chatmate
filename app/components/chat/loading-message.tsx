export default function LoadingMessage() {
  return (
    <div
      key="loading-assistant"
      className="flex space-x-2 justify-center items-center bg-gray-200 w-min rounded-lg p-3 text-sm"
    >
      <div className="h-2 w-2 bg-gray-700 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="h-2 w-2 bg-gray-700 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="h-2 w-2 bg-gray-700 rounded-full animate-bounce"></div>
    </div>
  );
}
