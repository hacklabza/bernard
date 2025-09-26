import React, { useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';

interface JoystickProps {
  onMove?: (data: { x: number; y: number; distance: number; angle: number }) => void;
  size?: number;
  color?: string;
  knobColor?: string;
  maxDistance?: number;
}

const Joystick: React.FC<JoystickProps> = ({
  onMove,
  size = 120,
  color = '#E0E0E0',
  knobColor = '#4A90E2',
  maxDistance,
}) => {
  const [knobPosition, setKnobPosition] = useState({ x: 0, y: 0 });
  const centerPosition = useRef({ x: size / 2, y: size / 2 });
  const maxDist = maxDistance || size / 2 - 15; // Default max distance

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderMove: (event, gestureState) => {
        const { dx, dy } = gestureState;
        const distance = Math.sqrt(dx * dx + dy * dy);

        let newX = dx;
        let newY = dy;

        // Constrain movement within the circle
        if (distance > maxDist) {
          const ratio = maxDist / distance;
          newX = dx * ratio;
          newY = dy * ratio;
        }

        setKnobPosition({ x: newX, y: newY });

        // Calculate angle and normalized values
        const angle = Math.atan2(dy, dx);
        const normalizedDistance = Math.min(distance / maxDist, 1);
        const normalizedX = newX / maxDist;
        const normalizedY = newY / maxDist;

        onMove?.({
          x: normalizedX,
          y: normalizedY,
          distance: normalizedDistance,
          angle: angle,
        });
      },

      onPanResponderRelease: () => {
        // Snap back to center
        setKnobPosition({ x: 0, y: 0 });
        onMove?.({ x: 0, y: 0, distance: 0, angle: 0 });
      },
    })
  ).current;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Base circle */}
      <View
        style={[
          styles.base,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
        ]}
      />

      {/* Knob */}
      <View
        style={[
          styles.knob,
          {
            backgroundColor: knobColor,
            transform: [
              { translateX: knobPosition.x },
              { translateY: knobPosition.y },
            ],
          },
        ]}
        {...panResponder.panHandlers}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  base: {
    position: 'absolute',
    opacity: 0.3,
    borderWidth: 2,
    borderColor: '#CCCCCC',
  },
  knob: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default Joystick;
