import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import AppNavigator from "./src/screens/AppNavigator";
import { withWalletConnect } from "@walletconnect/react-native-dapp";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthProvider } from "./src/context/authContext";
import { ExploreProvider } from "./src/context/exploreContext";

function AppWrapper() {
  return (
    <ExploreProvider>
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </ExploreProvider>
  );
}

export default withWalletConnect(AppWrapper, {
  redirectUrl: "org.snapshot",
  clientMeta: {
    description: "Snapshot Mobile App",
    url: "https://snapshot.org",
    icons: [
      "https://raw.githubusercontent.com/snapshot-labs/brand/master/avatar/avatar.png",
    ],
    name: "snapshot",
  },
  storageOptions: {
    asyncStorage: AsyncStorage,
  },
});
