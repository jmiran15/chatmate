// // this page /chatbots shows a list of your chatbots and has a button that takes you to /chatbots/new where you can create a new chatbot

// // import React from "react";
// // import { ProjectCard } from "../../componentsv2/ProjectCard";
// import {
//   Stack,
//   Button,
//   Modal,
//   TextInput,
//   Card,
//   Center,
//   Text,
// } from "@mantine/core";
// // import "react-tiny-fab/dist/styles.css";
// // import { supabaseClient } from "../../utilsv2/supabase";
// // import { v4 as uuidv4 } from "uuid";
// // import { useAuth } from "@clerk/clerk-react";
// // import { useForm } from "@mantine/form";
// // import { useDisclosure } from "@mantine/hooks";
// // import useProjects from "../../hooks/useProjects";
// // import { useNavigate } from "react-router-dom";

// import type { LoaderFunctionArgs } from "@remix-run/node";
// import { json } from "@remix-run/node";
// import { Form, Link, NavLink, Outlet, useLoaderData } from "@remix-run/react";
// import { getChatbotsByUserId } from "~/models/chatbot.server";

// import { requireUserId } from "~/session.server";
// import { useUser } from "~/utils";

// export const loader = async ({ request }: LoaderFunctionArgs) => {
//   const userId = await requireUserId(request);
//   const chatbots = await getChatbotsByUserId({ userId });
//   return json({ chatbots });
// };

// export default function Chatbots() {
//   const data = useLoaderData<typeof loader>();
//   const user = useUser();

//   // const { userId } = useAuth();
//   // const navigate = useNavigate();
//   // const projects = useProjects(userId);
//   // const [openedNew, { open: openNew, close: closeNew }] = useDisclosure(false);

//   // const newProjectForm = useForm({
//   //   initialValues: {
//   //     name: "",
//   //   },

//   //   validate: {
//   //     name: (value: string) =>
//   //       value.trim().length > 0 ? null : "Name is required",
//   //   },
//   // });

//   // function handleNewProject({ name }: { name: string }) {
//   //   supabaseClient
//   //     .from("projects")
//   //     .insert([{ id: uuidv4(), name, user: userId }])
//   //     .select()
//   //     .then(({ data, error }) => {
//   //       if (error) {
//   //         console.log(error);
//   //         return;
//   //       }
//   //       if (data[0]?.id) {
//   //         navigate(`/projects/${data[0].id}`);
//   //       }
//   //     });
//   // }

//   return (
//     <Stack w="100%" p="xl">
//       <Modal opened={openedNew} onClose={closeNew} title="Create a new project">
//         <form onSubmit={newProjectForm.onSubmit(handleNewProject)}>
//           <Stack>
//             <TextInput
//               label="Project name"
//               {...newProjectForm.getInputProps("name")}
//             />
//             <Button
//               style={{
//                 alignSelf: "flex-end",
//               }}
//               type="submit"
//               color="blue.9"
//               size="md"
//               radius="md"
//             >
//               Create
//             </Button>
//           </Stack>
//         </form>
//       </Modal>

//       {/* <Button
//         style={{
//           alignSelf: "flex-end",
//         }}
//         size="md"
//         color="blue.9"
//         radius="md"
//         onClick={openNew}
//       >
//         Create a new project
//       </Button> */}

//       <Link to="new" className="block p-4 text-xl text-blue-500">
//         + New Chatbot
//       </Link>

//       {data.chatbots.length === 0 ? (
//         <p className="p-4">No chatbots yet</p>
//       ) : (
//         <ol>
//           {data.chatbots.map((chatbot) => (
//             <li key={chatbot.id}>
//               <Link to={chatbot.id}>
//                 {chatbot.name}
//                 {chatbot.createdAt}
//               </Link>
//             </li>
//           ))}
//         </ol>
//       )}
//     </Stack>
//   );
// }
