import React, { PureComponent } from 'react';
import { Animated, View, Platform } from 'react-native';

class DancingText extends PureComponent {
    constructor(props) {
        super(props);

        this.letters = typeof this.props.letters != "undefined" && this.props.letters != "" ? this.props.letters.split("") : "Chain".split("");
        this.animations = this.letters.map(() => new Animated.Value(0));
    }

    componentDidMount() {
        this.startAnimationSequence();
    }

    startAnimationSequence = () => {
        const animations = this.animations.map((anim, index) =>
            Animated.sequence([
                Animated.timing(anim, {
                    toValue: -5,
                    duration: 200,
                    useNativeDriver: Platform.OS === "web" ? false : true,
                }),
                Animated.timing(anim, {
                    toValue: 5,
                    duration: 200,
                    useNativeDriver: Platform.OS === "web" ? false : true,
                }),
                Animated.timing(anim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: Platform.OS === "web" ? false : true,
                }),
            ])
        );
        const staggeredAnimation = Animated.stagger(200, animations);
        Animated.loop(staggeredAnimation).start();
    };

    render() {
        return (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                {this.letters.map((letter, index) => (
                    <Animated.Text key={index} style={[typeof this.props.textStyle != "undefined" ? this.props.textStyle : {
                        fontSize: 14,
                        fontWeight: 'bold',
                        color: '#4CAF50'
                    }, {
                        transform: [{
                            translateY: this.animations[index]
                        }]
                    }
                    ]}>{letter}</Animated.Text>
                ))}
            </View>
        );
    }
}

export default DancingText;
