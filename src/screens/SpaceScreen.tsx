import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  useWindowDimensions,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import i18n from "i18n-js";
import colors from "../constants/colors";
import common from "../styles/common";
import { useAuthState } from "../context/authContext";
import ProposalFilters from "../components/proposal/ProposalFilters";
import BackButton from "../components/BackButton";
import { SceneMap, TabBar, TabBarItem, TabView } from "react-native-tab-view";
import AboutSpace from "../components/space/AboutSpace";
import SpaceHeader from "../components/space/SpaceHeader";
import SpaceProposals from "../components/space/SpaceProposals";
import { Space } from "../types/explore";
import proposal from "../constants/proposal";

const styles = StyleSheet.create({
  indicatorStyle: {
    fontFamily: "Calibre-Medium",
    color: colors.textColor,
    backgroundColor: colors.darkGray,
  },
  labelStyle: {
    fontFamily: "Calibre-Medium",
    color: colors.textColor,
    textTransform: "none",
    fontSize: 18,
  },
});

export const headerHeight = Platform.OS === "android" ? 180 : 170;

const renderScene = (
  route: any,
  spaceScreenRef: any,
  scrollProps: any,
  filter: { key: string }
) =>
  SceneMap({
    proposals: () => (
      <SpaceProposals
        space={route.params.space}
        spaceScreenRef={spaceScreenRef}
        scrollProps={scrollProps}
        headerHeight={headerHeight + 40}
        filter={filter}
      />
    ),
    about: () => (
      <AboutSpace
        routeSpace={route.params.space}
        scrollProps={scrollProps}
        headerHeight={headerHeight}
      />
    ),
  });

type SpaceScreenProps = {
  route: {
    params: {
      space: Space;
    };
  };
};

function SpaceScreen({ route }: SpaceScreenProps) {
  const [index, setIndex] = React.useState(0);
  const layout = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { isWalletConnect } = useAuthState();
  const [filter, setFilter] = useState(proposal.getStateFilters()[0]);
  const [showTitle, setShowTitle] = useState(false);
  const space = route.params.space;
  const spaceScreenRef: any = useRef(null);
  const scrollAnim = useRef(new Animated.Value(0));
  const offsetAnim = useRef(new Animated.Value(0));
  const scrollValue = useRef(0);
  const offsetValue = useRef(0);
  const scrollEndTimer: any = useRef(-1);
  const clampedScrollValue = useRef(0);
  const [isInitial, setIsInitial] = useState(true);
  //@ts-ignore
  const headerSnap = useRef(Animated.CompositeAnimation);
  const clampedScroll = useRef(
    Animated.diffClamp(
      Animated.add(
        scrollAnim.current.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
          extrapolateLeft: "clamp",
        }),
        offsetAnim.current
      ),
      0,
      headerHeight
    )
  );

  useEffect(() => {
    if (!isInitial) {
      moveHeader(headerHeight);
    }

    setIsInitial(false);
  }, [index]);

  useEffect(() => {
    offsetAnim.current.addListener(({ value }) => {
      offsetValue.current = value;
    });
    scrollAnim.current.addListener(({ value }) => {
      const diff = value - scrollValue.current;
      scrollValue.current = value;
      clampedScrollValue.current = Math.min(
        Math.max(clampedScrollValue.current + diff, 0),
        headerHeight
      );
      if (clampedScrollValue.current === headerHeight) {
        setShowTitle(true);
      } else {
        setShowTitle(false);
      }
    });
    return () => {
      scrollAnim.current.removeAllListeners();
      offsetAnim.current.removeAllListeners();
      clearTimeout(scrollEndTimer.current);
    };
  }, []);

  const headerTranslation = clampedScroll.current.interpolate({
    inputRange: [0, headerHeight],
    outputRange: [0, -headerHeight],
    extrapolate: "clamp",
  });

  function moveHeader(toValue: number) {
    if (headerSnap.current) {
      headerSnap.current.stop();
    }

    headerSnap.current = Animated.timing(offsetAnim.current, {
      toValue,
      duration: 350,
      useNativeDriver: true,
    });

    headerSnap.current.start();
  }

  function onMomentumScrollEnd() {
    moveHeader(
      scrollValue.current > headerHeight &&
        clampedScrollValue.current > headerHeight / 2
        ? offsetValue.current + headerHeight
        : offsetValue.current - headerHeight
    );
  }

  function onScrollEndDrag() {
    scrollEndTimer.current = setTimeout(onMomentumScrollEnd, 250);
  }

  function onMomentumScrollBegin() {
    clearTimeout(scrollEndTimer.current);
  }

  const sceneMap = useMemo(
    () =>
      renderScene(
        route,
        spaceScreenRef,
        {
          onMomentumScrollEnd,
          onScrollEndDrag,
          onMomentumScrollBegin,
          onScroll: Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollAnim.current } } }],
            { useNativeDriver: true }
          ),
        },
        filter
      ),
    [route, filter]
  );

  const renderTabBar = (props: any) => (
    <>
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: 100,
            height: headerHeight,
            backgroundColor: colors.white,
            width: "100%",
          },
          [{ transform: [{ translateY: headerTranslation }] }],
        ]}
      >
        <SpaceHeader space={space} isWalletConnect={isWalletConnect} />
        <TabBar
          {...props}
          labelStyle={styles.labelStyle}
          indicatorStyle={styles.indicatorStyle}
          activeColor={colors.textColor}
          style={{
            shadowColor: "transparent",
            borderTopWidth: 0,
            shadowOpacity: 0,
            backgroundColor: colors.white,
            paddingTop: 0,
            marginTop: 16,
            height: 45,
            shadowRadius: 0,
            elevation: 0,
            shadowOffset: {
              height: 0,
              width: 0,
            },
            zIndex: 200,
          }}
          inactiveColor={colors.textColor}
          renderTabBarItem={(item) => {
            return <TabBarItem {...item} />;
          }}
          onTabPress={() => {
            moveHeader(headerHeight);
          }}
        />
      </Animated.View>
    </>
  );

  const [routes] = React.useState([
    { key: "proposals", title: i18n.t("proposals") },
    { key: "about", title: i18n.t("about") },
  ]);

  return (
    <View style={[common.screen, { paddingTop: insets.top }]}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          height: 45,
          backgroundColor: colors.bgBlue,
        }}
      >
        <BackButton
          iconColor={colors.white}
          titleStyle={{
            color: colors.white,
            fontSize: 16,
            overflow: "visible",
          }}
          title={showTitle ? space.name : ""}
        />
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: Platform.OS === "android" ? 12 : 16,
            height: 45,
            marginRight: 18,
          }}
        >
          {index === 0 && (
            <ProposalFilters
              filter={filter}
              setFilter={setFilter}
              onChangeFilter={
                spaceScreenRef?.current?.onChangeFilter ?? function () {}
              }
              iconColor={colors.white}
              filterTextStyle={{ color: colors.white }}
            />
          )}
        </View>
      </View>
      <TabView
        navigationState={{ index, routes }}
        renderScene={sceneMap}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={renderTabBar}
        onSwipeEnd={() => {
          moveHeader(headerHeight);
        }}
      />
    </View>
  );
}

export default SpaceScreen;
