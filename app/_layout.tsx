import { Stack } from "expo-router";
import { RobotProvider } from '../contexts/RobotContext';

export default function RootLayout() {
  return (
    <RobotProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          orientation: 'all',
          gestureEnabled: false,
          contentStyle: { backgroundColor: '#000' },
        }}
      />
    </RobotProvider>
  );
}
