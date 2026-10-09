import { Tabs } from 'expo-router';
import BottomNav from '../../components/BottomNav';
import { Colors } from '../../constants/theme';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomNav {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: Colors.surface },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="tiket" />
      <Tabs.Screen name="riwayat" />
      <Tabs.Screen name="voucher" />
      <Tabs.Screen name="akun" />
    </Tabs>
  );
}