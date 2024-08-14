import { useRef, forwardRef, useState, useImperativeHandle } from 'react';
import { Animated, View, ActivityIndicator, PanResponder, Platform } from 'react-native';

const ChainScrollView = forwardRef((props, ref) => {

    const pan = useRef(new Animated.ValueXY()).current;
    const [refreshing, setRefreshing] = useState(false);
    const [scrollPosition, setScrollPosition] = useState(0);
    let pullDownPosition = 0;
    const pullDistance = typeof props.pullDistance != "undefined" ? props.pullDistance : 75;
    let isReadyToRefresh = false;
    let opacityValue = 0;
    let scaleValue = 0;
    const heightAnimation = useRef(new Animated.Value(pullDistance)).current;
    const heightStyle = { height: heightAnimation };
    const opacityAnimation = useRef(new Animated.Value(0)).current;
    const opacityStyle = { opacity: opacityAnimation };
    const scaleAnimation = useRef(new Animated.Value(0)).current;
    const scaleStyle = { transform: [{ scale: scaleAnimation }] };

    const onRefresh = () => {
        if (typeof props.onRefresh != "undefined" && typeof props.onRefresh === "function") {
            props.onRefresh();
            setRefreshing(true);
        } else {
            setRefreshed();
        }
    }

    const setRefreshed = () => {
        onPanRelease();
    }

    useImperativeHandle(ref, () => ({
        onRefreshed: () => {
            setRefreshed();
        },
    }))

    const onPanRelease = () => {
        pullDownPosition = 0;
        opacityValue = 0;
        scaleValue = 0;
        Animated.parallel([
            Animated.timing(opacityAnimation, {
                toValue: opacityValue,
                duration: 150,
                useNativeDriver: Platform.OS == "web" ? false : true
            }),
            Animated.timing(scaleAnimation, {
                toValue: scaleValue,
                duration: 150,
                useNativeDriver: Platform.OS == "web" ? false : true
            }),
            Animated.spring(pan, {
                toValue: pullDownPosition,
                useNativeDriver: Platform.OS == "web" ? false : true
            }),
            Animated.spring(heightAnimation, {
                toValue: pullDistance,
                duration: 150,
                useNativeDriver: Platform.OS == "web" ? false : true
            })
        ]).start();
        isReadyToRefresh = false;
        setRefreshing(false);
    }

    const panResponderRef = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (event, gestureState) => scrollPosition <= 0 && gestureState.dy >= 0 && !refreshing,
            onPanResponderMove: (evt, gestureState) => {
                if (!props.scrollEnabled) {
                    return;
                }
                pullDownPosition = Math.max(Math.min(pullDistance, gestureState.dy), 0);
                if (pullDownPosition < pullDistance && isReadyToRefresh === true) {
                    isReadyToRefresh = false;
                }
                let basePullDistance = pullDownPosition / pullDistance;
                opacityValue = refreshing ? 0 : Math.max(0, basePullDistance);
                scaleValue = refreshing ? 0 : Math.max(0, basePullDistance);
                Animated.parallel([
                    Animated.timing(opacityAnimation, {
                        toValue: opacityValue,
                        duration: 1,
                        useNativeDriver: Platform.OS == "web" ? false : true
                    }),
                    Animated.timing(scaleAnimation, {
                        toValue: scaleValue,
                        duration: 1,
                        useNativeDriver: Platform.OS == "web" ? false : true
                    })
                ]).start();
                if (pullDownPosition >= pullDistance) {
                    pan.setValue({ x: 0, y: pullDistance });
                    return;
                }
                if (pullDownPosition <= 0) {
                    pan.setValue({ x: 0, y: 0 });
                    return;
                }
                return Animated.event([null, {
                    dx: 0, dy: pan.y
                }
                ], { useNativeDriver: false })(evt, gestureState)
            },
            onPanResponderRelease: () => {
                if (pullDownPosition >= pullDistance && isReadyToRefresh === false) {
                    isReadyToRefresh = true;
                }
                opacityValue = 0;
                scaleValue = 0;
                if (isReadyToRefresh == true) {
                    onRefresh();
                    pullDownPosition = pullDistance * 2 / 3;
                    Animated.parallel([
                        Animated.timing(opacityAnimation, {
                            toValue: opacityValue,
                            duration: 150,
                            useNativeDriver: Platform.OS == "web" ? false : true
                        }),
                        Animated.timing(scaleAnimation, {
                            toValue: scaleValue,
                            duration: 150,
                            useNativeDriver: Platform.OS == "web" ? false : true
                        }),
                        Animated.spring(pan, {
                            toValue: pullDownPosition,
                            useNativeDriver: Platform.OS == "web" ? false : true
                        }),
                        Animated.spring(heightAnimation, {
                            toValue: pullDownPosition,
                            useNativeDriver: Platform.OS == "web" ? false : true
                        })
                    ]).start();
                } else {
                    onPanRelease();
                }
            },
            onPanResponderTerminate: () => {
                onPanRelease();
            }
        }),
    );

    const scrollHandler = (event) => {
        if (typeof props.onScroll != "undefined" && typeof props.onScroll === "function") {
            props.onScroll(event.nativeEvent);
        }
        setScrollPosition(event.nativeEvent.contentOffset.y);
    }

    return (<View pointerEvents={refreshing ? "none" : "auto"} style={[{ flex: 1 }]}>
        <Animated.View style={[{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            justifyContent: "center",
            alignItems: "center"
        }, heightStyle]}>
            {refreshing ?
                <ActivityIndicator
                    animating={true}
                    style={[{
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'center'
                    }, typeof props.animatingSize != "undefined" ? { height: props.animatingSize } : {}]}
                    size={Platform.OS === "web" ? "large" : "small"}
                    color={typeof props.animatingColor != "undefined" ? props.animatingColor : "#CFD3E2"}
                /> : null}
            <Animated.Image source={{ uri: arrowIcon }}
                tintColor={typeof props.tintColor != "undefined" ? props.tintColor : "#CFD3E2"}
                style={[{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    width: 37,
                    height: 37,
                    marginTop: -37 / 2,
                    marginLeft: -37 / 2,
                    objectFit: "contain",
                },
                typeof props.refreshIconStyles != "undefined" ? props.refreshIconStyles : {},
                    opacityStyle,
                    scaleStyle
                ]}
            />
        </Animated.View>
        <Animated.View style={{ flex: 1, transform: [{ translateY: pan.y }], }} {...panResponderRef.current.panHandlers}>
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
    </View>);
});

export default ChainScrollView;

const arrowIcon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJIAAACSCAMAAACZpWO8AAAAjVBMVEUAAAD///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8DizOFAAAALnRSTlMA/PkS6uIGSgrFwbmYhoJCOSvu9NezqqCVe3JrXVFGMCYgsOXSzHZjPjUdGgyxZVq64AAAA9BJREFUeNrc2Nd64jAQBeAjy5ZtbFxCDR1CDey8/+PtTS420bhL2v32vwYMo2kC/xt1CFfpPInPge95fnCOk3m6Cg8Kf0W0G5+mHrG86Wm8i+CSyrPYowZenOUKTkSbxKOWvGQTwbZ8MaFOJoscFh3HAfUQjI+w47AQ1JNYHGDefi5oADHfw6z9jAab7WGOXAoyQCwlDNn4ZIi/gQnliAwalRgsE2SUyDDMc0TGjZ4YYOeTBf4OvY3JkjH6kSOyZiTRw+eULJp+orMyoDaCZLkOi/IolZLHsgjXy6TlG0t0VLxRExFneQRGlGexoCZvBToJJ00fmIYv1HiFadOPmoToIBRUx/u1VWiktr88qiNCtFbUxsh/l2hJvvu1cSrQUlkX8o9VhA6i1Ufd8Zctqz+oidBaoSO1rolU8IkW5JSqiFSiB5kKqjKVaDaiKpcHenpcqMpowFwTVwxwFb3n3Y4qBAUGKQKqsEOtp0+8mcRAckY8/9krkd5hwHufdMqIJW4w4iaIlaFSKYjjbWHI1iOOKDse29sdxtzfuh3dho/RHQbd+ThtwJI+McQWRm0FMXwJzpI4Nxh2I84SjL1oUf3WeoHYQzcjxgxDDXjSnhiBhAUyIIYepjnpRAErCkG6OX44cK+6wpIr6cQB3y1Id4E1F9It8M1RkEY8YM2De96xcXFLYVHauMwFbEO1hh8VAf6Qk24Nq9aky+uT+0PBKvVRm+DRhDQrWLYizSSq20r8CJZFft2OknQYt1bHb4IvytP3NgnrJPNYVV1vJzhwqq65jDRbOLCtvqvE+g1AwQGl3w3ir9T3XM2S5qniRVV/A4RwIiTNrmLkiheceImK0XtiTtSRuKLUp0zeO8DX+rSiUeZwJOeb5YE0ERyJSHNg0z6AMwFb7Ctm+DmTsEtRytzPnVmyXXrucsVtXnfnbOxCOBPqWcO2qwLOFGybPtNPJZwp6aczW4dHOHNkO5C+lUs4I/V7CAB9nig4o/SJ8m9+pd/V3EkRACEMBVEJeMgd/MtDAIdwSeUFCzMFWX43+OHA3xu8BMCrEnxQwGcXLE7AEg4sdMF2AGyawNZSbMDBMQU4zAFHXuBgUByfdg2Z93nOckfx4MJCXOuAyy9wRSguUsF1s7iUB6MLYMBDjMGAYSExUgUGz8R4HhhiFKOeYCBWjA2L4Wowgi4G9UWcAYQ+RDRGBIhEzAqE0URkTwQbc/wz/vDPyPDP2ZCsiBKLwLWIpYvwvqg4IEUQoi5DlIqQ6hVRUENqfETZEamEIsVZpF6MlLCZqjpS6GdqD1E5ZN259Vff+o36Y6gAAAAASUVORK5CYII=';