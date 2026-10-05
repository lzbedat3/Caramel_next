import type { Metadata } from "next";

import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page";
import { ReviewsManager } from "@/features/admin/reviews/reviews-manager";
import { getAdminReviews } from "@/services/admin-reviews";

export const metadata: Metadata = {
  title: "ביקורות",
};

export default async function AdminReviewsPage() {
  const reviews = await getAdminReviews();

  return (
    <AdminPage>
      <div className="max-w-3xl">
        <AdminPageHeader
          title="ביקורות"
          description="ביקורות שאורחים כתבו בתחתית התפריט. הן מתפרסמות מיד; כאן אפשר להסתיר או למחוק ביקורת שאינה במקום."
        />
        <ReviewsManager reviews={reviews} />
      </div>
    </AdminPage>
  );
}
