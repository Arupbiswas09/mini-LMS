import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CourseCard } from '@/components/course/CourseCard';
import type { CourseWithInstructor } from '@/types';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('expo-image', () => ({ Image: () => null }));
jest.mock('@/components/ui/RatingStars', () => ({ RatingStars: () => null }));
jest.mock('@/components/ui/SkeletonLoader', () => ({ SkeletonLoader: () => null }));

const mockCourse: CourseWithInstructor = {
  id: 'course-1',
  title: 'React Native Masterclass',
  description: 'Build mobile apps with React Native.',
  price: 49.99,
  thumbnail: 'https://example.com/thumb.jpg',
  rating: 4.5,
  ratingCount: 100,
  duration: 8,
  lessonsCount: 20,
  enrollmentCount: 500,
  category: 'Technology',
  difficulty: 'Advanced',
  instructorId: 'user-1',
  language: 'English',
  tags: ['react', 'mobile'],
  instructor: {
    id: 'user-1',
    name: 'Jane Smith',
    avatar: 'https://example.com/avatar.jpg',
    bio: 'Senior Engineer based in NYC',
    specialty: 'Mobile Development',
    email: 'jane@example.com',
    location: 'NYC',
    courseCount: 5,
  },
};

describe('CourseCard', () => {
  const onPress = jest.fn();
  const onBookmark = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  describe('rendering', () => {
    it('renders the course title', () => {
      const { getByText } = render(
        <CourseCard
          course={mockCourse}
          onPress={onPress}
          onBookmark={onBookmark}
          isBookmarked={false}
        />
      );
      expect(getByText('React Native Masterclass')).toBeTruthy();
    });

    it('renders the instructor name', () => {
      const { getByText } = render(
        <CourseCard
          course={mockCourse}
          onPress={onPress}
          onBookmark={onBookmark}
          isBookmarked={false}
        />
      );
      expect(getByText('Jane Smith')).toBeTruthy();
    });
  });

  describe('interaction', () => {
    it('calls onPress with course when tapped', () => {
      const { getByText } = render(
        <CourseCard
          course={mockCourse}
          onPress={onPress}
          onBookmark={onBookmark}
          isBookmarked={false}
        />
      );
      fireEvent.press(getByText('React Native Masterclass'));
      expect(onPress).toHaveBeenCalledWith(mockCourse);
    });

    it('calls onBookmark with courseId when bookmark pressed', () => {
      const { getByLabelText } = render(
        <CourseCard
          course={mockCourse}
          onPress={onPress}
          onBookmark={onBookmark}
          isBookmarked={false}
        />
      );
      const bookmarkBtn = getByLabelText('Add to bookmarks');
      fireEvent.press(bookmarkBtn);
      expect(onBookmark).toHaveBeenCalledWith('course-1');
    });
  });

  describe('skeleton state', () => {
    it('renders without crashing when isLoading is true', () => {
      const { toJSON } = render(
        <CourseCard
          course={mockCourse}
          onPress={onPress}
          onBookmark={onBookmark}
          isBookmarked={false}
          isLoading
        />
      );
      expect(toJSON()).not.toBeNull();
    });
  });
});
