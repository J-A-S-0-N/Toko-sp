import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { moderateScale } from 'react-native-size-matters';

import { ThemedText as Text } from '@/components/themed-text';

interface Course {
  id: string;
  name: string;
  location: string;
  holes: number;
}

const COURSES: Course[] = [
  { id: '1', name: '서울 컨트리클럽', location: '서울', holes: 18 },
  { id: '2', name: '한양 CC', location: '서울', holes: 18 },
  { id: '3', name: '뚝섬 CC', location: '서울', holes: 18 },
  { id: '4', name: '서서울 CC', location: '서울', holes: 18 },
  { id: '5', name: '88 CC', location: '서울', holes: 18 },
];

export default function CourseSelectionScreen() {
  const [courses, setCourses] = useState<Course[]>(COURSES);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [isCustomInputOpen, setIsCustomInputOpen] = useState(false);
  const [customCourseName, setCustomCourseName] = useState('');

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourses(prevSelected => {
      if (prevSelected.includes(courseId)) {
        return prevSelected.filter(id => id !== courseId);
      } else {
        if (prevSelected.length < 3) {
          return [...prevSelected, courseId];
        }
      }
      return prevSelected;
    });
  };

  const renderCourseItem = ({ item, index }: { item: Course; index: number }) => {
    const isSelected = selectedCourses.includes(item.id);
    return (
      <Pressable
        style={[styles.courseCard, isSelected && styles.courseCardSelected]}
        onPress={() => handleCourseSelect(item.id)}
      >
        <View style={[styles.courseNumberContainer, isSelected && styles.courseNumberContainerSelected]}>
          <Text style={[styles.courseNumber, isSelected && { color: '#4FB78A', fontWeight: "800" }]}>{index + 1}</Text>
        </View>
        <View style={styles.courseInfo}>
          <Text style={styles.courseName}>{item.name}</Text>
          <Text style={styles.courseDetails}>{`${item.location} · ${item.holes}홀`}</Text>
        </View>
        <View style={[styles.radioButton, isSelected && styles.radioButtonSelected]}>
          {isSelected && <Text style={styles.radioButtonText}>✓</Text>}
        </View>
      </Pressable>
    );
  };

  const handleNext = () => {
    router.push('/(onboarding)');
  };

  const handleCustomCourseAdd = () => {
    const trimmedName = customCourseName.trim();

    if (!trimmedName) {
      return;
    }

    const newCourseId = `${Date.now()}`;
    const newCourse: Course = {
      id: newCourseId,
      name: trimmedName,
      location: '서울',
      holes: 18,
    };

    setCourses(prev => [newCourse, ...prev]);
    setSelectedCourses(prevSelected => {
      if (prevSelected.length >= 3) {
        return prevSelected;
      }

      return [...prevSelected, newCourseId];
    });

    setCustomCourseName('');
    setIsCustomInputOpen(false);
  };

  const renderListHeader = () => {
    if (isCustomInputOpen) {
      return (
        <View style={styles.customInputRow}>
          <TextInput
            value={customCourseName}
            onChangeText={setCustomCourseName}
            placeholder="코스 이름 입력..."
            placeholderTextColor="#6B7379"
            style={styles.customTextInput}
          />
          <Pressable
            style={styles.customAddButton}
            onPress={handleCustomCourseAdd}
          >
            <Text style={styles.customAddButtonText}>추가</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <Pressable
        style={styles.customAddCard}
        onPress={() => setIsCustomInputOpen(true)}
      >
        <View style={styles.customAddIconWrap}>
          <Text style={styles.customAddIcon}>＋</Text>
        </View>
        <Text style={styles.customAddLabel}>목록에 없는 코스 직접 입력</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerWrap}>
          <Pressable style={styles.iconButton} onPress={() => router.back()}>
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>

          <View style={styles.progressRow}>
            <View style={[styles.progressSegment, styles.progressSegmentActive]} />
            <View style={[styles.progressSegment, styles.progressSegmentActive]} />
            <View style={[styles.progressSegment, styles.progressSegmentActive]} />
            <View style={[styles.progressSegment, styles.progressSegmentActive]} />
            <View style={[styles.progressSegment, styles.progressSegmentActive]} />
            <View style={styles.progressSegment} />
          </View>
        </View>

        <View style={styles.body}>
          <Text type="barlowHard" style={styles.title}>
            자주 가는 코스를 선택해주세요!
          </Text>
          <Text style={styles.subtitle}>
            최대 3개 선택 · 주변 구장 선
          </Text>
          <Text style={styles.selectionCount}>
            {selectedCourses.length}/3 선택됨
          </Text>

          <FlatList
            data={courses}
            renderItem={renderCourseItem}
            keyExtractor={item => item.id}
            style={styles.coursesList}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={renderListHeader}
          />
        </View>
      </View>

      <Pressable
        style={[styles.nextButton, selectedCourses.length === 0 && styles.nextButtonDisabled]}
        onPress={handleNext}
        disabled={selectedCourses.length === 0}
      >
        <Text style={[styles.nextText, selectedCourses.length === 0 && styles.nextTextDisabled]}>
          다음
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05080B',
    paddingHorizontal: moderateScale(14),
    paddingTop: moderateScale(50),
    paddingBottom: moderateScale(28),
  },
  content: {
    flex: 1,
  },
  headerWrap: {
    gap: moderateScale(18),
  },
  iconButton: {
    width: moderateScale(24),
    height: moderateScale(24),
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backArrow: {
    color: '#E6ECEF',
    fontSize: moderateScale(26),
    lineHeight: moderateScale(24),
    fontFamily: 'Pretendard-Bold',
  },
  progressRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  progressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 99,
    backgroundColor: '#1B2126',
  },
  progressSegmentActive: {
    backgroundColor: '#4FB78A',
  },
  body: {
    marginTop: moderateScale(28),
    flex: 1,
  },
  title: {
    color: '#F4F7F6',
    fontSize: moderateScale(25),
    lineHeight: moderateScale(30),
  },
  subtitle: {
    marginTop: moderateScale(6),
    color: '#656D73',
    fontSize: moderateScale(13),
    fontFamily: 'Pretendard-Regular',
  },
  selectionCount: {
    marginTop: moderateScale(4),
    color: '#4FB78A',
    fontSize: moderateScale(12),
    fontFamily: 'Pretendard-Medium',
  },
  coursesList: {
    marginTop: moderateScale(24),
  },
  customAddCard: {
    minHeight: moderateScale(72),
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#2A3137',
    backgroundColor: '#090D11',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    marginBottom: moderateScale(10),
  },
  customAddIconWrap: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(10),
    backgroundColor: '#161D22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customAddIcon: {
    color: '#8E959B',
    fontSize: moderateScale(16),
    lineHeight: moderateScale(16),
    fontFamily: 'Pretendard-Medium',
  },
  customAddLabel: {
    marginLeft: moderateScale(14),
    color: '#7A8288',
    fontSize: moderateScale(22 / 2),
    fontFamily: 'Pretendard-Medium',
  },
  customInputRow: {
    marginBottom: moderateScale(10),
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  customTextInput: {
    flex: 1,
    minHeight: moderateScale(48),
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2A3137',
    backgroundColor: '#151B20',
    paddingHorizontal: moderateScale(16),
    color: '#EAF3EF',
    fontSize: moderateScale(16),
    fontFamily: 'Pretendard-Regular',
  },
  customAddButton: {
    minWidth: moderateScale(66),
    minHeight: moderateScale(48),
    borderRadius: 14,
    backgroundColor: '#1A2025',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(14),
  },
  customAddButtonText: {
    color: '#7F878D',
    fontSize: moderateScale(16),
    fontFamily: 'Pretendard-Bold',
  },
  courseCard: {
    minHeight: moderateScale(72),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#252C31',
    backgroundColor: '#13191F',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(16),
    marginBottom: moderateScale(8),
  },
  courseCardSelected: {
    borderColor: '#4FB78A',
    backgroundColor: '#15201C',
  },
  courseNumberContainer: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(8),
    backgroundColor: '#252C31',
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseNumberContainerSelected: {
    backgroundColor: "#1E352B",
    justifyContent: 'center',
    alignItems: 'center',
    width: moderateScale(32),
    height: moderateScale(32),
  },
  courseNumber: {
    color: '#8C949A',
    fontSize: moderateScale(14),
    fontFamily: 'Pretendard-Medium',
  },
  courseInfo: {
    flex: 1,
    marginLeft: moderateScale(12),
  },
  courseName: {
    color: '#EAF3EF',
    fontSize: moderateScale(16),
    fontFamily: 'Pretendard-Medium',
  },
  courseDetails: {
    marginTop: moderateScale(2),
    color: '#8C949A',
    fontSize: moderateScale(13),
    fontFamily: 'Pretendard-Regular',
  },
  radioButton: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#252C31',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#4FB78A',
    backgroundColor: '#4FB78A',
  },
  radioButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(12),
    fontWeight: '700',
  },
  nextButton: {
    minHeight: moderateScale(52),
    borderRadius: 12,
    backgroundColor: '#4FB78A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#1B2126',
  },
  nextText: {
    color: '#FFFFFF',
    fontSize: moderateScale(16),
    fontFamily: 'Pretendard-Medium',
  },
  nextTextDisabled: {
    color: '#656D73',
  },
});
