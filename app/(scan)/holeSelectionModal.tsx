import { ThemedText as Text } from '@/components/themed-text';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, View } from 'react-native';
import { moderateScale } from 'react-native-size-matters';

type HoleSelectionModalProps = {
  visible: boolean;
  onClose: () => void;
};

export default function HoleSelectionModal({
  visible,
  onClose,
}: HoleSelectionModalProps) {
  const [selectedHole, setSelectedHole] = useState<9 | 18>(18);
  const [isModalVisible, setIsModalVisible] = useState(visible);
  const progress = useRef(new Animated.Value(0)).current;
  const holeSelectionProgress = useRef(new Animated.Value(selectedHole === 18 ? 1 : 0)).current;

  const routeToScreen = () => {
    onClose();
    router.push({
      pathname: "/(scan)/capture",
      params: {
        holes: String(selectedHole),
        shotIndex: "1",
        photos: JSON.stringify([]),
      }
    });
  };

  useEffect(() => {
    if (visible) {
      setIsModalVisible(true);
      progress.setValue(0);
      const openAnimation = Animated.timing(progress, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      });

      openAnimation.start();

      return () => {
        openAnimation.stop();
      };
    }

    const closeAnimation = Animated.timing(progress, {
      toValue: 0,
      duration: 240,
      useNativeDriver: true,
    });

    closeAnimation.start(({ finished }) => {
      if (finished) {
        setIsModalVisible(false);
      }
    });

    return () => {
      closeAnimation.stop();
    };
  }, [visible, progress]);

  useEffect(() => {
    const selectionAnimation = Animated.spring(holeSelectionProgress, {
      toValue: selectedHole === 18 ? 1 : 0,
      damping: 16,
      stiffness: 220,
      mass: 0.7,
      useNativeDriver: false,
    });

    selectionAnimation.start();

    return () => {
      selectionAnimation.stop();
    };
  }, [selectedHole, holeSelectionProgress]);

  const backdropOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const cardTranslateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });

  const nineCardBorderColor = holeSelectionProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['#3CFFB5', '#2B3138'],
  });

  const eighteenCardBorderColor = holeSelectionProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['#2B3138', '#3CFFB5'],
  });

  const nineCardBackgroundColor = holeSelectionProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['#0D2A22', '#1E2222'],
  });

  const eighteenCardBackgroundColor = holeSelectionProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['#1E2222', '#0D2A22'],
  });

  const nineValueColor = holeSelectionProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['#3CFFB5', '#5F656D'],
  });

  const eighteenValueColor = holeSelectionProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['#5F656D', '#3CFFB5'],
  });

  const nineLabelColor = holeSelectionProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['#53F5B7', '#8A9098'],
  });

  const eighteenLabelColor = holeSelectionProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['#8A9098', '#53F5B7'],
  });

  const nineSubLabelColor = holeSelectionProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['#78C5AB', '#60656D'],
  });

  const eighteenSubLabelColor = holeSelectionProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['#60656D', '#78C5AB'],
  });

  const nineCardScale = holeSelectionProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1.03, 0.96],
  });

  const eighteenCardScale = holeSelectionProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1.03],
  });

  const nineCardOpacity = holeSelectionProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.86],
  });

  const eighteenCardOpacity = holeSelectionProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.86, 1],
  });

  return (
    <Modal
      animationType="none"
      transparent
      presentationStyle="overFullScreen"
      statusBarTranslucent
      visible={isModalVisible}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <Animated.View
            pointerEvents="none"
            style={[styles.backdrop, { opacity: backdropOpacity }]}
          />
        </Pressable>

        <Animated.View
          style={[styles.card, { transform: [{ translateY: cardTranslateY }] }]}
        >
          <View style={styles.handle} />

          <Text style={styles.title}>몇 홀 라운드인가요?</Text>
          <Text style={styles.description}>홀 수에 맞게 스코어카드를 촬영합니다</Text>

          <View style={styles.optionsRow}>
            <Animated.View
              style={[
                styles.optionCard,
                {
                  borderColor: nineCardBorderColor,
                  backgroundColor: nineCardBackgroundColor,
                  transform: [{ scale: nineCardScale }],
                  opacity: nineCardOpacity,
                },
              ]}
            >
              <Pressable
                style={styles.optionPressable}
                onPress={() => setSelectedHole(9)}
              >
                <Animated.Text
                  style={[
                    styles.optionValue,
                    { color: nineValueColor },
                  ]}
                  allowFontScaling={false}
                >
                  9 홀
                </Animated.Text>
                <Animated.Text
                  style={[
                    styles.optionSubLabel,
                    { color: nineSubLabelColor },
                  ]}
                  allowFontScaling={false}
                >
                  사진 1장
                </Animated.Text>
              </Pressable>
            </Animated.View>

            <Animated.View
              style={[
                styles.optionCard,
                {
                  borderColor: eighteenCardBorderColor,
                  backgroundColor: eighteenCardBackgroundColor,
                  transform: [{ scale: eighteenCardScale }],
                  opacity: eighteenCardOpacity,
                },
              ]}
            >
              <Pressable
                style={styles.optionPressable}
                onPress={() => setSelectedHole(18)}
              >
                <Animated.Text
                  style={[
                    styles.optionValue,
                    { color: eighteenValueColor },
                  ]}
                  allowFontScaling={false}
                >
                  18 홀
                </Animated.Text>
                <Animated.Text
                  style={[
                    styles.optionSubLabel,
                    { color: eighteenSubLabelColor },
                  ]}
                  allowFontScaling={false}
                >
                  사진 2장
                </Animated.Text>
              </Pressable>
            </Animated.View>
          </View>

          <Pressable style={styles.button} onPress={routeToScreen}>
            <Text style={styles.buttonText}>카메라 열기</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  card: {
    backgroundColor: '#0C0E0E',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },
  handle: {
    alignSelf: 'center',
    width: 54,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#5F6368',
    marginBottom: 24,
  },
  title: {
    fontSize: moderateScale(22),
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -0.6,
  },
  description: {
    fontSize: moderateScale(14),
    color: '#8B9199',
    marginBottom: 20,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 28,
  },
  optionCard: {
    flex: 1,
    borderRadius: moderateScale(20),
    borderWidth: 1,
    overflow: 'hidden',
  },
  optionPressable: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    width: '100%',
  },
  optionValue: {
    fontSize: moderateScale(26),
    fontWeight: '800',
    marginBottom: 4,
  },
  optionLabel: {
    fontSize: 21,
    fontWeight: '700',
    marginBottom: 8,
  },
  optionSubLabel: {
    fontSize: 17,
  },
  button: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#3A3F45',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(10),
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: moderateScale(15),
  },
});