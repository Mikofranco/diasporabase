// components/project/ReviewsList.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { RatingStars } from "./ratings-stars";

interface Review {
  user_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

interface ReviewsListProps {
  reviews: Review[];
}

export const ReviewsList: React.FC<ReviewsListProps> = ({ reviews }) => {
  if (reviews.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Reviews</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {reviews.map((review, i) => (
          <div key={i} className="border-b pb-4 last:border-none">
            <div className="flex justify-between items-start">
              <p className="font-medium">{review.user_name}</p>
              <span className="text-sm text-gray-500">
                {new Date(review.created_at).toLocaleDateString()}
              </span>
            </div>
            <RatingStars value={review.rating} readonly size="sm"  onChange={()=>""}/>
            {review.comment && <p className="mt-2 text-gray-600">{review.comment}</p>}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};