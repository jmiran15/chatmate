import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { Theme } from "~/registry/themes";

interface Config {
  theme: Theme["name"];
  radius: number;
}

const configAtom = atomWithStorage<Config>("config", {
  theme: "zinc",
  radius: 0.5,
});

export function useConfig() {
  return useAtom(configAtom);
}
