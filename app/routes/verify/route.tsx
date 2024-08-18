import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { type ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useSearchParams } from "@remix-run/react";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { ErrorList, OTPField } from "./otpField";
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
    },
  });

  return (
    <main className="container flex flex-col justify-center pb-32 pt-20">
      <div className="text-center">
        {type ? headings[type] : "Invalid Verification Type"}
      </div>

      <div className="mx-auto flex w-72 max-w-full flex-col justify-center gap-1">
        <div>
          <ErrorList errors={form.errors} id={form.errorId} />
        </div>
        <div className="flex w-full gap-2">
          <Form method="POST" {...getFormProps(form)} className="flex-1">
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
            <Button
              className="w-full"
              //   status={isPending ? "pending" : form.status ?? "idle"}
              type="submit"
              //   disabled={isPending}
            >
              Submit
            </Button>
          </Form>
        </div>
      </div>
    </main>
  );
}
