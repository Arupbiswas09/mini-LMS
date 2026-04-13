import { useMemo, memo } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function hashCourseId(courseId: string): number {
  let h = 0;
  for (let i = 0; i < courseId.length; i += 1) {
    h = (Math.imul(31, h) + courseId.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export interface CurriculumListProps {
  courseId: string;
  lessonsCount: number;
  isEnrolled: boolean;
}

function CurriculumListComponent({ courseId, lessonsCount, isEnrolled }: CurriculumListProps) {
  const rows = useMemo(() => {
    const seed = hashCourseId(courseId);
    const base = ['Introduction', 'Core concepts', 'Applied practice', 'Assessment', 'Next steps'];
    const sectionCount = Math.min(4, Math.max(2, (seed % 3) + 2));
    const secs = base.slice(0, sectionCount);
    const per = Math.max(2, Math.floor(lessonsCount / secs.length) || (seed % 4) + 2);
    const durSeed = hashCourseId(`${courseId}-dur`);
    const flat: Array<{ section: string; part: number; lessonNum: number; duration: number }> = [];
    let lessonNum = 0;
    for (const section of secs) {
      for (let part = 0; part < per; part += 1) {
        lessonNum += 1;
        flat.push({
          section,
          part: part + 1,
          lessonNum,
          duration: 5 + ((durSeed + lessonNum * 7) % 18),
        });
      }
    }
    return flat;
  }, [courseId, lessonsCount]);

  let sectionHeader: string | null = null;

  return (
    <View className="mt-6">
      <Text className="text-base font-semibold text-neutral-900 dark:text-white mb-3">Curriculum</Text>
      {rows.map((row) => {
        const showHeader = row.section !== sectionHeader;
        sectionHeader = row.section;
        return (
          <View key={`${row.section}-${row.part}-${row.lessonNum}`}>
            {showHeader ? (
              <Text className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2 mt-2">
                {row.section}
              </Text>
            ) : null}
            <View className="flex-row items-center py-2.5 border-b border-neutral-100 dark:border-neutral-800">
              <Ionicons name="play-circle-outline" size={18} color="#2563eb" />
              <View className="flex-1 ml-2">
                <Text className="text-sm text-neutral-800 dark:text-neutral-200">
                  Lesson {row.lessonNum}: {row.section} — part {row.part}
                </Text>
                <Text className="text-xs text-neutral-500 dark:text-neutral-500 mt-0.5">
                  {row.duration} min
                </Text>
              </View>
              {!isEnrolled ? (
                <Ionicons name="lock-closed-outline" size={16} color="#9ca3af" accessibilityLabel="Locked" />
              ) : (
                <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

export const CurriculumList = memo(CurriculumListComponent);
