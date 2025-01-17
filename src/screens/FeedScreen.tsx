import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import get from "lodash/get";
import apolloClient from "helpers/apolloClient";
import { FOLLOWS_QUERY } from "helpers/queries";
import {
  AUTH_ACTIONS,
  useAuthDispatch,
  useAuthState,
} from "context/authContext";
import common from "styles/common";
import {
  EXPLORE_ACTIONS,
  useExploreDispatch,
  useExploreState,
} from "context/exploreContext";
import { ContextDispatch } from "types/context";
import { defaultHeaders } from "helpers/apiUtils";
import isEmpty from "lodash/isEmpty";
import TimelineFeed from "components/timeline/TimelineFeed";
import * as Linking from "expo-linking";
import includes from "lodash/includes";
import { PROPOSAL_SCREEN, SPACE_SCREEN } from "constants/navigation";
import { useNavigation } from "@react-navigation/core";

async function getFollows(
  accountId: string | null | undefined,
  authDispatch: ContextDispatch,
  setIsInitial: (isInitial: boolean) => void
) {
  try {
    if (accountId) {
      const query = {
        query: FOLLOWS_QUERY,
        variables: {
          follower_in: accountId,
        },
      };
      const result = await apolloClient.query(query);
      const followedSpaces = get(result, "data.follows", []);
      authDispatch({
        type: AUTH_ACTIONS.SET_FOLLOWED_SPACES,
        payload: followedSpaces,
      });
    }
  } catch (e) {
    authDispatch({
      type: AUTH_ACTIONS.SET_FOLLOWED_SPACES,
      payload: [],
    });
  }
  setIsInitial(false);
}

async function getExplore(exploreDispatch: ContextDispatch) {
  try {
    const options: { [key: string]: any } = {
      method: "get",
      headers: {
        ...defaultHeaders,
      },
    };
    const response = await fetch(
      "https://hub.snapshot.org/api/explore",
      options
    );
    const explore = await response.json();
    exploreDispatch({
      type: EXPLORE_ACTIONS.SET_EXPLORE,
      payload: explore,
    });
  } catch (e) {}
}

function FeedScreen() {
  const { colors, connectedAddress } = useAuthState();
  const { spaces } = useExploreState();
  const authDispatch = useAuthDispatch();
  const exploreDispatch = useExploreDispatch();
  const insets = useSafeAreaInsets();
  const navigation: any = useNavigation();
  const [isInitial, setIsInitial] = useState<boolean>(true);

  function navigateToScreen(url: string) {
    if (includes(url, "snapshot.org")) {
      const splitUrl = url.split("#");
      if (splitUrl?.length === 2) {
        if (includes(splitUrl[1], "proposal")) {
          const splitUrlProposal = splitUrl[1].split("/");
          if (splitUrlProposal.length >= 4) {
            const spaceId = splitUrlProposal[1];
            const proposalId = splitUrlProposal[3];
            navigation.replace(PROPOSAL_SCREEN, {
              proposalId,
              spaceId,
            });
          }
        } else {
          const splitUrlSpace = splitUrl[1].split("/");
          const spaceId = splitUrlSpace[1]?.replace(/\//g, "");
          const spaceDetails = spaces[spaceId] ?? {};
          if (!isEmpty(spaceId)) {
            navigation.navigate(SPACE_SCREEN, {
              space: {
                id: spaceId,
                ...spaceDetails,
              },
            });
          }
        }
      }
    }
  }

  useEffect(() => {
    Linking.getInitialURL().then((url: string | null) => {
      navigateToScreen(url ?? "");
    });
    Linking.addEventListener("url", (event) => {
      navigateToScreen(event?.url);
    });
    getExplore(exploreDispatch);
    getFollows(connectedAddress, authDispatch, setIsInitial);
  }, []);

  useEffect(() => {
    if (!isInitial) {
      getFollows(connectedAddress, authDispatch, setIsInitial);
    }
  }, [connectedAddress]);

  return (
    <View
      style={[
        common.screen,
        { paddingTop: insets.top, backgroundColor: colors.bgDefault },
      ]}
    >
      <TimelineFeed feedScreenIsInitial={isInitial} />
    </View>
  );
}

export default FeedScreen;
