import React, { Component, createRef } from "react";
import {
    Animated,
    View,
    UIManager,
    PanResponder,
    Platform,
    Easing,
} from "react-native";
import DancingText from "./DancingText";
import ScrollView from "./scroll";

class ChainScrollView extends Component {
    constructor(props) {
        super(props);

        if (
            UIManager.setLayoutAnimationEnabledExperimental &&
            Platform.OS !== "web"
        ) {
            UIManager.setLayoutAnimationEnabledExperimental(true);
        }

        // Animated values
        this.pan = new Animated.ValueXY();
        this.scrollPosition = new Animated.Value(0);
        this.heightAnimation = new Animated.Value(this.props.pullDistance || 75);
        this.opacityAnimation = new Animated.Value(0);
        this.useNativeDriver = Platform.OS !== "web";

        this.state = { refreshing: false };

        this.pullDownPosition = 0;
        this.pullDistance = this.props.pullDistance || 75;
        this.isReadyToRefresh = false;
        this.scrollRef = createRef();

        // Gesture handler
        this.panResponder = PanResponder.create({
            onMoveShouldSetPanResponder: (evt, gestureState) =>
                gestureState.dy >= 0 &&
                !this.state.refreshing &&
                this.scrollPosition._value === 0,
            onPanResponderMove: (evt, gestureState) =>
                this.handlePanMove(evt, gestureState),
            onPanResponderRelease: () => this.onPanRelease(),
            onPanResponderTerminate: () => this.onPanRelease(),
        });
    }

    /** Trigger refresh */
    onRefresh = () => {
        if (this.state.refreshing) return;
        if (typeof this.props.onRefresh === "function") {
            this.setState({ refreshing: true }, () => {
                this.props.onRefresh();
            });
        } else {
            this.setRefreshed();
        }
    };

    /** Public helper (external call safe) */
    onRefreshed = () => this.setRefreshed();

    /** Reset refresh state */
    setRefreshed = () => {
        this.isReadyToRefresh = false;
        this.setState({ refreshing: false });
        this.resetPull();
    };

    /** Reset pull state smoothly */
    resetPull = () => {
        Animated.parallel([
            Animated.timing(this.opacityAnimation, {
                toValue: 0,
                duration: 180,
                easing: Easing.out(Easing.quad),
                useNativeDriver: this.useNativeDriver,
            }),
            Animated.spring(this.pan.y, {
                toValue: 0,
                tension: 38,
                friction: 11,
                useNativeDriver: this.useNativeDriver,
            }),
            Animated.spring(this.heightAnimation, {
                toValue: this.pullDistance,
                tension: 40,
                friction: 10,
                useNativeDriver: this.useNativeDriver,
            })
        ]).start();
    };

    /** Handle release after pull */
    onPanRelease = () => {
        if (this.isReadyToRefresh) {
            this.onRefresh();
            Animated.sequence([
                Animated.spring(this.pan.y, {
                    toValue: this.pullDistance * 0.48,
                    tension: 55,
                    friction: 9,
                    useNativeDriver: this.useNativeDriver,
                }),
                Animated.spring(this.pan.y, {
                    toValue: this.pullDistance * 0.45,
                    tension: 65,
                    friction: 10,
                    useNativeDriver: this.useNativeDriver,
                })
            ]).start();
            // Animated.spring(this.pan.y, {
            //     toValue: this.pullDistance * 0.5,
            //     friction: 6,
            //     tension: 90,
            //     useNativeDriver: this.useNativeDriver,
            // }).start(() => this.onRefresh());
        } else {
            this.resetPull();
        }
    };

    /** Handle dragging movement */
    handlePanMove = (evt, gestureState) => {
        if (!this.props.scrollEnabled) return;

        this.pullDownPosition = Math.max(
            Math.min(this.pullDistance * 1.2, gestureState.dy),
            0
        );

        this.isReadyToRefresh = this.pullDownPosition >= this.pullDistance;

        const basePull = this.pullDownPosition / this.pullDistance;
        const easedY = this.pullDistance * (1 - Math.pow(1 - basePull, 3));

        // opacity
        this.opacityAnimation.setValue(basePull);
        this.pan.setValue({ x: 0, y: easedY });
    };

    /** Scroll tracking */
    scrollHandler = (event) => {
        this.scrollPosition.setValue(event.nativeEvent.contentOffset.y);
        if (typeof this.props.onScroll === "function") {
            this.props.onScroll(event.nativeEvent);
        }
    };

    render() {
        const translateYCenter = Animated.add(
            Animated.divide(this.pan.y, 2),
            Animated.multiply(
                Animated.subtract(this.heightAnimation, this.pullDistance),
                0.25
            )
        );

        return (
            <View
                pointerEvents={this.state.refreshing ? "none" : "auto"}
                style={{ flex: 1 }}
            >
                {/* Pull indicator */}
                <Animated.View
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        alignItems: "center",
                        justifyContent: "center",
                        transform: [{ translateY: translateYCenter }],
                        zIndex: 10,
                    }}
                >
                    {this.state.refreshing ? (<DancingText
                        letters={this.props.refreshing_letters || "Loading"}
                        textStyle={this.props.textStyle}
                    />) : (<Animated.View style={{ opacity: this.opacityAnimation }}>
                        <DancingText
                            letters={this.props.default_letters || "Pull to refresh"}
                            textStyle={this.props.textStyle}
                        />
                    </Animated.View>)}
                </Animated.View>

                {/* Scroll content */}
                <Animated.View
                    style={{ flex: 1, transform: [{ translateY: this.pan.y }] }}
                    {...this.panResponder.panHandlers}
                >
                    {this.props.keyExtractor && typeof this.props.renderItem === "function" ? (
                        <Animated.FlatList
                            {...this.props}
                            ref={this.scrollRef}
                            scrollEventThrottle={16}
                            onScroll={this.scrollHandler}
                        />
                    ) : (
                        <Animated.ScrollView
                            {...this.props}
                            ref={this.scrollRef}
                            scrollEventThrottle={16}
                            onScroll={this.scrollHandler}
                        >
                            {this.props.children}
                        </Animated.ScrollView>
                    )}
                </Animated.View>
            </View>
        );
    }
}

export default React.forwardRef((props, ref) => (
    <ChainScrollView {...props} ref={(instance) => ref && (ref.current = instance)} />
));

export { ScrollView };