import '@testing-library/jest-dom';

// Mock scrollIntoView for JSDOM
window.HTMLElement.prototype.scrollIntoView = () => {};

// Mock MediaRecorder
class MockMediaRecorder {
  state = 'inactive';
  ondataavailable: any = null;
  onstop: any = null;
  start() {
    this.state = 'recording';
  }
  stop() {
    this.state = 'inactive';
    if (this.onstop) this.onstop();
  }
  static isTypeSupported() {
    return true;
  }
}

(window as any).MediaRecorder = MockMediaRecorder;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
