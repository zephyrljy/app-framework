import { Tabs } from "expo-router/js-tabs";
import { Text } from "react-native";

export default function TabLayout() {
  return <Tabs screenOptions={{ tabBarActiveTintColor: "#173f32", headerTintColor: "#173f32" }}>
    <Tabs.Screen name="index" options={{ title: "首页", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>◈</Text> }} />
  </Tabs>;
}
