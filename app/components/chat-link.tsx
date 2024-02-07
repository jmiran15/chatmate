import { Chat } from "@prisma/client";
import { useNavigation, useLocation } from "@remix-run/react";
import { useEffect, useState } from "react";
import { cn } from "~/lib/utils";
import { buttonVariants } from "./ui/button";
import { Form, Link } from "react-router-dom";
import { Trash2, Pencil, Check } from "lucide-react";
import { Input } from "./ui/input";
export default function ChatLink({ chat }: { chat: Chat }) {
  const [active, setActive] = useState(false);
  const [editing, setEditing] = useState(false);
  const location = useLocation();
  const navigation = useNavigation();
  const [updateValue, setUpdateValue] = useState(chat.name);

  const isSubmitting = navigation.formData === location.pathname;

  function isActive(id: string) {
    return location.pathname.includes(id);
  }

  useEffect(() => {
    if (!isSubmitting) {
      setEditing(false);
    }
  }, [isSubmitting]);

  console.log("isSubmitting", isSubmitting, editing);

  return (
    <div
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      className={cn(
        buttonVariants({
          variant: isActive(chat.id) ? "default" : "ghost",
          size: "sm",
        }),
        isActive(chat.id) &&
          "dark:bg-muted dark:text-white dark:hover:bg-muted dark:hover:text-white",
        "justify-start",
        "flex flex-row justify-between items-center",
      )}
    >
      {editing ? (
        <input
          type="text"
          placeholder="Chat name"
          value={updateValue}
          className="flex-1 bg-transparent border-none focus:outline-none"
          style={{ animation: "pulse 1s infinite" }}
          onChange={(e) => setUpdateValue(e.target.value)}
        />
      ) : (
        <Link to={chat.id} className="flex-1">
          {chat.name}
        </Link>
      )}
      {active || isActive(chat.id) ? (
        <div className="flex flex-row gap-2 items-center">
          {editing ? (
            <Form method="post" className="flex-1 items-center">
              <button type="submit">
                <input type="hidden" name="action" value="update" />
                <input type="hidden" name="chatId" value={chat.id} />
                <input type="hidden" name="updateName" value={updateValue} />
                <Check className="h-4 w-4" />
              </button>
            </Form>
          ) : (
            <>
              <Pencil
                className="h-4 w-4 cursor-pointer"
                onClick={() => setEditing(true)}
              />
              <Form method="post" className="flex items-center">
                <input type="hidden" name="action" value="delete" />
                <input type="hidden" name="chatId" value={chat.id} />
                <button type="submit">
                  <Trash2 className="h-4 w-4" />
                </button>
              </Form>
            </>
          )}
        </div>
      ) : (
        <></>
      )}
    </div>
  );
}
