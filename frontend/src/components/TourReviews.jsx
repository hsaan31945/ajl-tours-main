import React, { useContext, useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import { AppContext } from "../context/AppContext";
import { apiUrl } from "../utils/api";
import { getTourId } from "../utils/tourId";
import { useI18n } from "../i18n";

const getUserId = (user) => user?.id || user?._id || null;
const getUserName = (user) => user?.name || user?.fullName || user?.email || "";

export const getTourReviewSummary = (tour) => {
  const reviews = Array.isArray(tour?.reviews) ? tour.reviews : [];
  const reviewCount = Number(tour?.reviewCount ?? reviews.length ?? 0);
  const reviewAverage = Number(tour?.reviewAverage ?? tour?.avgRating ?? tour?.rating ?? 0);

  return {
    reviews,
    reviewCount: Number.isFinite(reviewCount) ? reviewCount : 0,
    reviewAverage: Number.isFinite(reviewAverage) ? reviewAverage : 0,
  };
};

function TourReviews({ tour, onTourUpdated }) {
  const { user } = useContext(AppContext);
  const { t } = useI18n();
  const userId = getUserId(user);
  const { reviews, reviewCount, reviewAverage } = getTourReviewSummary(tour);
  const [reviewerName, setReviewerName] = useState(() => getUserName(user));
  const [rating, setRating] = useState(0);
  const [description, setDescription] = useState("");
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const currentUserReview = useMemo(() => (
    userId ? reviews.find((review) => review.userId === userId) : null
  ), [reviews, userId]);

  useEffect(() => {
    if (currentUserReview) {
      setReviewerName(currentUserReview.userName || getUserName(user));
      setRating(Number(currentUserReview.rating) || 0);
      setDescription(currentUserReview.description || "");
    } else if (user) {
      setReviewerName(getUserName(user));
    }
  }, [currentUserReview, user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!reviewerName.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!rating) {
      setError(t("booking.selectStarRating"));
      return;
    }

    const tourId = getTourId(tour);
    if (!tourId) {
      setError("Could not find this tour. Please refresh and try again.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(apiUrl(`/api/tours/${tourId}/reviews`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        cache: "no-store",
        body: JSON.stringify({
          userId,
          userName: reviewerName.trim(),
          rating,
          description,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || data.message || t("booking.reviewSaveFailed"));
      }

      if (data.tour && onTourUpdated) {
        onTourUpdated(data.tour);
      }
      setMessage(currentUserReview ? t("booking.reviewUpdated") : t("booking.reviewSaved"));
    } catch (submitError) {
      setError(submitError.message || t("booking.reviewSaveFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="w-full max-w-6xl px-4 mb-16">
      <div className="border-t border-gray-200 pt-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-3xl font-bold">{t("common.reviews")}</h2>
            <div className="flex items-center gap-2 mt-2 text-gray-700">
              <Star className="w-5 h-5 text-yellow-400 fill-current" aria-hidden="true" />
              <span className="font-semibold">
                {reviewCount ? `${reviewAverage.toFixed(1)} / 5` : t("common.noRatingsYet")}
              </span>
              <span className="text-sm text-gray-500">
                {reviewCount} {t(reviewCount === 1 ? "common.review" : "common.reviews")}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mb-8 bg-gray-50 border border-gray-200 rounded-lg p-5">
          <div className="mb-4">
            <label htmlFor="reviewer-name" className="block text-sm font-semibold mb-2">
              {t("auth.fullName")}*
            </label>
            <input
              id="reviewer-name"
              type="text"
              value={reviewerName}
              onChange={(event) => setReviewerName(event.target.value)}
              maxLength={100}
              required
              placeholder={t("auth.enterName")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">{t("booking.starRating")}</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((starValue) => {
                const active = starValue <= (hoverRating || rating);
                return (
                  <button
                    key={starValue}
                    type="button"
                    onClick={() => setRating(starValue)}
                    onMouseEnter={() => setHoverRating(starValue)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 rounded hover:bg-white transition"
                    aria-label={`${starValue} star rating`}
                  >
                    <Star
                      className={`w-7 h-7 ${active ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                      aria-hidden="true"
                    />
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">{t("booking.description")}</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              maxLength={1000}
              placeholder={t("booking.reviewPlaceholder")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          {error && <p className="text-sm text-red-600 font-semibold mb-3">{error}</p>}
          {message && <p className="text-sm text-green-700 font-semibold mb-3">{message}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 disabled:text-gray-500 text-white font-bold px-6 py-3 rounded-lg transition"
          >
            {isSubmitting ? t("booking.savingReview") : currentUserReview ? t("booking.updateReview") : t("booking.submitReview")}
          </button>
        </form>

        <div className="space-y-4">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <article key={review.id || `${review.userId}-${review.createdAt}`} className="border border-gray-200 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <div className="font-semibold">{review.userName || "AJL Tour guest"}</div>
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((starValue) => (
                        <Star
                          key={starValue}
                          className={`w-4 h-4 ${starValue <= Number(review.rating) ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                  </div>
                  {review.createdAt && (
                    <div className="text-xs text-gray-500">
                      {new Date(review.updatedAt || review.createdAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
                {review.description && (
                  <p className="text-gray-700 mt-3 leading-relaxed">{review.description}</p>
                )}
              </article>
            ))
          ) : (
            <p className="text-gray-500">{t("booking.noReviewsYet")}</p>
          )}
        </div>
      </div>
    </section>
  );
}

export default TourReviews;
