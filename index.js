import React, { Component, createRef } from 'react';
import {
    Animated,
    View,
    UIManager,
    Easing,
    ActivityIndicator,
    PanResponder,
    Platform
} from 'react-native';
import DancingText from '@chainplatform/animated';

class ChainScrollView extends Component {
    constructor(props) {
        super(props);

        UIManager.setLayoutAnimationEnabledExperimental &&
            Platform.OS !== "web" &&
            UIManager.setLayoutAnimationEnabledExperimental(true);

        this.state = { refreshing: false };

        this.refreshing = false;
        this.pullDistance = this.props.pullDistance || 80;
        this.panY = new Animated.Value(0);
        this.opacityAnimation = new Animated.Value(0);
        this.useNativeDriver = Platform.OS !== "web";
        this.isReadyToRefresh = false;
        this.scrollPosition = new Animated.Value(0);
        this.scrollRef = createRef();

        this.panResponder = PanResponder.create({
            onMoveShouldSetPanResponder: (evt, gestureState) =>
                gestureState.dy > 0 &&
                !this.state.refreshing &&
                this.scrollPosition._value === 0,
            onPanResponderMove: (evt, gestureState) => this.handlePanMove(gestureState.dy),
            onPanResponderRelease: () => this.onPanRelease(),
            onPanResponderTerminate: () => this.onPanRelease(),
        });
    }

    handlePanMove = (dy) => {
        if (this.state.refreshing) return;

        const pullDown = Math.max(0, Math.min(dy, this.pullDistance * 1.5));
        this.panY.setValue(pullDown);

        const progress = Math.min(1, pullDown / this.pullDistance);
        this.opacityAnimation.setValue(progress);

        this.refreshing = pullDown >= this.pullDistance;
        this.isReadyToRefresh = pullDown >= this.pullDistance;
    };

    onPanRelease = () => {
        if (this.isReadyToRefresh) {
            Animated.spring(this.panY, {
                toValue: this.pullDistance * 0.75,
                useNativeDriver: this.useNativeDriver,
            }).start(() => { });
            this.onRefresh();
        } else {
            this.refreshing = false;
            Animated.timing(this.panY, {
                toValue: 0,
                duration: 200,
                easing: Easing.out(Easing.quad),
                useNativeDriver: this.useNativeDriver,
            }).start();
        }
    };

    onRefresh = async () => {
        if (this.state.refreshing) return;
        this.setState({ refreshing: true }, async () => {
            try {
                if (typeof this.props.onRefresh === "function") {
                    await this.props.onRefresh();
                }
            } catch (e) {
                console.warn("Refresh error:", e);
            } finally {
                this.finishRefreshing();
            }
        });
    };

    finishRefreshing = () => {
        Animated.sequence([
            Animated.delay(250),
            Animated.parallel([
                Animated.timing(this.panY, {
                    toValue: 0,
                    duration: 200,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: this.useNativeDriver,
                })
            ])
        ]).start(() => {
            this.setState({ refreshing: false });
            this.isReadyToRefresh = false;
            this.refreshing = false;
        });
    };

    scrollHandler = (event) => {
        this.scrollPosition.setValue(event.nativeEvent.contentOffset.y);
        if (typeof this.props.onScroll === "function") {
            this.props.onScroll(event.nativeEvent);
        }
    };

    onRefreshed() {

    }

    render() {
        const translateY = this.panY.interpolate({
            inputRange: [0, this.pullDistance],
            outputRange: [0, this.pullDistance],
            extrapolate: 'clamp',
        });

        const opacity = this.opacityAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
        });

        return (
            <View style={{ flex: 1, overflow: 'hidden' }}>
                <Animated.View
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: this.pullDistance,
                        justifyContent: 'center',
                        alignItems: 'center',
                        transform: [{
                            translateY: translateY.interpolate({
                                inputRange: [0, this.pullDistance],
                                outputRange: [-this.pullDistance / 2, 0],
                                extrapolate: 'clamp'
                            })
                        }],
                    }}
                >
                    {this.refreshing ? (
                        <ActivityIndicator
                            size="small"
                            color={this.props?.textStyle?.color || "#00C853"}
                        />
                    ) : (
                        <Animated.View style={{ opacity }}>
                            <DancingText
                                letters={this.props.default_letters || "Pull to refresh"}
                                textStyle={[
                                    this.props.textStyle,
                                    { textAlign: 'center' },
                                ]}
                            />
                        </Animated.View>
                    )}
                </Animated.View>

                <Animated.View
                    style={{ flex: 1, transform: [{ translateY }] }}
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
