import { useCallback, useEffect, useRef, useState } from "react";
import {
 Animated,
 Image,
 StyleSheet,
 useColorScheme,
} from "react-native";

interface SplashScreenProps {
 onFinish: () => void;
}

export function CustomSplashScreen({ onFinish }: SplashScreenProps) {
 const colorScheme = useColorScheme();
 const isDark = colorScheme === "dark";

 const fadeText = useRef(new Animated.Value(0)).current;
 const scaleText = useRef(new Animated.Value(0.85)).current;
 const fadeOut = useRef(new Animated.Value(1)).current;
 // Store onFinish in a ref so the effect never needs to re-run when the
 // parent re-renders and passes a new function reference.
 const onFinishRef = useRef(onFinish);
 useEffect(() => {
  onFinishRef.current = onFinish;
 });

 // Wait for the image to finish decoding before starting animations.
 const [imageReady, setImageReady] = useState(false);

 const startAnimations = useCallback(() => {
  // 1. Fade-in + scale the content
  Animated.parallel([
   Animated.timing(fadeText, {
    toValue: 1,
    duration: 1000,
    useNativeDriver: true,
   }),
   Animated.spring(scaleText, {
    toValue: 1,
    friction: 6,
    tension: 40,
    useNativeDriver: true,
   }),
  ]).start();

  // 2. After a hold, fade everything out then call onFinish
  const timer = setTimeout(() => {
   Animated.timing(fadeOut, {
    toValue: 0,
    duration: 800,
    useNativeDriver: true,
   }).start(() => onFinishRef.current());
  }, 2800);

  return () => clearTimeout(timer);
 }, [fadeText, scaleText, fadeOut]);

 useEffect(() => {
  if (!imageReady) return;
  return startAnimations();
 }, [imageReady, startAnimations]);

 return (
  <Animated.View
   style={[
    styles.container,
    {
     backgroundColor: isDark ? "#000000" : "#FFFFFF",
     opacity: fadeOut,
    },
   ]}
  >
   <Animated.View
    style={{
     opacity: fadeText,
     transform: [{ scale: scaleText }],
     alignItems: "center",
    }}
   >
    <Image
     source={require("@/assets/images/icon.png")}
     style={styles.logo}
     onLoad={() => setImageReady(true)}
    />
    <Animated.Text
     style={[styles.title, { color: isDark ? "#FFFFFF" : "#000000" }]}
    >
     habitfuel
    </Animated.Text>
    <Animated.Text
     style={[
      styles.subtitle,
      {
       color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)",
      },
     ]}
    >
     fuel your daily momentum
    </Animated.Text>
   </Animated.View>
  </Animated.View>
 );
}

const styles = StyleSheet.create({
 container: {
  ...StyleSheet.absoluteFill,
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
 },
 logo: {
  width: 100,
  height: 100,
  resizeMode: "contain",
  marginBottom: 20,
 },
 title: {
  fontFamily: "Poppins_700Bold",
  fontSize: 36,
  letterSpacing: -0.5,
  textAlign: "center",
 },
 subtitle: {
  fontFamily: "Poppins_400Regular",
  fontSize: 13,
  letterSpacing: 1.5,
  textAlign: "center",
  marginTop: 8,
 },
});
