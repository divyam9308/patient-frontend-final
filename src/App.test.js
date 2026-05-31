import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Smart Healthcare heading', () => {
  render(<App />);
  const headingElement = screen.getByText(/Smart Healthcare/i);
  expect(headingElement).toBeInTheDocument();
});
