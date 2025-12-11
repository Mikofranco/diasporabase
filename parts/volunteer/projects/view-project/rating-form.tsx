// components/project/RatingForm.tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import * as z from "zod";
import { RatingStars } from "./ratings-stars";

const ratingSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().max(500).optional(),
});

type FormData = z.infer<typeof ratingSchema>;

interface RatingFormProps {
  form: UseFormReturn<FormData>;
  onSubmit: (data: FormData) => void;
  hoveredRating: number | null;
  setHoveredRating: (val: number | null) => void;
  hasRated: boolean;
}

export const RatingForm: React.FC<RatingFormProps> = ({
  form,
  onSubmit,
  hoveredRating,
  setHoveredRating,
  hasRated,
}) => {
  if (hasRated) {
    return <p className="text-gray-600">You have already rated this project.</p>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rating</FormLabel>
              <FormControl>
                <RatingStars
                  value={field.value || 0}
                  onChange={field.onChange}
                  hovered={hoveredRating}
                  onHover={setHoveredRating}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comment (Optional)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder="Share your feedback..."
                  className="h-12"
                />
              </FormControl>
              <p className="text-sm text-gray-500">Up to 500 characters.</p>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full text-lg py-6"
          disabled={form.watch("rating") === 0}
        >
          Submit Rating
        </Button>
      </form>
    </Form>
  );
};