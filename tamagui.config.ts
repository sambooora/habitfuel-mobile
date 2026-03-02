import { defaultConfig } from "@tamagui/config/v5";
import { createAnimations } from "@tamagui/animations-react-native";
import { createTamagui } from "tamagui";

const animations = createAnimations({
  fast: {
    type: "spring",
    damping: 20,
    mass: 1.2,
    stiffness: 250,
  },
  medium: {
    type: "spring",
    damping: 15,
    mass: 1,
    stiffness: 200,
  },
  slow: {
    type: "spring",
    damping: 20,
    stiffness: 60,
  },
  lazy: {
    type: "spring",
    damping: 20,
    stiffness: 60,
  },
  bouncy: {
    type: "spring",
    damping: 10,
    mass: 0.9,
    stiffness: 100,
  },
  quick: {
    type: "spring",
    damping: 20,
    mass: 1.2,
    stiffness: 250,
  },
  tooltip: {
    type: "spring",
    damping: 10,
    mass: 0.9,
    stiffness: 100,
  },
  quicker: {
    type: "spring",
    damping: 20,
    mass: 1,
    stiffness: 250,
  },
  "100ms": {
    type: "timing",
    duration: 100,
  },
  "200ms": {
    type: "timing",
    duration: 200,
  },
});

export const tamaguiConfig = createTamagui({
  ...defaultConfig,
  animations,
});

export default tamaguiConfig;

export type Conf = typeof tamaguiConfig;

declare module "tamagui" {
  interface TamaguiCustomConfig extends Conf {}
}
