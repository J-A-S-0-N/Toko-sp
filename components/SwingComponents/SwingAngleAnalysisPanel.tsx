import { ThemedText as Text } from "@/components/themed-text";
import { FONT } from "@/constants/theme";
import React from "react";
import { Image, Modal, Pressable, StyleSheet, View } from "react-native";
import { moderateScale } from "react-native-size-matters";

type AngleMetric = {
  key: string;
  label: string;
  valueDeg: number | null;
  descriptionLines: string[];
  detectable: boolean;
  tag: string;
  tagColor: string;
};

type AngleOverlay = {
  status: string;
  imageUrl: string;
};

type SwingAngleAnalysisPanelProps = {
  analysisDocument?: Record<string, unknown> | null;
  mode?: "full" | "statsOnly";
  showImage?: boolean;
};

function toText(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

function toAngleLabel(rawKey: string, rawLabel: string) {
  if (rawKey === "shaftAngle") return "샤프트 각도";
  if (rawKey === "spineAngle") return "스파인 각도";
  return rawLabel || "각도";
}

function parseMetrics(value: unknown): AngleMetric[] {
  if (!value || typeof value !== "object") return [];
  const angleAnalysis = value as Record<string, unknown>;
  const anglesRaw = Array.isArray(angleAnalysis.angles) ? angleAnalysis.angles : [];

  return anglesRaw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const metric = item as Record<string, unknown>;
      const key = toText(metric.key, "");
      const label = toText(metric.label, "");
      const valueRaw = Number(metric.valueDeg);
      const valueDeg = Number.isFinite(valueRaw) ? valueRaw : null;
      const descriptionsRaw = Array.isArray(metric.descriptionLines) ? metric.descriptionLines : [];
      const descriptionLines = descriptionsRaw
        .map((line) => toText(line, ""))
        .filter(Boolean)
        .slice(0, 2);
      return {
        key,
        label: toAngleLabel(key, label),
        valueDeg,
        descriptionLines,
        detectable: Boolean(metric.detectable),
        tag: toText(metric.tag, "주의"),
        tagColor: toText(metric.tagColor, "#EF4444"),
      } satisfies AngleMetric;
    })
    .filter((metric): metric is AngleMetric => metric !== null);
}

function parseOverlay(value: unknown): AngleOverlay | null {
  if (!value || typeof value !== "object") return null;
  const overlay = value as Record<string, unknown>;
  return {
    status: toText(overlay.status, ""),
    imageUrl: toText(overlay.imageUrl, ""),
  };
}

function formatDegree(valueDeg: number | null) {
  if (!Number.isFinite(Number(valueDeg))) return "--";
  const rounded = Math.round(Number(valueDeg));
  return `${rounded > 0 ? "+" : ""}${rounded}°`;
}

export default function SwingAngleAnalysisPanel({
  analysisDocument = null,
  mode = "full",
  showImage,
}: SwingAngleAnalysisPanelProps) {
  const [isFullscreenVisible, setIsFullscreenVisible] = React.useState(false);
  const metrics = React.useMemo(
    () => parseMetrics(analysisDocument?.angleAnalysis),
    [analysisDocument]
  );
  const overlay = React.useMemo(
    () => parseOverlay(analysisDocument?.angleOverlay),
    [analysisDocument]
  );

  if (!metrics.length) return null;
  const shouldShowImage = typeof showImage === "boolean" ? showImage : mode === "full";
  const canOpenFullscreen = Boolean(overlay?.imageUrl);
  const openFullscreen = () => {
    if (!canOpenFullscreen) return;
    setIsFullscreenVisible(true);
  };

  return (
    <View style={styles.sectionWrap}>
      {mode === "full" ? (
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderBar} />
          <Text type="barlowHard" style={styles.sectionTitle}>
            각도 분석
          </Text>
        </View>
      ) : null}

      {shouldShowImage && overlay?.imageUrl ? (
        <Pressable onPress={openFullscreen}>
          <Image source={{ uri: overlay.imageUrl }} style={styles.overlayImage} resizeMode="cover" />
        </Pressable>
      ) : null}
      {shouldShowImage && !overlay?.imageUrl && (overlay?.status === "pending" || overlay?.status === "rendering") ? (
        <View style={styles.overlayPlaceholder}>
          <Text type="barlowLight" style={styles.overlayPlaceholderText}>
            각도 오버레이 이미지를 생성 중입니다.
          </Text>
        </View>
      ) : null}

      <View style={styles.cardList}>
        {metrics.map((metric) => (
          <Pressable
            key={metric.key || metric.label}
            style={styles.metricCard}
            onPress={openFullscreen}
            disabled={!canOpenFullscreen}
          >
            <View style={styles.metricTopRow}>
              <Text type="barlowHard" style={styles.metricLabel}>
                {metric.label}
              </Text>
              <View style={styles.metricValueWrap}>
                <Text type="barlowHard" style={styles.metricValue}>
                  {metric.detectable ? formatDegree(metric.valueDeg) : "--"}
                </Text>
                <View style={[styles.metricTagPill, { backgroundColor: `${metric.tagColor}33` }]}>
                  <Text type="barlowHard" style={[styles.metricTagText, { color: metric.tagColor }]}>
                    {metric.tag}
                  </Text>
                </View>
              </View>
            </View>

            {mode === "full" ? (
              <Text type="barlowLight" style={styles.metricDescription}>
                {(metric.descriptionLines.join(" ") || "분석 설명이 아직 준비되지 않았습니다.").trim()}
              </Text>
            ) : null}
          </Pressable>
        ))}
      </View>

      <Modal
        visible={isFullscreenVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsFullscreenVisible(false)}
      >
        <View style={styles.fullscreenOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setIsFullscreenVisible(false)}
          />
          <View style={styles.fullscreenImageWrap}>
            {overlay?.imageUrl ? (
              <Image source={{ uri: overlay.imageUrl }} style={styles.fullscreenImage} resizeMode="contain" />
            ) : null}
          </View>
          <Pressable
            style={styles.fullscreenCloseButton}
            onPress={() => setIsFullscreenVisible(false)}
          >
            <Text type="barlowHard" style={styles.fullscreenCloseButtonText}>
              닫기
            </Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionWrap: {
    marginTop: moderateScale(12),
    marginBottom: moderateScale(12),
    gap: moderateScale(10),
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    paddingHorizontal: moderateScale(2),
  },
  sectionHeaderBar: {
    width: moderateScale(4),
    height: moderateScale(24),
    borderRadius: moderateScale(6),
    backgroundColor: "#F0C840",
  },
  sectionTitle: {
    color: "#F3D55A",
    fontSize: moderateScale(FONT.lg),
  },
  overlayImage: {
    width: "100%",
    height: moderateScale(214),
    borderRadius: moderateScale(18),
    borderWidth: 1,
    borderColor: "#183C33",
    backgroundColor: "#0B1714",
  },
  overlayPlaceholder: {
    width: "100%",
    height: moderateScale(144),
    borderRadius: moderateScale(18),
    borderWidth: 1,
    borderColor: "#183C33",
    backgroundColor: "#0B1714",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: moderateScale(12),
  },
  overlayPlaceholderText: {
    color: "#9FB2AC",
    fontFamily: "Pretendard-Regular",
    fontSize: moderateScale(FONT.xs),
    textAlign: "center",
  },
  cardList: {
    gap: moderateScale(10),
  },
  metricCard: {
    borderRadius: moderateScale(18),
    borderWidth: 1,
    borderColor: "#184339",
    backgroundColor: "#102621",
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(14),
    gap: moderateScale(8),
  },
  metricTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: moderateScale(8),
  },
  metricLabel: {
    color: "#F2F7F4",
    fontSize: moderateScale(FONT.lg),
    flex: 1,
  },
  metricValueWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
  },
  metricValue: {
    color: "#F3D55A",
    fontSize: moderateScale(FONT.xl),
  },
  metricTagPill: {
    borderRadius: moderateScale(999),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(5),
  },
  metricTagText: {
    fontSize: moderateScale(FONT.xs),
  },
  metricDescription: {
    color: "#E2ECE8",
    fontFamily: "Pretendard-Regular",
    fontSize: moderateScale(FONT.md),
    lineHeight: moderateScale(30),
  },
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(24),
  },
  fullscreenImageWrap: {
    width: "100%",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  fullscreenImage: {
    width: "100%",
    height: "100%",
  },
  fullscreenCloseButton: {
    marginTop: moderateScale(10),
    borderRadius: moderateScale(999),
    paddingHorizontal: moderateScale(18),
    paddingVertical: moderateScale(10),
    backgroundColor: "#1C2B27",
    borderWidth: 1,
    borderColor: "#2E4740",
  },
  fullscreenCloseButtonText: {
    color: "#E5EEEB",
    fontSize: moderateScale(FONT.sm),
  },
});
