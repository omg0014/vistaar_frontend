import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Search from './index';
import { AuthProvider } from '../../context/AuthContext';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

function fakeToken() {
  const payload = btoa(JSON.stringify({ exp: 9999999999 }));
  return `header.${payload}.signature`;
}

beforeEach(() => {
  localStorage.setItem('vistaar_token', fakeToken());
  localStorage.setItem('vistaar_user', JSON.stringify({ email: 'admin@test.com', name: 'Admin', role: 'admin' }));

  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      leads: [{ _id: 'abc123', schoolName: 'Test High School', district: 'Pune', state: 'MH', totalStudents: 100 }],
    }),
  });
});

afterEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

test('renders a recent lead from the API and navigates to its report card on click', async () => {
  render(
    <MemoryRouter>
      <AuthProvider>
        <Search />
      </AuthProvider>
    </MemoryRouter>
  );

  await waitFor(() => expect(screen.getByText('Test High School')).toBeInTheDocument());

  fireEvent.click(screen.getByText('Test High School'));

  expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('/school/abc123'));
});
