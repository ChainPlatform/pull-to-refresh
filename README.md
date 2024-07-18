## Table of contents
- [Install](#install)
- [Usage](#usage)
- [Example](#example)
- [Changelog](#changelog)

### Install
```
npm install @chainplatform/pull-to-refresh --save
```
or
```
yarn add @chainplatform/pull-to-refresh
```

### Usage

props:

- support full FlatList and ScrollView props

### Example

```js
import React from 'react';
import {StyleSheet} from 'react-native';
import ChainScrollView from '@chainplatform/pull-to-refresh';

class App extends React.Component {

  render() {
    return (
      <View style={{flex:1}}>
          <ChainScrollView
                    ref={this.ref}
                    testID={"scroll_view"}
                    style={{ flexGrow: 1, flexBasis: 0, padding: 15 }}
                    scrollEventThrottle={16}
                    bounces={false}
                    overScrollMode="never"
                    scrollEnabled={true}
                    bouncesZoom={false}
                    horizontal={false}
                    alwaysBounceHorizontal={false}
                    alwaysBounceVertical={false}
                >

                </ChainScrollView>
      </View>
    );
  }
}
```