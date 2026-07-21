import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// jsdom's test environment (bundled with react-scripts' Jest version) doesn't
// expose these globals, but react-router-dom v7 references them at import time.
global.TextEncoder = global.TextEncoder || TextEncoder;
global.TextDecoder = global.TextDecoder || TextDecoder;
