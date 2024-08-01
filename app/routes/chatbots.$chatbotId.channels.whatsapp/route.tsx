export default function Whatsapp() {
  return <div className="p-4">Whatsapp - Coming Soon</div>;
}

export const handle = {
  PATH: (chatbotId: string) => `/chatbots/${chatbotId}/channels/whatsapp`,
  breadcrumb: "whatsapp",
};
