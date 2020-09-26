import React from 'react';
import { getAllByText, render } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  const { getByText } = render(<App />);
  const linkElement = getByText(/Start/i);
  expect(linkElement).toBeInTheDocument();
});
