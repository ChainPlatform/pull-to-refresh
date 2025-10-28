import React, { Component, createRef } from 'react';
import {
    Animated,
    View,
    UIManager,
    LayoutAnimation,
    PanResponder,
    Platform,
    ActivityIndicator
} from 'react-native';

class SmartScrollView extends Component {
    constructor(props) {
        super(props);

        UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);

        this.pan = new Animated.ValueXY();
        this.scrollPosition = new Animated.Value(0);
        this.opacityAnimation = new Animated.Value(0);
        this.state = { refreshing: false };
        this.pullDistance = this.props.pullDistance || 75;
        this.pullDownPosition = 0;
        this.isReadyToRefresh = false;
        this.opacityValue = 0;
        this.panResponder = PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) =>
                gestureState.dy >= 0 &&
                !this.state.refreshing &&
                this.scrollPosition._value === 0,
            onPanResponderMove: (_, gestureState) => this.handlePanMove(gestureState),
            onPanResponderRelease: () => this.onPanRelease(),
        });
        this.scrollRef = createRef();
    }

    onRefresh = async () => {
        if (typeof this.props.onRefresh === 'function') {
            this.setState({ refreshing: true }, async () => {
                await this.props.onRefresh();
                this.finishRefreshing();
            });
        } else {
            this.finishRefreshing();
        }
    };

    finishRefreshing = () => {
        this.isReadyToRefresh = false;
        this.setState({ refreshing: false });

        Animated.spring(this.pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: Platform.OS !== 'web',
        }).start(() => {
            if (Platform.OS !== 'web') {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            }
        });
    };

    onPanRelease = () => {
        if (this.isReadyToRefresh) {
            this.onRefresh();
        } else {
            Animated.spring(this.pan, {
                toValue: { x: 0, y: 0 },
                useNativeDriver: Platform.OS !== 'web',
            }).start();
        }
    };

    handlePanMove = (gestureState) => {
        if (!this.props.scrollEnabled) return;
        this.pullDownPosition = Math.max(Math.min(this.pullDistance, gestureState.dy), 0);
        this.isReadyToRefresh = this.pullDownPosition >= this.pullDistance;
        const progress = this.pullDownPosition / this.pullDistance;
        this.opacityValue = Math.max(0, progress);
        Animated.timing(this.opacityAnimation, {
            toValue: this.opacityValue,
            duration: 1,
            useNativeDriver: Platform.OS !== 'web',
        }).start();
        this.pan.setValue({ x: 0, y: this.pullDownPosition });
    };

    scrollHandler = (event) => {
        this.scrollPosition.setValue(event.nativeEvent.contentOffset.y);
        if (typeof this.props.onScroll === 'function') {
            this.props.onScroll(event.nativeEvent);
        }
    };

    render() {
        return (<View pointerEvents={this.state.refreshing ? 'none' : 'auto'} style={{ flex: 1 }}>
            <Animated.View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: this.pullDistance,
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 10,
                backgroundColor: 'transparent',
            }}>
                {this.state.refreshing ? (<ActivityIndicator size="small" color="#00C853" />) : (<Animated.Text style={{
                    color: '#666',
                    opacity: this.opacityAnimation,
                }}>{this.props.default_letters || 'Pull to refresh'}</Animated.Text>)}
            </Animated.View>
            <Animated.View style={{ flex: 1, transform: [{ translateY: this.pan.y }] }} {...this.panResponder.panHandlers}>
                {this.props.keyExtractor && typeof this.props.renderItem === 'function' ? (<Animated.FlatList
                    {...this.props}
                    ref={this.scrollRef}
                    scrollEventThrottle={16}
                    onScroll={this.scrollHandler}
                />) : (<Animated.ScrollView
                    {...this.props}
                    ref={this.scrollRef}
                    scrollEventThrottle={16}
                    onScroll={this.scrollHandler}>
                    {this.props.children}
                </Animated.ScrollView>)}
            </Animated.View>
        </View>);
    }
}

export default React.forwardRef((props, ref) => (
    <SmartScrollView {...props} ref={(instance) => ref && (ref.current = instance)} />
));
