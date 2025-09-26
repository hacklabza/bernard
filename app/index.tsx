import { StyleSheet, Text, View } from "react-native";
import Joystick from "./components/Joystick";
import { useRef } from "react";

const API_BASE_URL = 'http://192.168.68.103:8000/api';

export default function Index() {
  const isCommandInProgress = useRef(false);

  const sendDriveCommand = async (direction: string, duration: number = 100, speed: number = 1.0) => {
    // Don't send command if one is already in progress
    if (isCommandInProgress.current && direction !== 'stop') {
      console.log('Command already in progress, skipping...');
      return;
    }

    isCommandInProgress.current = true;

    try {
      let response: Response;

      if (direction === 'stop') {
        console.log(`Sending command: stop`);

        response = await fetch(`${API_BASE_URL}/motion/drivetrain/stop`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

      } else {
        console.log(`Sending command: ${direction} for ${duration}s at speed ${speed}`);

        response = await fetch(`${API_BASE_URL}/motion/drivetrain/go`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            direction,
            duration,
            speed,
          }),
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Wait for the command duration before allowing next command
      setTimeout(() => {
        isCommandInProgress.current = false;
        console.log('Command completed, ready for next command');
      }, 50);

      return result;

    } catch (error) {
      console.error('Error sending drive command:', error);
      // Reset flag on error so we can try again
      isCommandInProgress.current = false;
    }
  };

  const handleJoystickMove = (data: { x: number; y: number; distance: number; angle: number }) => {
    // Only output direction if there's meaningful movement
    if (data.distance > 0.2) {
      const absX = Math.abs(data.x);
      const absY = Math.abs(data.y);

      let direction = '';

      // Determine primary direction based on which axis has greater movement
      if (absY > absX) {
        // Vertical movement is dominant
        direction = data.y < 0 ? 'forward' : 'back';
      } else {
        // Horizontal movement is dominant
        direction = data.x > 0 ? 'right' : 'left';
      }
      console.log("Joystick direction:", direction);
      console.log("Joystick speed:", data.distance);

      // Send command to backend with 100 second duration
      sendDriveCommand(direction, 100, data.distance);
    } else if (data.distance === 0) {
      // Joystick is in neutral position, stop the robot
      console.log("Joystick in neutral position, no command sent");
      sendDriveCommand('stop');
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
