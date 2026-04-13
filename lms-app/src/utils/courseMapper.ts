import type { Course, Instructor, RandomProduct, RandomUser, CourseDifficulty } from '@/types';

const CATEGORY_DIFFICULTY_MAP: Record<string, CourseDifficulty> = {
  electronics: 'Advanced',
  jewelery: 'Beginner',
  "men's clothing": 'Intermediate',
  "women's clothing": 'Beginner',
  computers: 'Advanced',
  software: 'Intermediate',
  music: 'Beginner',
  sports: 'Intermediate',
};

const CATEGORY_DISPLAY_MAP: Record<string, string> = {
  electronics: 'Technology',
  jewelery: 'Design',
  "men's clothing": 'Business',
  "women's clothing": 'Design',
  computers: 'Development',
  software: 'Development',
  music: 'Arts',
  sports: 'Health & Fitness',
};

function stablePositiveInt(seed: number, modulo: number): number {
  const x = Math.imul(seed, 2654435761) >>> 0;
  return modulo > 0 ? x % modulo : 0;
}

function deriveDuration(price: number): number {
  if (price < 20) return 2;
  if (price < 50) return 4;
  if (price < 100) return 8;
  if (price < 200) return 16;
  return 24;
}

function deriveLessonsCount(price: number): number {
  return Math.max(5, Math.floor(price / 5));
}

export function deriveEnrollmentCount(ratingCount: number, productId: number): number {
  return ratingCount * 12 + stablePositiveInt(productId, 200);
}

export function mapProductToCourse(product: RandomProduct): Course {
  const rawCategory = typeof product.category === 'string' ? product.category : 'general';
  const category = rawCategory.toLowerCase();
  const displayCategory = CATEGORY_DISPLAY_MAP[category] ?? category;
  const difficulty = CATEGORY_DIFFICULTY_MAP[category] ?? 'Intermediate';
  const title = (product.name ?? product.title ?? 'Untitled Course').trim() || 'Untitled Course';
  const price = Number.isFinite(Number(product.price)) ? Number(product.price) : 0;
  const ratingRate = Number.isFinite(Number(product.rating?.rate)) ? Number(product.rating.rate) : 0;
  const ratingCount = Number.isFinite(Number(product.rating?.count)) ? Number(product.rating.count) : 0;
  const productId = Number.isFinite(Number(product.id)) ? Number(product.id) : 0;
  const description = typeof product.description === 'string' ? product.description : 'No description available.';
  const thumbnail = typeof product.image === 'string' ? product.image : '';

  return {
    id: String(productId),
    title,
    description,
    price,
    thumbnail,
    category: displayCategory,
    rating: ratingRate,
    ratingCount,
    duration: deriveDuration(price),
    difficulty,
    instructorId: String(productId % 10),
    lessonsCount: deriveLessonsCount(price),
    language: 'English',
    enrollmentCount: deriveEnrollmentCount(ratingCount, productId),
    tags: [displayCategory, difficulty, 'Online'],
  };
}

function hashUuid(uuid: string): number {
  let h = 0;
  for (let i = 0; i < uuid.length; i += 1) {
    h = (Math.imul(31, h) + uuid.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function deriveSpecialty(email: string): string {
  const domain = email.split('@')[1]?.split('.')[0] ?? 'tech';
  const specialtyMap: Record<string, string> = {
    gmail: 'Full-Stack Development',
    yahoo: 'Data Science',
    hotmail: 'UX Design',
    outlook: 'Cloud Architecture',
    icloud: 'Mobile Development',
  };
  return specialtyMap[domain] ?? 'Software Engineering';
}

export function mapUserToInstructor(user: RandomUser): Instructor {
  const name = `${user.name.first} ${user.name.last}`;
  const location = `${user.location.city}, ${user.location.country}`;
  const specialty = deriveSpecialty(user.email);
  const courseCount = 1 + (hashUuid(user.login.uuid) % 10);

  return {
    id: user.login.uuid,
    name,
    avatar: user.picture.large,
    bio: `${name} is an expert instructor based in ${location}, specializing in ${specialty}. With years of hands-on experience, they bring real-world insights to every course.`,
    specialty,
    email: user.email,
    location,
    courseCount,
  };
}

export function searchCourses(query: string, courses: Course[]): Course[] {
  if (!query.trim()) return courses;
  const normalizedQuery = query.toLowerCase().trim();

  return courses.filter(
    (course) =>
      course.title.toLowerCase().includes(normalizedQuery) ||
      course.description.toLowerCase().includes(normalizedQuery) ||
      course.category.toLowerCase().includes(normalizedQuery) ||
      course.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))
  );
}
