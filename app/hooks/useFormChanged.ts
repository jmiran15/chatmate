import { useNavigation } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";

export function useFormChanged() {
  const formRef = useRef<HTMLFormElement>(null);
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [isChanged, setIsChanged] = useState(false);

  useEffect(() => {
    if (!isSubmitting && formRef.current) {
      formRef.current.reset();
      setIsChanged(false);
    }
  }, [isSubmitting]);

  const handleFormChange = () => {
    setIsChanged(true);
  };

  return { formRef, isChanged, handleFormChange };
}
