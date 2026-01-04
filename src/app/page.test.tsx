import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import Page from "./page";
import { vi } from "vitest";

vi.mock("./_components/HomePage/HomePagePlayMode", () => ({
  __esModule: true,
  default: () => <div data-testid="home-play-mode" />,
}));

vi.mock("./_components/HomePage/PublicGames/PublicGames", () => ({
  __esModule: true,
  default: () => <div data-testid="public-games" />,
}));

vi.mock("./_components/HomePage/News/News", () => ({
  __esModule: true,
  default: () => <div data-testid="news-column" />,
}));

test("Page", () => {
  render(<Page />);
  expect(
    screen.getByRole("heading", { level: 1, name: "KARABAST" })
  ).toBeVisible();
});
