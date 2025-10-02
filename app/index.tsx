import { StyleSheet, Text, View, Dimensions } from "react-native";
import Joystick from "./components/Joystick";
import MjpegStream from "./components/MjpegStream";
import { useRef, useState, useEffect } from "react";
import { drivetrainService, type DriveCommand, cameraService } from "../services/api";

export default function Index() {
  const isCommandInProgress = useRef(false);
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [isLandscape, setIsLandscape] = useState(
    screenData.width > screenData.height
  );
  const baseStreamUrl = cameraService.getStreamUrl();

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
      setIsLandscape(window.width > window.height);
    });

    return () => subscription?.remove();
  }, []);

  const sendDriveCommand = async (direction: string, duration: number = 100, speed: number = 1.0) => {
    // Don't send command if one is already in progress
    if (isCommandInProgress.current && direction !== 'stop') {
      console.log('Command already in progress, skipping...');
      return;
    }

    isCommandInProgress.current = true;

    try {
      let result;

      if (direction === 'stop') {
        result = await drivetrainService.sendStopCommand();
      } else {
        const command: DriveCommand = {
          direction: direction as DriveCommand['direction'],
          duration,
          speed,
        };
        result = await drivetrainService.sendGoCommand(command);
      }

      // Wait for a short delay before allowing next command
      setTimeout(() => {
        isCommandInProgress.current = false;
        console.log('Command completed, ready for next command');
      }, 500);

      return result;

    } catch (error) {
      console.error('Error sending drive command:', error);
      // Reset flag on error so we can try again
      isCommandInProgress.current = false;
    }
  };

  const handleJoystickMove = (data: { x: number; y: number; distance: number; angle: number }) => {
    // Only output direction if there's meaningful movement
    const absX = Math.abs(data.x);
    const absY = Math.abs(data.y);
    if (data.distance > 0.3) {
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
    } else if (absX < 0.1 && absY < 0.1) {
      // Joystick is in neutral position, stop the robot
      console.log("Joystick in neutral position, stop command sent");
      sendDriveCommand('stop');
    }
  };

  // Dynamic joystick positioning based on orientation
  const getJoystickStyle = () => {
    const baseStyle = {
      position: 'absolute' as const,
      zIndex: 1000,
    };

    if (isLandscape) {
      // In landscape: position in bottom-right, but further from edge
      return {
        ...baseStyle,
        bottom: 30,
        right: 60, // More space from right edge in landscape
      };
    } else {
      // In portrait: standard bottom-right positioning
      return {
        ...baseStyle,
        bottom: 50,
        right: 30,
      };
    }
  };

  // Dynamic camera stream sizing based on orientation
  const getCameraStreamStyle = () => {
    if (isLandscape) {
      // In landscape: take up most of the screen, leave room for joystick
      return {
        width: screenData.width - 200, // Leave space for joystick
        height: screenData.height - 100, // Leave space for top/bottom margins
        maxHeight: screenData.height * 0.8,
      };
    } else {
      // In portrait: take up upper portion of screen
      return {
        width: screenData.width - 40, // Margins on sides
        height: screenData.height * 0.5, // Take up half the screen
        maxHeight: 400,
      };
    }
  };

  return (
    <View style={styles.container}>

      {/* Camera Stream */}
      <View style={styles.cameraContainer}>
        <MjpegStream
          baseUrl={baseStreamUrl}
          containerWidth={screenData.width}
          containerHeight={screenData.height}
          style={styles.fullScreenStream}
          fallbackText="Robot Camera"
          onError={(error) => console.error('Camera stream error:', error)}
          onLoad={() => console.log('Camera stream loaded successfully')}
          autoOptimizeDimensions={true}
        />
      </View>

      {/* Joystick with dynamic positioning */}
      <View style={getJoystickStyle()}>
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
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "#fff",
    // Remove paddingTop to fill entire screen
  },
  text: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  cameraContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  fullScreenStream: {
    width: '100%',
    height: '100%',
  },
});
