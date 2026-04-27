export default {
  expo: {
    name: "GymStack",
    slug: "gymstack-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "gymstackapp",
    userInterfaceStyle: "dark",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/splash.png",
      resizeMode: "contain",
      backgroundColor: "#0d1017",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.sanyam.gymstack",
      infoPlist: {
        UIBackgroundModes: ["fetch", "remote-notification"],
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#0d1017",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.sanyam.gymstack",

      // ✅ THIS WILL NOW WORK
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON,

      permissions: ["RECEIVE_BOOT_COMPLETED", "VIBRATE", "WAKE_LOCK"],
    },
    web: {
      output: "static",
      favicon: "./assets/images/icon.png",
    },
    plugins: [
      "expo-router",
      [
        "@react-native-google-signin/google-signin",
        {
          iosUrlScheme:
            process.env.GOOGLE_IOS_URL_SCHEME ||
            "com.googleusercontent.apps.1014056970620-psqmnsc3k1mnnrh91srda3cl5ogucjop",
        },
      ],
      [
        "expo-splash-screen",
        {
          image: "./assets/images/logo_bg2.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000",
          },
        },
      ],
      "expo-secure-store",
      [
        "expo-notifications",
        {
          icon: "./assets/images/icon.png",
          color: "#f97316",
          androidMode: "default",
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "42e35fe7-f005-4ac0-80e3-3d326198c5d2",
      },
      apiUrl: "http://192.168.1.10:3000",
      googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID,
    },
  },
};
