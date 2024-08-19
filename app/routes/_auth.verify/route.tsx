import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { type ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useSearchParams } from "@remix-run/react";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { ErrorList } from "~/components/ui/error-list";
import { StatusButton } from "~/components/ui/status-button";
import { useIsPending } from "~/hooks/use-is-pending";
import { OTPField } from "./otpField";
import { validateRequest } from "./verify.server";

export const codeQueryParam = "code"; // so we can get the OTP code in search params
export const targetQueryParam = "target"; // so we can get the target email in search params for post handle function
export const typeQueryParam = "type"; // so we know the type in search params for post handle function
export const redirectToQueryParam = "redirectTo"; // optional redirect to a specific page after verification
const types = ["onboarding", "reset-password", "change-email"] as const;
const VerificationTypeSchema = z.enum(types);
export type VerificationTypes = z.infer<typeof VerificationTypeSchema>;

export const VerifySchema = z.object({
  [codeQueryParam]: z.string().min(6).max(6),
  [typeQueryParam]: VerificationTypeSchema,
  [targetQueryParam]: z.string(),
  [redirectToQueryParam]: z.string().optional(),
  intent: z.string().optional(),
});

// on submit
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  return validateRequest(request, formData);
}

export default function VerifyRoute() {
  // TODO - add pending states
  const [searchParams] = useSearchParams();
  const actionData = useActionData<typeof action>();
  const parseWithZoddType = VerificationTypeSchema.safeParse(
    searchParams.get(typeQueryParam),
  );
  const type = parseWithZoddType.success ? parseWithZoddType.data : null;
  const isPending = useIsPending({ intent: "verifyOTP" });

  const checkEmail = (
    <>
      <h1 className="text-h1">Check your email</h1>
      <p className="mt-3 text-body-md text-muted-foreground">
        We've sent you a code to verify your email address.
      </p>
    </>
  );

  const headings: Record<VerificationTypes, React.ReactNode> = {
    onboarding: checkEmail,
    "reset-password": checkEmail,
    "change-email": checkEmail,
  };

  // conform - https://conform.guide/tutorial
  const [form, fields] = useForm({
    id: "verify-form",
    constraint: getZodConstraint(VerifySchema),
    lastResult: actionData?.result,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: VerifySchema });
    },
    defaultValue: {
      code: searchParams.get(codeQueryParam),
      type: type,
      target: searchParams.get(targetQueryParam),
      redirectTo: searchParams.get(redirectToQueryParam),
      intent: "verifyOTP",
    },
  });

  return (
    <Card className="w-full max-w-[90%] sm:max-w-sm shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">
          {type ? "Check your email" : "Invalid Verification Type"}
        </CardTitle>
        <CardDescription className="text-sm text-gray-500">
          {type
            ? "We've sent you a code to verify your email address."
            : "Please try again or contact support."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form
          method="POST"
          {...getFormProps(form)}
          className="flex flex-col gap-4 sm:gap-6"
        >
          <div>
            <ErrorList errors={form.errors} id={form.errorId} />
          </div>
          <div className="flex items-center justify-center">
            <OTPField
              labelProps={{
                htmlFor: fields[codeQueryParam].id,
                children: "Code",
              }}
              inputProps={{
                ...getInputProps(fields[codeQueryParam], { type: "text" }),
                autoComplete: "one-time-code",
                autoFocus: true,
              }}
              errors={fields[codeQueryParam].errors}
            />
          </div>
          <input
            {...getInputProps(fields[typeQueryParam], { type: "hidden" })}
          />
          <input
            {...getInputProps(fields[targetQueryParam], { type: "hidden" })}
          />
          <input
            {...getInputProps(fields[redirectToQueryParam], {
              type: "hidden",
            })}
          />
          <input
            {...getInputProps(fields.intent, {
              type: "hidden",
            })}
          />
          <StatusButton
            className="w-full"
            status={isPending ? "pending" : form.status ?? "idle"}
            type="submit"
            disabled={isPending}
          >
            Submit
          </StatusButton>
        </Form>
      </CardContent>
    </Card>
  );
}
