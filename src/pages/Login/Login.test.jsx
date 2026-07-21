import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from './index';
import { AuthProvider } from '../../context/AuthContext';

beforeAll(() => {
  global.BroadcastChannel = class {
    postMessage() {}
    close() {}
  };
});

beforeEach(() => {
  window.open = jest.fn();
});

function renderLogin() {
  render(
    <BrowserRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </BrowserRouter>
  );
}

test('renders the Google sign-in button', () => {
  renderLogin();
  expect(screen.getByText(/sign in with google/i)).toBeInTheDocument();
});

test('clicking sign-in opens the Google OAuth popup with the app redirect URI', () => {
  renderLogin();
  fireEvent.click(screen.getByText(/sign in with google/i));

  expect(window.open).toHaveBeenCalledWith(
    expect.stringContaining('accounts.google.com/o/oauth2/v2/auth'),
    'google-signin',
    expect.any(String)
  );
  const [openedUrl] = window.open.mock.calls[0];
  expect(openedUrl).toContain(encodeURIComponent(`${window.location.origin}/auth/callback`));
});
