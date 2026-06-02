import { ThemedText as Text } from "@/components/themed-text";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing } from "react-native";

export interface AnimatedNumberProps {
  value: string | number;
  style?: object;
  delay?: number;
  duration?: number;
  trigger: number;
}

const AnimatedNumber = ({ value, style, delay = 0, duration = 1000, trigger }: AnimatedNumberProps) => {
  const animValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState('0');

  const numericValue = useMemo(() => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? 0 : num;
  }, [value]);

  const isDecimal = useMemo(() => {
    return numericValue % 1 !== 0;
  }, [numericValue]);

  useEffect(() => {
    animValue.setValue(0);
    setDisplayValue(isDecimal ? '0.0' : '0');

    const timeoutId = setTimeout(() => {
      if (trigger > 0) {
        Animated.timing(animValue, {
          toValue: numericValue,
          duration,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }).start(({ finished }) => {
          if (finished) {
            setDisplayValue(String(value));
          }
        });
      }
    }, 10);

    return () => clearTimeout(timeoutId);
  }, [trigger, numericValue, delay, duration, isDecimal, value, animValue]);

  useEffect(() => {
    const listener = animValue.addListener(({ value: v }) => {
      if (isDecimal) {
        setDisplayValue(v.toFixed(1));
      } else {
        setDisplayValue(Math.round(v).toString());
      }
    });

    return () => animValue.removeListener(listener);
  }, [animValue, isDecimal]);

  if (typeof value === 'string' && isNaN(parseFloat(value))) {
    return <Text type="barlowLight" style={style}>{value}</Text>;
  }

  return <Text type="barlowLight" style={style}>{displayValue}</Text>;
};

export default AnimatedNumber;
