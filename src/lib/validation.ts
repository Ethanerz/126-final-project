export function validateReview(
  value: {
    rating: number;
    title: string;
    review_text: string;
    display_name: string;
    visited_on: string;
  },
  now = new Date(),
) {
  if (!Number.isInteger(value.rating) || value.rating < 1 || value.rating > 5)
    return "Choose a rating from 1 to 5.";
  if (
    value.display_name.trim().length < 2 ||
    value.display_name.trim().length > 40
  )
    return "Use a public display name of 2–40 characters.";
  if (!value.title.trim() || value.title.trim().length > 120)
    return "Add a title of up to 120 characters.";
  if (
    value.review_text.trim().length < 20 ||
    value.review_text.trim().length > 2000
  )
    return "Share 20–2,000 characters about your experience.";
  if (!/^\d{4}-\d{2}$/.test(value.visited_on))
    return "Choose the month of your visit.";
  const [year, month] = value.visited_on.split("-").map(Number);
  if (
    year < 2000 ||
    month < 1 ||
    month > 12 ||
    value.visited_on > now.toISOString().slice(0, 7)
  )
    return "The visit month must be between January 2000 and this month.";
  return null;
}
export function isUpEmail(value: string) {
  return /^[^\s@]+@up\.edu\.ph$/i.test(value.trim());
}
