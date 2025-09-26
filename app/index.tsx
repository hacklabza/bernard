import { StyleSheet, Text, View } from "react-native";
import Joystick from "./components/Joystick";

export default function Index() {
  const handleJoystickMove = (data: { x: number; y: number; distance: number; angle: number }) => {
    // Only output direction if there's meaningful movement
    if (data.distance > 0.3) {
      const absX = Math.abs(data.x);
      const absY = Math.abs(data.y);

      let direction = '';

      // Determine primary direction based on which axis has greater movement
      if (absY > absX) {
        // Vertical movement is dominant
        direction = data.y < 0 ? 'forward' : 'backward';
      } else {
        // Horizontal movement is dominant
        direction = data.x > 0 ? 'right' : 'left';
      }
      console.log("Joystick direction:", direction);
      console.log("Joystick speed:", data.distance);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Edit app/index.tsx to edit this screen.</Text>

      {/* Joystick positioned in the bottom right corner */}
      <View style={styles.joystickContainer}>
        <Joystick
          onMove={handleJoystickMove}
          size={100}
          color="#F0F0F0"
          knobColor="#4A90E2"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  text: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  joystickContainer: {
    position: "absolute",
    bottom: 50,
    right: 30,
    zIndex: 1000,
  },
});
