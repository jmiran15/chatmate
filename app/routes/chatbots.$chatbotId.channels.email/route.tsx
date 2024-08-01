export default function Email() {
  return <div className="p-4">Email - Coming Soon</div>;
}

export const handle = {
  PATH: (chatbotId: string) => `/chatbots/${chatbotId}/channels/email`,
  breadcrumb: "email",
};
