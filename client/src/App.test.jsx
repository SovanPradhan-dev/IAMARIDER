import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App.jsx';
import Layout from './components/layout/Layout.jsx';
import { api } from './lib/api';
import { authStore } from './store/authStore';

vi.mock('./components/layout/NotificationBell.jsx', () => ({
  default: () => null,
}));

describe('application navigation', () => {
  let rejectSession;

  beforeEach(() => {
    authStore.clear();
    vi.spyOn(api, 'post').mockImplementation(() => new Promise((_, reject) => {
      rejectSession = reject;
    }));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    authStore.clear();
  });

  it('renders the public landing page after session restoration fails', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    await waitFor(() => expect(rejectSession).toBeTypeOf('function'));
    await act(async () => {
      rejectSession(new Error('No existing session'));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    await act(async () => {
      await vi.dynamicImportSettled();
    });

    expect(await screen.findByRole('heading', {
      name: /coordinate your group ride in real time/i,
    })).toBeInTheDocument();
  });

  it('redirects unauthenticated visitors from private routes to login', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>
    );
    await waitFor(() => expect(rejectSession).toBeTypeOf('function'));
    await act(async () => {
      rejectSession(new Error('No existing session'));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    await act(async () => {
      await vi.dynamicImportSettled();
    });

    expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
  });

  it('surfaces every trip workspace route in the current-trip navigation', () => {
    authStore.setTokenAndUser('test-token', {
      _id: 'rider-1',
      name: 'Alex Rider',
      email: 'alex@example.com',
    });

    render(
      <MemoryRouter initialEntries={['/trips/trip-1/live']}>
        <Layout><div>Live map content</div></Layout>
      </MemoryRouter>
    );

    const tripNavigation = within(screen.getByRole('navigation', { name: 'Trip navigation' }));
    for (const label of ['Trip overview', 'Live map', 'Riders', 'Trip chat', 'Checkpoints', 'Safety alerts', 'Trip history']) {
      expect(tripNavigation.getByRole('link', { name: new RegExp(label, 'i') })).toBeInTheDocument();
    }
  });
});
