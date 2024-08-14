# @chainplatform/pull-to-refresh
React Native Pull To Refresh for React Native and React Native Web, support ScrollView and FlatList. Bring Pull To Refresh to Website.

<p align="center">
  <a href="https://github.com/ChainPlatform/pull-to-refresh/blob/HEAD/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" />
  </a>
  <a href="https://www.npmjs.com/package/@chainplatform/pull-to-refresh">
    <img src="https://img.shields.io/npm/v/@chainplatform/pull-to-refresh?color=brightgreen&label=npm%20package" alt="Current npm package version." />
  </a>
  <a href="https://www.npmjs.com/package/@chainplatform/pull-to-refresh">
    <img src="https://img.shields.io/npm/dt/@chainplatform/pull-to-refresh.svg"></img>
  </a>
  <a href="https://www.npmjs.com/package/@chainplatform/pull-to-refresh">
    <img src="https://img.shields.io/badge/platform-android%20%7C%20ios%20%7C%20web-blue"></img>
  </a>
  <a href="https://github.com/ChainPlatform/pull-to-refresh/pulls">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs welcome!" />
  </a>
  <a href="https://twitter.com/intent/follow?screen_name=doansan">
    <img src="https://img.shields.io/twitter/follow/doansan.svg?label=Follow%20@doansan" alt="Follow @doansan" />
  </a>
</p>

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

onRefresh() {
  this.setState({refreshing: true});
}

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
                    refreshing={this.state.refreshing}
                    onRefresh={() => this.onRefresh()}
                >

                </ChainScrollView>
      </View>
    );
  }
}
```