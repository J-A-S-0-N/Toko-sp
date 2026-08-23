import { useFocusEffect } from '@react-navigation/native';
import { MotiView } from 'moti';
import React, { useCallback, useState } from 'react';

interface TabEnterTransitionProps {
  children: React.ReactNode;
}

export default function TabEnterTransition({ children }: TabEnterTransitionProps) {
  const [animationKey, setAnimationKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setAnimationKey((prev) => prev + 1);
    }, [])
  );

  return (
    <MotiView
      key={animationKey}
      from={{ opacity: 0.78, translateY: 14 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 240 }}
      style={{ flex: 1 }}
    >
      {children}
    </MotiView>
  );
}
