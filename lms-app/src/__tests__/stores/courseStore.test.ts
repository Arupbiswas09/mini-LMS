import { act, renderHook } from '@testing-library/react-hooks';
import { useCourseStore } from '@/stores/courseStore';
import { notificationService } from '@/services/notificationService';

jest.mock('@/services/notificationService', () => ({
  notificationService: {
    scheduleBookmarkMilestone: jest.fn(() => Promise.resolve()),
  },
}));
jest.mock('@/lib/storage/appStorage', () => ({
  appStorage: {
    getBookmarks: jest.fn(() => new Set()),
    getEnrolledCourses: jest.fn(() => new Set()),
    setBookmarks: jest.fn(),
    setEnrolledCourses: jest.fn(),
  },
}));

const mockNotification = notificationService as jest.Mocked<typeof notificationService>;

describe('useCourseStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store between tests
    act(() => {
      useCourseStore.setState({
        bookmarks: new Set(),
        enrolledCourses: new Set(),
        searchQuery: '',
        activeFilter: 'All',
      });
    });
  });

  describe('toggleBookmark', () => {
    it('adds a course to bookmarks', () => {
      const { result } = renderHook(() => useCourseStore());

      act(() => { result.current.toggleBookmark('course-1'); });
      expect(result.current.isBookmarked('course-1')).toBe(true);
    });

    it('removes a bookmarked course when toggled again', () => {
      const { result } = renderHook(() => useCourseStore());

      act(() => { result.current.toggleBookmark('course-1'); });
      act(() => { result.current.toggleBookmark('course-1'); });

      expect(result.current.isBookmarked('course-1')).toBe(false);
    });

    it('schedules notification when milestone reached (5 bookmarks)', () => {
      const { result } = renderHook(() => useCourseStore());

      act(() => {
        ['c1', 'c2', 'c3', 'c4', 'c5'].forEach((id) =>
          result.current.toggleBookmark(id)
        );
      });

      expect(mockNotification.scheduleBookmarkMilestone).toHaveBeenCalledWith(5);
    });

    it('does NOT schedule notification for non-milestone counts (3 bookmarks)', () => {
      const { result } = renderHook(() => useCourseStore());

      act(() => {
        ['c1', 'c2', 'c3'].forEach((id) => result.current.toggleBookmark(id));
      });

      expect(mockNotification.scheduleBookmarkMilestone).not.toHaveBeenCalled();
    });

    it('schedules notification again at 10 bookmarks', () => {
      const { result } = renderHook(() => useCourseStore());

      act(() => {
        Array.from({ length: 10 }, (_, i) => `c${i}`).forEach((id) =>
          result.current.toggleBookmark(id)
        );
      });

      expect(mockNotification.scheduleBookmarkMilestone).toHaveBeenCalledWith(10);
    });
  });

  describe('enrollCourse', () => {
    it('marks a course as enrolled', () => {
      const { result } = renderHook(() => useCourseStore());

      act(() => { result.current.enrollCourse('course-42'); });
      expect(result.current.isEnrolled('course-42')).toBe(true);
    });
  });

  describe('setSearchQuery', () => {
    it('updates the search query', () => {
      const { result } = renderHook(() => useCourseStore());

      act(() => { result.current.setSearchQuery('react'); });
      expect(result.current.searchQuery).toBe('react');
    });
  });

  describe('setFilter', () => {
    it('updates the active filter', () => {
      const { result } = renderHook(() => useCourseStore());

      act(() => { result.current.setFilter('Technology'); });
      expect(result.current.activeFilter).toBe('Technology');
    });
  });
});
