import { useNavigation } from "@remix-run/react";

export function useIsPending({ intent }: { intent: string }) {
  const navigation = useNavigation();
  const isPendingState = navigation.state !== "idle";
  const isPendingIntent = navigation.formData?.get("intent") === intent;
  return isPendingState && isPendingIntent;
}
