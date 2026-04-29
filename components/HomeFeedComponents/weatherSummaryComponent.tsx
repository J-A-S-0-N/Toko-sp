import { ThemedText as Text } from "@/components/themed-text";
import { FONT } from '@/constants/theme';
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { moderateScale } from "react-native-size-matters";

type WeatherData = {
  temp: number;
  windspeed: number;
  humidity: number;
  weatherCode: number;
};

type WeatherInfo = {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
  recommendation: string;
};

function getWeatherInfo(code: number): WeatherInfo {
  if (code === 0) return { label: "맑음", icon: "sunny", color: "#F9C94D", recommendation: "완벽한 날씨!" };
  if (code <= 2) return { label: "구름 조금", icon: "partly-sunny", color: "#A8C8E8", recommendation: "라운드 추천" };
  if (code === 3) return { label: "흐림", icon: "cloudy", color: "#7F91A7", recommendation: "플레이 가능" };
  if (code <= 48) return { label: "안개", icon: "cloud", color: "#7F91A7", recommendation: "시야 주의" };
  if (code <= 67) return { label: "비", icon: "rainy", color: "#58B9FF", recommendation: "라운드 비추천" };
  if (code <= 77) return { label: "눈", icon: "snow", color: "#C8E6FF", recommendation: "코스 확인 필요" };
  if (code <= 82) return { label: "소나기", icon: "rainy", color: "#58B9FF", recommendation: "라운드 비추천" };
  return { label: "뇌우", icon: "thunderstorm", color: "#FF6B6B", recommendation: "라운드 취소 권장" };
}

const WeatherSummaryComponent = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setError("위치 권한이 필요합니다");
          setLoading(false);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = loc.coords;
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weathercode,windspeed_10m,relativehumidity_2m`;
        const res = await fetch(url);
        const json = await res.json();
        const c = json.current;
        setWeather({
          temp: Math.round(c.temperature_2m),
          windspeed: Math.round(c.windspeed_10m),
          humidity: Math.round(c.relativehumidity_2m),
          weatherCode: c.weathercode,
        });
      } catch {
        setError("날씨 정보를 불러올 수 없습니다");
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const info = weather ? getWeatherInfo(weather.weatherCode) : null;

  return (
    <LinearGradient
      colors={["#091528", "#0B1E36", "#102A48"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {loading ? (
        <ActivityIndicator color="#58B9FF" style={{ flex: 1 }} />
      ) : error || !weather || !info ? (
        <Text style={styles.errorText}>{error ?? "날씨 정보를 불러올 수 없습니다"}</Text>
      ) : (
        <>
          <View style={styles.leftContent}>
            <Text style={styles.headerLabel}>오늘의 날씨</Text>

            <View style={styles.tempRow}>
              <Ionicons name={info.icon} size={moderateScale(28)} color={info.color} />
              <Text type="barlowHard" style={styles.tempValue}>
                {weather.temp}°C
              </Text>
            </View>

            <Text style={styles.detailText}>
              {info.label} · 바람 {weather.windspeed}km/h · 습도 {weather.humidity}%
            </Text>
          </View>

          <LinearGradient
            colors={["rgba(41, 168, 149, 0.24)", "rgba(32, 114, 102, 0.16)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.recommendationCard}
          >
            <Text style={styles.recommendationLabel}>라운드 추천</Text>
            <Text type="barlowHard" style={styles.recommendationValue}>
              {info.recommendation}
            </Text>
          </LinearGradient>
        </>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: moderateScale(24),
    paddingHorizontal: moderateScale(18),
    paddingVertical: moderateScale(16),
    borderWidth: moderateScale(0.5),
    borderColor: "#1E3556",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftContent: {
    flex: 1,
    marginRight: moderateScale(12),
  },
  headerLabel: {
    color: "#58B9FF",
    fontSize: moderateScale(FONT.xxs),
    marginBottom: moderateScale(8),
  },
  tempRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
  },
  tempValue: {
    color: "#FFFFFF",
    fontSize: moderateScale(FONT.h1),
  },
  detailText: {
    marginTop: moderateScale(6),
    color: "#7F91A7",
    fontSize: moderateScale(FONT.xxs),
  },
  recommendationCard: {
    borderRadius: moderateScale(18),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    borderWidth: moderateScale(0.5),
    borderColor: "#2C7165",
    minWidth: moderateScale(128),
    alignSelf: "stretch",
    justifyContent: "center",
  },
  recommendationLabel: {
    color: "#53D2C0",
    fontSize: moderateScale(FONT.xxs),
    marginBottom: moderateScale(4),
  },
  recommendationValue: {
    color: "#FFFFFF",
    fontSize: moderateScale(FONT.lg),
  },
  errorText: {
    color: "#7F91A7",
    fontSize: moderateScale(FONT.xxs),
    flex: 1,
    textAlign: "center",
  },
});

export default WeatherSummaryComponent;
