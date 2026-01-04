import { beforeAll, expect, test } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HomePagePlayMode from './HomePagePlayMode';
import { vi } from 'vitest';

beforeAll(() => {
    vi.mock('next/navigation', () => {
        return {
            useRouter() {
                return {};
            },
        };
    });

    vi.mock('next-auth/react', () => {
        return {
            useSession() {
                return {};
            },
        };
    });
});

test('HomePagePlayMode', async () => {
    const result = render(<HomePagePlayMode />);

    expect(await screen.findByText('Join Matchmaking Queue')).toBeVisible();
    expect(await screen.findByText('Create New Lobby')).not.toBeVisible();

    const tabButton = await screen.findByText('Create Lobby');
    fireEvent.click(tabButton);

    expect(await screen.findByText('Join Matchmaking Queue')).not.toBeVisible();
    expect(await screen.findByText('Create New Lobby')).toBeVisible();
});
