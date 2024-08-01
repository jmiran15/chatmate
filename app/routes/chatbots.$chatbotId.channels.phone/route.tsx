export default function Phone() {
  return <div className="p-4">Phone - Coming Soon</div>;
}

export const handle = {
  PATH: (chatbotId: string) => `/chatbots/${chatbotId}/channels/phone`,
  breadcrumb: "phone",
};
