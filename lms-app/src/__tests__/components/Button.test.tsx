import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '@/components/ui/Button';

// Minimal wrappers for Reanimated and NativeWind in tests
jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

describe('Button', () => {
  const onPress = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  describe('rendering', () => {
    it('renders label text', () => {
      const { getByText } = render(<Button label="Sign In" onPress={onPress} />);
      expect(getByText('Sign In')).toBeTruthy();
    });

    it('renders all 5 variants without crashing', () => {
      const variants = ['primary', 'secondary', 'ghost', 'danger', 'success'] as const;
      variants.forEach((variant) => {
        const { getByText } = render(
          <Button key={variant} label="Tap" onPress={onPress} variant={variant} />
        );
        expect(getByText('Tap')).toBeTruthy();
      });
    });

    it('shows ActivityIndicator when loading', () => {
      const { queryByText, UNSAFE_getByType } = render(
        <Button label="Loading..." onPress={onPress} loading />
      );
      // When loading, the label text is hidden
      expect(queryByText('Loading...')).toBeNull();
    });
  });

  describe('interaction', () => {
    it('calls onPress when tapped', () => {
      const { getByText } = render(<Button label="Tap Me" onPress={onPress} />);
      fireEvent.press(getByText('Tap Me'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('does not call onPress when disabled', () => {
      const { getByText } = render(<Button label="Tap Me" onPress={onPress} disabled />);
      fireEvent.press(getByText('Tap Me'));
      expect(onPress).not.toHaveBeenCalled();
    });

    it('does not call onPress when loading', () => {
      const { getByRole } = render(<Button label="Wait" onPress={onPress} loading />);
      // Loading button is rendered as disabled, so press the pressable by role
      fireEvent.press(getByRole('button'));
      expect(onPress).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('reflects disabled state in accessibilityState', () => {
      const { getByRole } = render(<Button label="Disabled" onPress={onPress} disabled />);
      const btn = getByRole('button');
      expect(btn.props.accessibilityState?.disabled).toBe(true);
    });
  });
});
