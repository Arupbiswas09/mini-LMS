// ─── Auth Types ───────────────────────────────────────────────────────────────

export interface User {
  _id: string;
  username: string;
  email: string;
  avatar?: {
    url: string;
    localPath?: string;
  };
  role: 'ADMIN' | 'USER';
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// ─── Course Types ─────────────────────────────────────────────────────────────

export type CourseDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  thumbnail: string;
  category: string;
  rating: number;
  ratingCount: number;
  duration: number;
  difficulty: CourseDifficulty;
  instructorId: string;
  lessonsCount: number;
  language: string;
  enrollmentCount: number;
  tags: string[];
}

export interface Instructor {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  specialty: string;
  email: string;
  location: string;
  courseCount: number;
}

export interface CourseWithInstructor extends Course {
  instructor: Instructor;
}

// ─── API Types ────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedData<T> {
  data: T[];
  page: number;
  limit: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export type PaginatedResponse<T> = ApiResponse<PaginatedData<T>>;

export interface ApiError {
  type: 'network' | 'auth' | 'permission' | 'not_found' | 'validation' | 'rate_limit' | 'server' | 'unknown';
  statusCode?: number;
  message: string;
  userFriendlyMessage: string;
  fieldErrors?: Record<string, string>;
  retryAfter?: number;
}

// ─── Random Product (Raw API) ─────────────────────────────────────────────────

export interface RandomProductRating {
  rate: number;
  count: number;
}

export interface RandomProduct {
  id: number;
  /** API may expose product name as `title` (e.g. fakestore) or `name`. */
  title: string;
  name?: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating: RandomProductRating;
}

export interface RandomUserName {
  title: string;
  first: string;
  last: string;
}

export interface RandomUserPicture {
  large: string;
  medium: string;
  thumbnail: string;
}

export interface RandomUserLocation {
  city: string;
  state: string;
  country: string;
}

export interface RandomUser {
  gender: string;
  name: RandomUserName;
  email: string;
  picture: RandomUserPicture;
  location: RandomUserLocation;
  login: {
    uuid: string;
    username: string;
  };
}

// ─── App State Types ──────────────────────────────────────────────────────────

export interface Bookmark {
  courseId: string;
  addedAt: string;
}

export interface UserPreferences {
  isDarkMode: boolean;
  notificationsEnabled: boolean;
  biometricEnabled: boolean;
  language: string;
  fontSize: 'small' | 'medium' | 'large';
}

export interface AppState {
  isReady: boolean;
  isOnline: boolean;
  lastOpenedAt: string;
}

export interface DownloadState {
  status: 'idle' | 'downloading' | 'completed' | 'error';
  progress: number;
  path?: string;
  size?: number;
  error?: string;
}

export interface LessonProgress {
  lessonId: string;
  courseId: string;
  completedAt: string;
}
