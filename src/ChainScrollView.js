import React, { Component, createRef } from 'react';
import {
    Animated,
    View,
    UIManager,
    Easing,
    ActivityIndicator,
    PanResponder,
    Platform,
} from 'react-native';
import DancingText from '@chainplatform/animated';

class ChainScrollView extends Component {
    constructor(props) {
        super(props);

        UIManager.setLayoutAnimationEnabledExperimental &&
            Platform.OS !== 'web' &&
            UIManager.setLayoutAnimationEnabledExperimental(true);

        this.pullDistance = this.props.pullDistance || 80;
        this.panY = new Animated.Value(0);
        this.opacityAnimation = new Animated.Value(0);
        this.refreshViewOpacity = new Animated.Value(0);
        this.refreshScale = new Animated.Value(1);
        this.scrollPosition = new Animated.Value(0);
        this.scrollRef = createRef();
        this.useNativeDriver = Platform.OS !== 'web';

        this.refreshing = false;
        this.isReadyToRefresh = false;

        this.panResponder = PanResponder.create({
            onMoveShouldSetPanResponder: (evt, gestureState) =>
                gestureState.dy > 0 &&
                !this.refreshing &&
                this.scrollPosition._value === 0,
            onPanResponderMove: (evt, gestureState) =>
                this.handlePanMove(gestureState.dy),
            onPanResponderRelease: () => this.onPanRelease(),
            onPanResponderTerminate: () => this.onPanRelease(),
        });
    }

    handlePanMove = (dy) => {
        if (this.refreshing) return;
        const pullDown = Math.max(0, Math.min(dy, this.pullDistance * 1.5));
        this.panY.setValue(pullDown);
        const progress = Math.min(1, pullDown / this.pullDistance);
        this.opacityAnimation.setValue(progress);
        this.isReadyToRefresh = pullDown >= this.pullDistance;
    };

    onRefreshed() { }

    onPanRelease = () => {
        if (this.isReadyToRefresh) {
            this.isReadyToRefresh = false;
            this.refreshing = true;

            try { global.__CHAIN_PULL_REFRESHING = true; } catch (e) { /* ignore */ }

            this.refreshScale.setValue(1);

            Animated.spring(this.panY, {
                toValue: this.pullDistance * 0.75,
                bounciness: 0,
                speed: 30,
                useNativeDriver: this.useNativeDriver,
            }).start();

            this.onRefresh();
        } else {
            Animated.parallel([
                Animated.timing(this.panY, {
                    toValue: 0,
                    duration: 200,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: this.useNativeDriver,
                }),
                Animated.timing(this.opacityAnimation, {
                    toValue: 0,
                    duration: 150,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: this.useNativeDriver,
                }),
            ]).start(() => {
                this.refreshing = false;
            });
        }
    };

    onRefresh = async () => {
        Animated.timing(this.refreshViewOpacity, {
            toValue: 1,
            duration: 150,
            easing: Easing.out(Easing.quad),
            useNativeDriver: this.useNativeDriver,
        }).start();

        try {
            if (typeof this.props.onRefresh === 'function') {
                await this.props.onRefresh();
            }
        } catch (e) {
            console.warn('Refresh error:', e);
        } finally {
            this.finishRefreshing();
        }
    };

    finishRefreshing = () => {
        Animated.sequence([
            Animated.delay(300),
            Animated.parallel([
                Animated.timing(this.panY, {
                    toValue: 0,
                    duration: 300,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: this.useNativeDriver,
                }),
                Animated.timing(this.opacityAnimation, {
                    toValue: 0,
                    duration: 200,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: this.useNativeDriver,
                }),
                Animated.timing(this.refreshScale, {
                    toValue: 0,
                    duration: 200,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: this.useNativeDriver,
                }),
            ]),
        ]).start(() => {
            this.refreshing = false;
            this.isReadyToRefresh = false;

            try { global.__CHAIN_PULL_REFRESHING = false; } catch (e) { /* ignore */ }

            Animated.timing(this.refreshViewOpacity, {
                toValue: 0,
                duration: 0,
                useNativeDriver: this.useNativeDriver,
            }).start();
            this.refreshScale.setValue(1);
        });
    };

    scrollHandler = (event) => {
        this.scrollPosition.setValue(event.nativeEvent.contentOffset.y);
        if (typeof this.props.onScroll === 'function') {
            this.props.onScroll(event.nativeEvent);
        }
    };

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

        const textOpacity = this.refreshViewOpacity.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0],
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
                        transform: [
                            {
                                translateY: translateY.interpolate({
                                    inputRange: [0, this.pullDistance],
                                    outputRange: [-this.pullDistance / 2, 0],
                                    extrapolate: 'clamp',
                                }),
                            },
                        ],
                    }}
                >
                    <Animated.View style={{ opacity: textOpacity }}>
                        <Animated.View style={{ opacity }}>
                            <DancingText
                                animated
                                letters={
                                    this.props.default_letters ||
                                    'Pull to refresh'
                                }
                                textStyle={[
                                    this.props.textStyle,
                                    { textAlign: 'center' },
                                ]}
                            />
                        </Animated.View>
                    </Animated.View>
                    <Animated.View
                        style={{
                            position: 'absolute',
                            opacity: this.refreshViewOpacity,
                            transform: [{ scale: this.refreshScale }],
                        }}
                    >
                        <ActivityIndicator
                            size="small"
                            color={
                                this.props?.textStyle?.color || '#00C853'
                            }
                        />
                    </Animated.View>
                </Animated.View>
                <Animated.View
                    style={{ flex: 1, transform: [{ translateY }] }}
                    {...this.panResponder.panHandlers}
                >
                    {this.props.keyExtractor &&
                        typeof this.props.renderItem === 'function' ? (
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
    <ChainScrollView
        {...props}
        ref={(instance) => ref && (ref.current = instance)}
    />
));
