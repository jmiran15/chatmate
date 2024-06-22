// import { LoaderFunctionArgs, redirect } from "@remix-run/node";
// import InboxIndexLg from "~/components/indexes/inbox-lg";
// import { getFirstPublicChat, getPublicChatsCount } from "~/models/chat.server";
// import { requireUserId } from "~/session.server";

// export const loader = async ({ params, request }: LoaderFunctionArgs) => {
//   await requireUserId(request);
//   const { chatbotId } = params;

//   if (!chatbotId) {
//     throw new Error("chatbotId is required");
//   }

//   const totalChatsCount = await getPublicChatsCount({ chatbotId });

//   if (totalChatsCount > 0) {
//     const chat = await getFirstPublicChat({ chatbotId });
//     if (chat) {
//       return redirect(`/chatbots/${chatbotId}/chats/${chat.id}`);
//     } else {
//       return null;
//     }
//   } else {
//     return null;
//   }
// };

// export default function ChatsIndex() {
//   return (
//     <div className="h-full col-span-7 flex flex-col items-center md:justify-center justify-start p-4 lg:p-6 overflow-y-auto">
//       <InboxIndexLg />
//     </div>
//   );
// }

const T = () => <p>index</p>;
export default T;
