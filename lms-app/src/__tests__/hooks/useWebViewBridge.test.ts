import { parseWebViewBridgeMessage } from '@/hooks/useWebViewBridge';

describe('parseWebViewBridgeMessage', () => {
  it('parses valid LESSON_COMPLETE payload', () => {
    const result = parseWebViewBridgeMessage(
      JSON.stringify({
        type: 'LESSON_COMPLETE',
        payload: { lessonId: 'lesson_1' },
      })
    );

    expect(result).not.toBeNull();
    expect(result?.type).toBe('LESSON_COMPLETE');
  });

  it('rejects malformed JSON', () => {
    const result = parseWebViewBridgeMessage('{invalid json');
    expect(result).toBeNull();
  });

  it('rejects unknown message type', () => {
    const result = parseWebViewBridgeMessage(
      JSON.stringify({
        type: 'DELETE_ALL_DATA',
        payload: {},
      })
    );

    expect(result).toBeNull();
  });

  it('rejects OPEN_LINK with invalid URL payload', () => {
    const result = parseWebViewBridgeMessage(
      JSON.stringify({
        type: 'OPEN_LINK',
        payload: { url: 'not-a-url' },
      })
    );

    expect(result).toBeNull();
  });

  it('accepts ENROLL_COURSE with optional payload', () => {
    const result = parseWebViewBridgeMessage(
      JSON.stringify({
        type: 'ENROLL_COURSE',
      })
    );

    expect(result).not.toBeNull();
    expect(result?.type).toBe('ENROLL_COURSE');
  });
});
