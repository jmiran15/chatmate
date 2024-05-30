import { useNavigation } from "@remix-run/react";

export function useIsPending() {
  const navigation = useNavigation();
  const isPendingState = navigation.state !== "idle";

  return isPendingState;
}
