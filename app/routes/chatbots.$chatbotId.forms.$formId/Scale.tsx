// import { useState } from "react";
// import { AutoFormInputComponentProps } from "~/components/ui/auto-form/types";
// import { Button } from "~/components/ui/button";
// import {
//   FormControl,
//   FormDescription,
//   FormItem,
//   FormLabel,
// } from "~/components/ui/form";

// export default function Scale({
//   label,
//   isRequired,
//   field,
//   fieldConfigItem,
//   fieldProps,
// }: AutoFormInputComponentProps) {
//   const [hoveredRating, setHoveredRating] = useState(0);
//   const maxRating = fieldProps.max || 5;
//   const step = fieldProps.step || 1;

//   const handleRatingChange = (rating: number) => {
//     field.onChange(rating);
//   };

//   return (
//     <FormItem className="space-y-2">
//       <FormLabel>
//         {label}
//         {isRequired && <span className="text-destructive"> *</span>}
//       </FormLabel>
//       <FormControl>
//         <div className="flex flex-wrap gap-2">
//           {Array.from(
//             { length: maxRating / step },
//             (_, i) => (i + 1) * step,
//           ).map((rating) => (
//             <Button
//               key={rating}
//               variant="outline"
//               size="sm"
//               className={`w-12 h-12 ${
//                 (hoveredRating || field.value) >= rating
//                   ? "bg-primary text-primary-foreground"
//                   : ""
//               }`}
//               onMouseEnter={() => setHoveredRating(rating)}
//               onMouseLeave={() => setHoveredRating(0)}
//               onClick={() => handleRatingChange(rating)}
//             >
//               {rating}
//             </Button>
//           ))}
//         </div>
//       </FormControl>
//       {fieldConfigItem.description && (
//         <FormDescription>{fieldConfigItem.description}</FormDescription>
//       )}
//     </FormItem>
//   );
// }
import { useState } from "react";
import { AutoFormInputComponentProps } from "~/components/ui/auto-form/types";
import { Button } from "~/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
} from "~/components/ui/form";

export default function Scale({
  label,
  isRequired,
  field,
  fieldConfigItem,
  fieldProps,
}: AutoFormInputComponentProps) {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const maxRating = fieldProps.max || 5;
  const step = fieldProps.step || 1;

  const handleRatingChange = (rating: number) => {
    field.onChange(rating);
  };

  return (
    <FormItem className="space-y-2">
      <FormLabel>
        {label}
        {isRequired && <span className="text-destructive"> *</span>}
      </FormLabel>
      <FormControl>
        <div className="flex flex-wrap gap-2">
          {Array.from(
            { length: maxRating / step },
            (_, i) => (i + 1) * step,
          ).map((rating) => (
            <Button
              key={rating}
              variant={field.value === rating ? "default" : "outline"}
              size="sm"
              className={`w-16 h-10 ${
                hoveredRating === rating ? "bg-primary/10" : ""
              }`}
              onMouseEnter={() => setHoveredRating(rating)}
              onMouseLeave={() => setHoveredRating(null)}
              onClick={() => handleRatingChange(rating)}
            >
              {rating}
            </Button>
          ))}
        </div>
      </FormControl>
      {fieldConfigItem.description && (
        <FormDescription>{fieldConfigItem.description}</FormDescription>
      )}
    </FormItem>
  );
}
