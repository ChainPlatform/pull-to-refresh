import React, { Component, createRef } from 'react';
import { Animated, View, UIManager, LayoutAnimation, PanResponder, Platform } from 'react-native';
import DancingText from './DancingText';

class ChainScrollView extends Component {
    constructor(props) {
        super(props);

        UIManager.setLayoutAnimationEnabledExperimental &&
            UIManager.setLayoutAnimationEnabledExperimental(true);
        this.pan = new Animated.ValueXY();
        this.scrollPosition = new Animated.Value(0);
        this.heightAnimation = new Animated.Value(this.props.pullDistance || 75);
        this.opacityAnimation = new Animated.Value(0);
        this.state = {
            refreshing: false,
        };
        this.pullDownPosition = 0;
        this.pullDistance = this.props.pullDistance || 75;
        this.isReadyToRefresh = false;
        this.opacityValue = 0;
        this.scaleValue = 0;
        this.panResponder = PanResponder.create({
            onMoveShouldSetPanResponder: (event, gestureState) =>
                gestureState.dy >= 0 && !this.state.refreshing && this.scrollPosition._value === 0,
            onPanResponderMove: (evt, gestureState) => this.handlePanMove(evt, gestureState),
            onPanResponderRelease: () => this.onPanRelease(),
            onPanResponderTerminate: () => this.onPanRelease(),
        });
        this.scrollRef = createRef();
    }

    onRefresh = () => {
        if (typeof this.props.onRefresh === "function") {
            this.setState({ refreshing: true }, () => {
                this.props.onRefresh();
            });
        } else {
            this.setRefreshed();
        }
    };

    setRefreshed = () => {
        this.isReadyToRefresh = false;
        this.onPanRelease();
    };

    onPanRelease = () => {
        this.opacityValue = 0;
        this.scaleValue = 0;
        let dis = this.pullDistance * (2 / 3);
        let dis2 = this.pullDistance * (2 / 3);
        if (this.isReadyToRefresh) {
            this.onRefresh();
        } else {
            dis = this.pullDistance;
            dis2 = 0;
            this.setState({ refreshing: false });
        }
        Animated.parallel([
            Animated.timing(this.opacityAnimation, {
                toValue: this.opacityValue,
                duration: 50,
                useNativeDriver: Platform.OS === "web" ? false : true,
            }),
            Animated.spring(this.pan, {
                toValue: dis2,
                duration: 50,
                useNativeDriver: Platform.OS === "web" ? false : true,
            }),
            Animated.spring(this.heightAnimation, {
                toValue: dis,
                duration: 50,
                useNativeDriver: Platform.OS === "web" ? false : true,
            }),
        ]).start(() => {
            this.pullDownPosition = 0;
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        });
    };

    handlePanMove = (evt, gestureState) => {
        if (!this.props.scrollEnabled) {
            return;
        }
        this.pullDownPosition = Math.max(Math.min(this.pullDistance, gestureState.dy), 0);
        if (this.pullDownPosition < this.pullDistance) {
            this.isReadyToRefresh = false;
        }
        if (
            this.pullDownPosition >= this.pullDistance &&
            !this.isReadyToRefresh &&
            this.props.refreshing === false
        ) {
            this.isReadyToRefresh = true;
        }
        let basePullDistance = this.pullDownPosition / this.pullDistance;
        this.opacityValue = this.state.refreshing ? 0 : Math.max(0, basePullDistance);
        this.scaleValue = this.state.refreshing ? 0 : Math.max(0, basePullDistance);

        Animated.parallel([
            Animated.timing(this.opacityAnimation, {
                toValue: this.opacityValue,
                duration: 1,
                useNativeDriver: Platform.OS === "web" ? false : true,
            })
        ]).start();

        if (this.pullDownPosition >= this.pullDistance) {
            this.pan.setValue({ x: 0, y: this.pullDistance });
            return;
        }
        if (this.pullDownPosition <= 0) {
            this.pan.setValue({ x: 0, y: 0 });
            return;
        }

        Animated.event([null, { dx: 0, dy: this.pan.y }], { useNativeDriver: Platform.OS === "web" ? false : true })(
            evt,
            gestureState
        );
    };

    scrollHandler = (event) => {
        this.scrollPosition.setValue(event.nativeEvent.contentOffset.y);
        if (typeof this.props.onScroll === "function") {
            this.props.onScroll(event.nativeEvent);
        }
    };

    onRefreshed = () => {
        this.setRefreshed();
    };

    render() {
        return (
            <View pointerEvents={this.state.refreshing ? "none" : "auto"} style={[{ flex: 1 }]}>
                <Animated.View style={[
                    {
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        justifyContent: "center",
                        alignItems: "center"
                    },
                    { height: this.heightAnimation },
                ]}>
                    {this.state.refreshing ?
                        <DancingText
                            letters={typeof this.props.refreshing_letters != "undefined" ? this.props.refreshing_letters : "Loading"}
                            textStyle={this.props.textStyle} />
                        : null}

                    {!this.state.refreshing ? <DancingText
                        letters={typeof this.props.default_letters != "undefined" ? this.props.default_letters : "Pull to refresh"}
                        textStyle={[
                            this.props.textStyle, { opacity: this.opacityAnimation }
                        ]}
                    /> : null}
                </Animated.View>
                <Animated.View style={{ flex: 1, transform: [{ translateY: this.pan.y }] }} {...this.panResponder.panHandlers} >
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
                        >{this.props.children}</Animated.ScrollView>
                    )}
                </Animated.View>
            </View >
        );
    }
}

export default React.forwardRef((props, ref) => (
    <ChainScrollView {...props} ref={(instance) => ref && (ref.current = instance)} />
));
