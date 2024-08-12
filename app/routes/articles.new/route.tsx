import { Form, useActionData, useNavigation } from "@remix-run/react";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { AlternativeProductsList } from "./AlternativeProductsList";
import { action } from "./actions.server";

export { action };

export default function ArticlesNew() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [title, setTitle] = useState("");
  const [rootUrl, setRootUrl] = useState("");
  const [alternativeProducts, setAlternativeProducts] = useState<string[]>([
    "",
  ]);

  const [urlErrors, setUrlErrors] = useState({
    rootUrl: "",
    alternativeProducts: {},
  });

  const validateUrl = useCallback((url: string) => {
    const urlRegex =
      /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    return urlRegex.test(url);
  }, []);

  const handleRootUrlChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newUrl = e.target.value;
      setRootUrl(newUrl);
      setUrlErrors((prev) => ({
        ...prev,
        rootUrl: validateUrl(newUrl) ? "" : "Invalid URL format",
      }));
    },
    [validateUrl],
  );

  const titleRef = useRef<HTMLInputElement>(null);
  const rootUrlRef = useRef<HTMLInputElement>(null);

  const isFormValid = useMemo(() => {
    return (
      title.trim().length >= 5 &&
      rootUrl.trim() !== "" &&
      alternativeProducts.filter((url) => url.trim() !== "").length > 0
    );
  }, [title, rootUrl, alternativeProducts]);

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTitle(e.target.value);
    },
    [],
  );

  useEffect(() => {
    if (actionData?.errors?.title) {
      titleRef.current?.focus();
    } else if (actionData?.errors?.rootUrl) {
      rootUrlRef.current?.focus();
    }
  }, [actionData]);

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Create a New Article</h1>
      <Form method="post" className="space-y-8">
        <input type="hidden" name="intent" value="create-article" />

        <div className="space-y-4">
          <label className="block">
            <span className="text-lg font-semibold">Article Title</span>
            <Input
              ref={titleRef}
              type="text"
              name="title"
              value={title}
              onChange={handleTitleChange}
              placeholder="Top 10 Alternatives to [Product] in 2023"
              className="mt-1 w-full"
              required
              aria-invalid={actionData?.errors?.title ? true : undefined}
              aria-describedby="title-error"
            />
            {actionData?.errors?.title && (
              <p className="text-red-500 text-sm mt-1" id="title-error">
                {actionData.errors.title}
              </p>
            )}
          </label>

          {/* <label className="block">
            <span className="text-lg font-semibold">
              Special Instructions (Optional)
            </span>
            <Textarea
              name="instructions"
              placeholder="E.g., Focus on affordable alternatives, or highlight open-source options"
              className="mt-1 w-full"
            />
          </label> */}

          <label className="block">
            <span className="text-lg font-semibold">Root Product URL</span>
            <Input
              ref={rootUrlRef}
              type="url"
              name="rootUrl"
              value={rootUrl}
              onChange={handleRootUrlChange}
              placeholder="https://www.example.com"
              className="mt-1 w-full"
              required
              aria-invalid={actionData?.errors?.rootUrl ? true : undefined}
              aria-describedby="rootUrl-error"
            />
            {actionData?.errors?.rootUrl && (
              <p className="text-red-500 text-sm mt-1" id="rootUrl-error">
                {actionData.errors.rootUrl}
              </p>
            )}
            {urlErrors.rootUrl && (
              <p className="text-red-500 text-sm mt-1">{urlErrors.rootUrl}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Enter the homepage URL of the main product you're comparing
              alternatives to.
            </p>
          </label>

          <AlternativeProductsList
            products={alternativeProducts}
            setProducts={setAlternativeProducts}
            errors={actionData?.errors?.alternativeProducts}
          />
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!isFormValid || isSubmitting}
                >
                  {isSubmitting ? "Generating..." : "Generate Article"}
                </Button>
              </div>
            </TooltipTrigger>
            {!isFormValid && (
              <TooltipContent>
                <p>
                  Please fill out all required fields and add at least one
                  alternative product.
                </p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </Form>
    </div>
  );
}

export const handle: SEOHandle = {
  getSitemapEntries: () => null,
};
