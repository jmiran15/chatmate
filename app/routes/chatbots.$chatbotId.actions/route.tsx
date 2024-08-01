export default function Actions() {
  return <div className="p-4">Actions - coming soon</div>;
}

export const handle = {
  PATH: (chatbotId: string) => `/chatbots/${chatbotId}/actions`,
  breadcrumb: "actions",
};
