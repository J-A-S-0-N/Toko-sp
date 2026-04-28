import { ThemedText as Text } from "@/components/themed-text";
import { FONT } from '@/constants/theme';
import React from "react";
import { StyleSheet, View } from "react-native";
import { moderateScale } from "react-native-size-matters";

const ScanHeader = () => {
  return (
    <View style={styles.titleBlock}>
      <Text type="barlowHard" style={styles.title}>
        스캔
      </Text>
      <Text type="barlowLight" style={styles.subtitle}>
        스코어카드를 찍거나 갤러리에서 선택하세요
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  titleBlock: {
    paddingHorizontal: moderateScale(10),
  },
  title: {
    color: "#EFF2EE",
    fontSize: moderateScale(FONT.xl),
  },
  subtitle: {
    color: "#5F6668",
    fontSize: moderateScale(FONT.xs),
  },
});

export default ScanHeader;
