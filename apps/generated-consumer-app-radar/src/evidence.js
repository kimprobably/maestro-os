const REQUEST_WORDS = ['wish', 'please add', 'need', 'missing', 'would love', 'feature'];

export function extractReviewThemes(reviews) {
  const text = (Array.isArray(reviews) ? reviews : []).map((review) => [review.title, review.body].filter(Boolean).join(' ')).join(' ').toLowerCase();
  const themes = [];
  if (/price|subscription|paywall|expensive/.test(text)) themes.push('Pricing and subscription sensitivity');
  if (/sync|calendar|apple health|widget/.test(text)) themes.push('Ecosystem integration requests');
  if (/confusing|setup|onboarding|hard/.test(text)) themes.push('Onboarding and setup friction');
  if (/bug|crash|slow|reliable/.test(text)) themes.push('Reliability concerns');
  return themes;
}

export function featureRequestsFromReviews(reviews) {
  return (Array.isArray(reviews) ? reviews : [])
    .filter((review) => REQUEST_WORDS.some((word) => String(review.body || '').toLowerCase().includes(word)))
    .slice(0, 8)
    .map((review) => ({ title: review.title || 'Review request', excerpt: String(review.body || '').slice(0, 220) }));
}
