import { render, screen } from '@testing-library/react';
import App from './App';

test('renders HealthCare logo', () => {
  render(<App />);
  const logoElements = screen.getAllByText(/HealthCare/i);
  expect(logoElements.length).toBeGreaterThan(0);
});
