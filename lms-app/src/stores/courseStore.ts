import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { enableMapSet } from 'immer';
import { appStorage } from '@/lib/storage/appStorage';
import { notificationService } from '@/services/notificationService';

enableMapSet();

export type CourseFilter =
  | 'All'
  | 'Development'
  | 'Design'
  | 'Business'
  | 'Technology'
  | 'Arts'
  | 'Health & Fitness';

interface CourseState {
  bookmarks: Set<string>;
  enrolledCourses: Set<string>;
  searchQuery: string;
  activeFilter: CourseFilter;
}

interface CourseActions {
  toggleBookmark: (courseId: string) => void;
  enrollCourse: (courseId: string) => void;
  setSearchQuery: (query: string) => void;
  setFilter: (filter: CourseFilter) => void;
  hydrate: () => void;
  isBookmarked: (id: string) => boolean;
  isEnrolled: (id: string) => boolean;
}

type CourseStore = CourseState & CourseActions;

export const useCourseStore = create<CourseStore>()(
  devtools(
    immer((set, get) => ({
      bookmarks: new Set<string>(),
      enrolledCourses: new Set<string>(),
      searchQuery: '',
      activeFilter: 'All',

      toggleBookmark: (courseId) => {
        set((state) => {
          if (state.bookmarks.has(courseId)) {
            state.bookmarks.delete(courseId);
          } else {
            state.bookmarks.add(courseId);
          }
        });

        const { bookmarks } = get();
        appStorage.setBookmarks(bookmarks);

        const count = bookmarks.size;
        if (count > 0 && count % 5 === 0) {
          void notificationService.scheduleBookmarkMilestone(count);
        }
      },

      enrollCourse: (courseId) => {
        set((state) => {
          state.enrolledCourses.add(courseId);
        });
        appStorage.setEnrolledCourses(get().enrolledCourses);
      },

      setSearchQuery: (query) => {
        set((state) => {
          state.searchQuery = query;
        });
      },

      setFilter: (filter) => {
        set((state) => {
          state.activeFilter = filter;
        });
      },

      hydrate: () => {
        const bookmarks = appStorage.getBookmarks();
        const enrolledCourses = appStorage.getEnrolledCourses();
        set((state) => {
          state.bookmarks = bookmarks;
          state.enrolledCourses = enrolledCourses;
        });
      },

      isBookmarked: (id) => get().bookmarks.has(id),

      isEnrolled: (id) => get().enrolledCourses.has(id),
    })),
    { name: 'course-store', enabled: __DEV__ }
  )
);
