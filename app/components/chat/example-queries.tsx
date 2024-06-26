// import { Chatbot } from "@prisma/client";
// import { useFetcher } from "@remix-run/react";
// import { Button } from "../ui/button";

// export default function ExampleQueries({
//   chatbot,
//   fetcher,
//   inputRef,
//   formRef,
// }: {
//   fetcher: ReturnType<typeof useFetcher>;
//   chatbot: Chatbot;
//   inputRef: React.RefObject<HTMLInputElement>;
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   formRef: any;
// }) {
//   const isSubmitting = fetcher.state === "submitting";

//   return (
//     <div className="flex flex-row gap-2 w-full  overflow-x-auto">
//       {chatbot.starterQuestions.map((question, index) => (
//         <Button
//           disabled={isSubmitting}
//           key={index}
//           variant="outline"
//           className="text-xs"
//           onClick={() => {
//             if (inputRef.current) {
//               inputRef.current.value = question;
//               // make a copy of the formRef
//               const newformRef = { ...formRef };
//               // set the value of the input field
//               newformRef.current["message"].value = question;

//               fetcher.submit(newformRef, { method: "POST" });
//             }
//           }}
//         >
//           {question}
//         </Button>
//       ))}
//     </div>
//   );
// }
