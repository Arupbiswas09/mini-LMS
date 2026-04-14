import { mapProductToCourse, mapUserToInstructor } from '@/utils/courseMapper';
import type { RandomProduct, RandomUser } from '@/types';

const mockProduct: RandomProduct = {
  id: 1,
  title: 'React Native Mastery',
  price: 49.99,
  description: 'Learn React Native from scratch to advanced.',
  category: 'electronics',
  image: 'https://example.com/thumb.jpg',
  rating: { rate: 4.5, count: 120 },
};

const mockUser: RandomUser = {
  gender: 'male',
  name: { title: 'Mr', first: 'John', last: 'Doe' },
  email: 'john@example.com',
  picture: { large: 'https://example.com/avatar.jpg', medium: '', thumbnail: '' },
  location: { city: 'San Francisco', state: 'CA', country: 'USA' },
  login: { uuid: 'abc-123', username: 'johndoe' },
};

describe('mapProductToCourse', () => {
  it('maps all fields from a valid product', () => {
    const course = mapProductToCourse(mockProduct);

    expect(course.id).toBe('1');
    expect(course.title).toBe('React Native Mastery');
    expect(course.description).toBe('Learn React Native from scratch to advanced.');
    expect(course.price).toBe(49.99);
    expect(course.thumbnail).toBe('https://example.com/thumb.jpg');
    expect(course.rating).toBe(4.5);
    expect(course.ratingCount).toBe(120);
  });

  it('maps electronics category to Technology', () => {
    const course = mapProductToCourse(mockProduct);
    expect(course.category).toBe('Technology');
  });

  it('maps electronics category to Advanced difficulty', () => {
    const course = mapProductToCourse(mockProduct);
    expect(course.difficulty).toBe('Advanced');
  });

  it("maps men's clothing to Intermediate difficulty", () => {
    const course = mapProductToCourse({ ...mockProduct, category: "men's clothing" });
    expect(course.difficulty).toBe('Intermediate');
    expect(course.category).toBe('Business');
  });

  it('falls back to product.title when name is undefined', () => {
    const product = { ...mockProduct };
    const course = mapProductToCourse(product);
    expect(course.title).toBe('React Native Mastery');
  });

  it('derives duration from price < 50 as 4 hours', () => {
    const course = mapProductToCourse(mockProduct); // price 49.99
    expect(course.duration).toBe(4);
  });

  it('derives duration from price >= 100 as 8+ hours', () => {
    const course = mapProductToCourse({ ...mockProduct, price: 150 });
    expect(course.duration).toBe(16);
  });

  it('handles unknown category gracefully', () => {
    const course = mapProductToCourse({ ...mockProduct, category: 'unknown-category' });
    expect(course.difficulty).toBe('Intermediate');
    expect(course.category).toBe('unknown-category');
  });
});

describe('mapUserToInstructor', () => {
  it('maps name correctly', () => {
    const instructor = mapUserToInstructor(mockUser);
    expect(instructor.name).toBe('John Doe');
  });

  it('maps avatar from picture.large', () => {
    const instructor = mapUserToInstructor(mockUser);
    expect(instructor.avatar).toBe('https://example.com/avatar.jpg');
  });

  it('maps location to bio', () => {
    const instructor = mapUserToInstructor(mockUser);
    expect(instructor.bio).toContain('San Francisco');
  });

  it('generates a stable id from uuid', () => {
    const instructor = mapUserToInstructor(mockUser);
    expect(instructor.id).toBe('abc-123');
  });
});
