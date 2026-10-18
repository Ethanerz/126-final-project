import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import ErrorPage from "./error";

it("requests fresh page data rather than resetting the failed render", async () => {
  const reset = vi.fn();
  const retry = vi.fn();
  render(<ErrorPage {...{ reset, retry }} />);

  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Try again" }));

  expect(retry).toHaveBeenCalledOnce();
  expect(reset).not.toHaveBeenCalled();
});
