export default function Flows() {
  return <div className="p-4">Flows - coming soon</div>;
}

export const handle = {
  PATH: (chatbotId: string) => `/chatbots/${chatbotId}/flows`,
  breadcrumb: "flows",
};
