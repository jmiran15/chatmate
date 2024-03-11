import { useEffect, useState } from "react";

export const SSEComponent = () => {
  const [data, setData] = useState("");

  useEffect(() => {
    const eventSource = new EventSource("/api/chat/t");
    eventSource.onmessage = (event) => {
      const newData = JSON.parse(event.data);
      console.log("New Data:", newData);

      // Append new data to the existing data
      setData((prevData) => prevData + newData);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div>
      <p>Streamed Data: {data}</p>
    </div>
  );
};

export default SSEComponent;
