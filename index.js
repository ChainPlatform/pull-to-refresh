import React from "react";
import { Platform, ActivityIndicator, PanResponder, View } from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    useAnimatedScrollHandler
} from "react-native-reanimated";

const ChainScrollView = React.forwardRef((props, ref) => {
    const scrollPosition = useSharedValue(0);
    const pullDownPosition = useSharedValue(0);
    const isReadyToRefresh = useSharedValue(false);
    const [refreshing, setRefreshing] = React.useState(false);

    const onRefresh = () => {
        if (typeof props.onRefresh != "undefined" && typeof props.onRefresh === "function") {
            props.onRefresh();
            setRefreshing(true);
        } else {
            setRefreshed();
        }
    }

    const setRefreshed = () => {
        pullDownPosition.value = withTiming(0, { duration: 250 })
        setRefreshing(false);
    }

    React.useImperativeHandle(ref, () => ({
        onRefreshed: () => { setRefreshed(); },
    }))

    const onPanRelease = () => {
        pullDownPosition.value = withTiming(isReadyToRefresh.value ? (props.pullDistance / 2) : 0, {
            duration: 250
        })
        if (isReadyToRefresh.value) {
            isReadyToRefresh.value = false;
            onRefresh();
        }
    }

    const panResponderRef = React.useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (event, gestureState) => scrollPosition.value <= 0 && gestureState.dy >= 0,
            onPanResponderMove: (event, gestureState) => {
                if (!props.scrollEnabled) {
                    return;
                }
                pullDownPosition.value = Math.max(
                    Math.min(props.pullDistance, gestureState.dy / 3.5),
                    0
                );

                if (
                    pullDownPosition.value >= props.pullDistance &&
                    isReadyToRefresh.value === false
                ) {
                    isReadyToRefresh.value = true
                }

                if (
                    pullDownPosition.value < props.pullDistance / 2 &&
                    isReadyToRefresh.value === true
                ) {
                    isReadyToRefresh.value = false
                }
            },
            onPanResponderRelease: onPanRelease,
            onPanResponderTerminate: onPanRelease
        })
    )

    const pullDownStyles = useAnimatedStyle(() => {
        return { transform: [{ translateY: pullDownPosition.value }] }
    })

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: event => {
            if (typeof props.onScroll != "undefined" && typeof props.onScroll === "function") {
                props.onScroll(event);
            }
            scrollPosition.value = event.contentOffset.y;
        }
    })

    const refreshContainerStyles = useAnimatedStyle(() => {
        return { height: pullDownPosition.value }
    })

    const refreshIconStyles = useAnimatedStyle(() => {
        const scale = Math.min(1, Math.max(0, pullDownPosition.value / 75));
        return {
            opacity: refreshing
                ? withDelay(100, withTiming(0, { duration: 20 }))
                : Math.max(0, pullDownPosition.value - 50) / 50,
            transform: [
                {
                    scale: scale
                }
            ],
            backgroundColor: "transparent"
        }
    }, [refreshing])

    return (
        <View pointerEvents={refreshing ? "none" : "auto"} style={[{ flex: 1 }]}>
            <Animated.View style={[{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                justifyContent: "center",
                alignItems: "center"
            }, refreshContainerStyles]}>
                {refreshing && (
                    <ActivityIndicator
                        animating={true}
                        style={[{
                            flex: 1,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }, typeof props.animatingSize != "undefined" ? { height: props.animatingSize } : {}]}
                        size={Platform.OS === "web" ? "large" : "small"}
                        color={typeof props.animatingColor != "undefined" ? props.animatingColor : "#CFD3E2"}
                    />
                )}
                <Animated.Image source={{ uri: arrowIcon }}
                    tintColor={typeof props.tintColor != "undefined" ? props.tintColor : "#CFD3E2"}
                    style={[
                        {
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            width: 37,
                            height: 37,
                            marginTop: -37 / 2,
                            marginLeft: -37 / 2,
                            objectFit: "contain"
                        },
                        typeof props.refreshIconStyles != "undefined" ? props.refreshIconStyles : {},
                        refreshIconStyles
                    ]} />
            </Animated.View>
            <Animated.View style={[{ flex: 1 }, pullDownStyles]} {...panResponderRef.current.panHandlers}>
                {
                    typeof props.keyExtractor != "undefined" &&
                        typeof props.renderItem === "function" &&
                        typeof props.data === "function" ?
                        <Animated.FlatList {...props} ref={ref} onScroll={scrollHandler} />
                        :
                        <Animated.ScrollView {...props} ref={ref} onScroll={scrollHandler} >
                            {props.children}
                        </Animated.ScrollView>
                }
            </Animated.View>
        </View>
    )
});

export default ChainScrollView;

const arrowIcon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJIAAACSCAMAAACZpWO8AAAAjVBMVEUAAAD///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8DizOFAAAALnRSTlMA/PkS6uIGSgrFwbmYhoJCOSvu9NezqqCVe3JrXVFGMCYgsOXSzHZjPjUdGgyxZVq64AAAA9BJREFUeNrc2Nd64jAQBeAjy5ZtbFxCDR1CDey8/+PtTS420bhL2v32vwYMo2kC/xt1CFfpPInPge95fnCOk3m6Cg8Kf0W0G5+mHrG86Wm8i+CSyrPYowZenOUKTkSbxKOWvGQTwbZ8MaFOJoscFh3HAfUQjI+w47AQ1JNYHGDefi5oADHfw6z9jAab7WGOXAoyQCwlDNn4ZIi/gQnliAwalRgsE2SUyDDMc0TGjZ4YYOeTBf4OvY3JkjH6kSOyZiTRw+eULJp+orMyoDaCZLkOi/IolZLHsgjXy6TlG0t0VLxRExFneQRGlGexoCZvBToJJ00fmIYv1HiFadOPmoToIBRUx/u1VWiktr88qiNCtFbUxsh/l2hJvvu1cSrQUlkX8o9VhA6i1Ufd8Zctqz+oidBaoSO1rolU8IkW5JSqiFSiB5kKqjKVaDaiKpcHenpcqMpowFwTVwxwFb3n3Y4qBAUGKQKqsEOtp0+8mcRAckY8/9krkd5hwHufdMqIJW4w4iaIlaFSKYjjbWHI1iOOKDse29sdxtzfuh3dho/RHQbd+ThtwJI+McQWRm0FMXwJzpI4Nxh2I84SjL1oUf3WeoHYQzcjxgxDDXjSnhiBhAUyIIYepjnpRAErCkG6OX44cK+6wpIr6cQB3y1Id4E1F9It8M1RkEY8YM2De96xcXFLYVHauMwFbEO1hh8VAf6Qk24Nq9aky+uT+0PBKvVRm+DRhDQrWLYizSSq20r8CJZFft2OknQYt1bHb4IvytP3NgnrJPNYVV1vJzhwqq65jDRbOLCtvqvE+g1AwQGl3w3ir9T3XM2S5qniRVV/A4RwIiTNrmLkiheceImK0XtiTtSRuKLUp0zeO8DX+rSiUeZwJOeb5YE0ERyJSHNg0z6AMwFb7Ctm+DmTsEtRytzPnVmyXXrucsVtXnfnbOxCOBPqWcO2qwLOFGybPtNPJZwp6aczW4dHOHNkO5C+lUs4I/V7CAB9nig4o/SJ8m9+pd/V3EkRACEMBVEJeMgd/MtDAIdwSeUFCzMFWX43+OHA3xu8BMCrEnxQwGcXLE7AEg4sdMF2AGyawNZSbMDBMQU4zAFHXuBgUByfdg2Z93nOckfx4MJCXOuAyy9wRSguUsF1s7iUB6MLYMBDjMGAYSExUgUGz8R4HhhiFKOeYCBWjA2L4Wowgi4G9UWcAYQ+RDRGBIhEzAqE0URkTwQbc/wz/vDPyPDP2ZCsiBKLwLWIpYvwvqg4IEUQoi5DlIqQ6hVRUENqfETZEamEIsVZpF6MlLCZqjpS6GdqD1E5ZN259Vff+o36Y6gAAAAASUVORK5CYII=';