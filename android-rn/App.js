// App.js —— 根组件：导航容器 + 启动登录态检查 + 401 全局跳转
import { useEffect, useState } from 'react'
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StatusBar } from 'expo-status-bar'
import { ActivityIndicator, View, StyleSheet } from 'react-native'

import LoginScreen from './screens/LoginScreen'
import AdminScreen from './screens/AdminScreen'
import HomeScreen from './screens/HomeScreen'

import { EventEmitter, getStoredUser, getStoredToken } from './utils/api'
import { colors } from './theme'

const Stack = createNativeStackNavigator()

export default function App() {
  const navigationRef = useNavigationContainerRef()
  const [initialRoute, setInitialRoute] = useState(null)
  const [isReady, setIsReady] = useState(false)

  // 启动时检查本地缓存的登录状态，决定首屏路由
  useEffect(() => {
    (async () => {
      const token = await getStoredToken()
      const user = await getStoredUser()
      if (token && user) {
        setInitialRoute(user.role === 'admin' ? 'Admin' : 'Home')
      } else {
        setInitialRoute('Login')
      }
      setIsReady(true)
    })()
  }, [])

  // 监听 401 unauthorized 事件，重置到登录页
  useEffect(() => {
    const handler = () => {
      if (navigationRef.isReady()) {
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        })
      }
    }
    EventEmitter.on('unauthorized', handler)
    return () => EventEmitter.off('unauthorized', handler)
  }, [navigationRef])

  if (!isReady || !initialRoute) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    )
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style="dark" />
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Admin" component={AdminScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
