import { ThemedText } from "@/components/themed-text";
import { db } from "@/config/firebase";
import { FONT } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";
import { moderateScale } from "react-native-size-matters";

interface StatsData {
  averageScore: number;
  bestScore: number;
  roundsPlayed: number;
  averageDelta: number;
}

interface StatCardProps {
    label: string;
    value: string;
    valueColor?: string;
    subStats: { label: string; value: string; color: string }[];
    isCollapsed: boolean;
    onToggle: () => void;
}

const StatCard = ({ label, value, valueColor, subStats, isCollapsed, onToggle }: StatCardProps) => {
    const borderAnim = useRef(new Animated.Value(isCollapsed ? 0 : 1)).current;

    useEffect(() => {
        Animated.timing(borderAnim, {
            toValue: isCollapsed ? 0 : 1,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [isCollapsed]);

    const borderColor = borderAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["transparent", "#49DF80"],
    });

    return (
        <Animated.View
            style={{
                backgroundColor: "#202222",
                borderRadius: moderateScale(14),
                marginBottom: moderateScale(10),
                borderWidth: 1.5,
                borderColor,
            }}
        >
        <TouchableOpacity
            onPress={onToggle}
            activeOpacity={0.85}
            style={{
                paddingHorizontal: moderateScale(10),
                paddingVertical: moderateScale(14),
            }}
        >
            {/* Header row */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ color: "#9BA1A6", fontSize: moderateScale(FONT.xs), fontWeight: "500" }}>
                    {label}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: moderateScale(6) }}>
                    <ThemedText type="barlowHard" style={{ color: valueColor ?? "#ECEDEE", fontSize: moderateScale(FONT.lg) }}>
                        {value}
                    </ThemedText>
                    <Text style={{ color: "#9BA1A6", fontSize: moderateScale(FONT.xs) }}>
                        {isCollapsed ? "▼" : "▲"}
                    </Text>
                </View>
            </View>

            {/* Expanded sub-stats */}
            {!isCollapsed && (
                <View style={{ flexDirection: "row", gap: moderateScale(5), marginTop: moderateScale(10) }}>
                    {subStats.map((s, i) => (
                        <View
                            key={i}
                            style={{
                                flex: 1,
                                backgroundColor: "#151718",
                                borderRadius: moderateScale(10),
                                paddingVertical: moderateScale(10),
                                alignItems: "center",
                            }}
                        >
                            <Text style={{ color: "#9BA1A6", fontSize: moderateScale(FONT.xxs), marginBottom: moderateScale(6) }}>
                                {s.label}
                            </Text>
                            <ThemedText type="barlowHard" style={{ color: s.color, fontSize: moderateScale(FONT.xl) }}>
                                {s.value}
                            </ThemedText>
                        </View>
                    ))}
                </View>
            )}
        </TouchableOpacity>
        </Animated.View>
    );
};

const HeaderStatPage = () => {
    const { user } = useAuth();

    //average, best, activity, averageDelta
    const [statAisCollapsed, setIsACollapsed] = useState(true); // Average Score
    const [statBisCollapsed, setIsBCollapsed] = useState(true); // Best Score
    const [statCisCollapsed, setIsCCollapsed] = useState(true); // Activity Count
    const [statDisCollapsed, setIsDCollapsed] = useState(true); // Average Delta

    // Stats data
    const [allTimeStats, setAllTimeStats] = useState<StatsData | null>(null);
    const [weeklyStats, setWeeklyStats] = useState<StatsData | null>(null);
    const [monthlyStats, setMonthlyStats] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.uid) return;

        const fetchStats = async () => {
            try {
                const [allTimeSnap, weeklySnap, monthlySnap] = await Promise.all([
                    getDoc(doc(db, 'Users', user.uid, 'Stats', 'AllTimeScore')),
                    getDoc(doc(db, 'Users', user.uid, 'Stats', 'WeeklyScore')),
                    getDoc(doc(db, 'Users', user.uid, 'Stats', 'MonthlyScore')),
                ]);

                setAllTimeStats(allTimeSnap.data() as StatsData);
                setWeeklyStats(weeklySnap.data() as StatsData);
                setMonthlyStats(monthlySnap.data() as StatsData);
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [user?.uid]);

    const formatValue = (value: number | undefined, suffix = '') => {
        if (loading || value === undefined || value === 999) return '-';
        return `${value}${suffix}`;
    };

    return (
        <View style={{ paddingTop: 12 }}>
            {/* Average Score */}
            <StatCard
                label="평균 스코어"
                value={formatValue(allTimeStats?.averageScore)}
                subStats={[
                    { label: "이번 주", value: formatValue(weeklyStats?.averageScore), color: "#49DF80" },
                    { label: "이번 달", value: formatValue(monthlyStats?.averageScore), color: "#F5A623" },
                    { label: "전체", value: formatValue(allTimeStats?.averageScore), color: "#ECEDEE" },
                ]}
                isCollapsed={statAisCollapsed}
                onToggle={() => setIsACollapsed((v) => !v)}
            />

            {/* Best Score */}
            <StatCard
                label="베스트 스코어"
                value={formatValue(allTimeStats?.bestScore)}
                valueColor="#F0B529"
                subStats={[
                    { label: "이번 달", value: formatValue(monthlyStats?.bestScore), color: "#49DF80" },
                    { label: "전체", value: formatValue(allTimeStats?.bestScore), color: "#ECEDEE" },
                ]}
                isCollapsed={statBisCollapsed}
                onToggle={() => setIsBCollapsed((v) => !v)}
            />

            {/* Activity Count */}
            <StatCard
                label="라운드 수"
                value={formatValue(allTimeStats?.roundsPlayed, ' 회')}
                subStats={[
                    { label: "이번 달", value: formatValue(monthlyStats?.roundsPlayed), color: "#49DF80" },
                    { label: "주간", value: formatValue(weeklyStats?.roundsPlayed), color: "#F5A623" },
                    { label: "전체", value: formatValue(allTimeStats?.roundsPlayed), color: "#ECEDEE" },
                ]}
                isCollapsed={statCisCollapsed}
                onToggle={() => setIsCCollapsed((v) => !v)}
            />

            {/* Average Delta */}
            <StatCard
                label="평타"
                value={formatValue(allTimeStats?.averageDelta)}
                valueColor="#4DAE82"
                subStats={[
                    { label: "이번 달", value: formatValue(monthlyStats?.averageDelta), color: "#49DF80" },
                    { label: "주간", value: formatValue(weeklyStats?.averageDelta), color: "#F5A623" },
                    { label: "전체", value: formatValue(allTimeStats?.averageDelta), color: "#ECEDEE" },
                ]}
                isCollapsed={statDisCollapsed}
                onToggle={() => setIsDCollapsed((v) => !v)}
            />
        </View>
    );
};

export default HeaderStatPage;