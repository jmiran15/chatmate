import axios from "axios";
import { z } from "zod";
import AutoForm, { AutoFormSubmit } from "~/components/ui/auto-form";
import { useAutoForm } from "../chatbots.$chatbotId.forms.$formId/useAutoForm";
import { FormSubmissionMessage } from "./form-submission-message";

// TODO - this is a duplicate of the FormMessage in Message.tsx - i.e. also used in the "inbox" view
export function FormMessage({
  BASE_URL,
  message,
  setMessages,
}: {
  BASE_URL: string | undefined;
  message: any;
  setMessages: any;
}) {
  const { formSchema, fieldConfig } = useAutoForm(message.form?.elements);
  if (message.formSubmission) {
    return <FormSubmissionMessage />;
  }

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    try {
      const validatedData = formSchema.parse(data);

      // lets call the route /api/form-submission with axios as POSt with the data as json body
      axios
        .post(`${BASE_URL}/api/form-submission`, {
          flowId: message.flowId,
          formId: message.form?.id,
          messageId: message.id,
          submissionData: validatedData,
          chatId: message.chatId,
        })
        .then((response) => {
          const updatedMessage = response.data?.updatedMessage;
          // update the state with the submission
          // we need to setMessages after the submission to update it
          setMessages((messages: any) =>
            messages.map((msg: any) =>
              msg.id === updatedMessage.id
                ? {
                    id: updatedMessage.id,
                    role: updatedMessage.role,
                    content: updatedMessage.content,
                    createdAt: updatedMessage.createdAt,
                    streaming: updatedMessage.streaming,
                    isFormMessage: updatedMessage.isFormMessage,
                    form: updatedMessage.form,
                    formSubmission: updatedMessage.formSubmission,
                  }
                : msg,
            ),
          );
        })
        .catch(function (error) {
          if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.log(error.response.data);
            console.log(error.response.status);
            console.log(error.response.headers);
          } else if (error.request) {
            // The request was made but no response was received
            // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
            // http.ClientRequest in node.js
            console.log(error.request);
          } else {
            // Something happened in setting up the request that triggered an Error
            console.log("Error", error.message);
          }
          console.log(error.config);
        });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log("Form submitted with errors:", error.errors);
      }
    }
  };

  return (
    <AutoForm
      formSchema={formSchema}
      fieldConfig={fieldConfig}
      onSubmit={handleSubmit}
    >
      <AutoFormSubmit>Submit</AutoFormSubmit>
    </AutoForm>
  );
}
