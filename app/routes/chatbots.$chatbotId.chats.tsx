import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import { Outlet, useFetcher, useLoaderData, useParams } from "@remix-run/react";
import { useCallback, useEffect, useRef, useState } from "react";
import ChatsCard from "~/components/chats-card";
import { flushSync } from "react-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Chat,
  getChatsPagination,
  getPublicChatsCount,
  updateChatStarredStatus,
} from "~/models/chat.server";
import { requireUserId } from "~/session.server";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useMobileScreen } from "~/utils/mobile";
import InboxIndexMd from "~/components/indexes/inbox-md";

const getPage = (searchParams: URLSearchParams) =>
  searchParams.get("cursor") || "";

const getStarred = (searchParams: URLSearchParams) =>
  searchParams.get("starred") || "";

const getSort = (searchParams: URLSearchParams) =>
  searchParams.get("sort") || "dateNewToOld";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  await requireUserId(request);
  const { chatbotId } = params;
  const cursor = getPage(new URL(request.url).searchParams);
  const starred = getStarred(new URL(request.url).searchParams);
  const sort = getSort(new URL(request.url).searchParams) as
    | "dateNewToOld"
    | "dateOldToNew";

  if (!chatbotId) {
    throw new Error("chatbotId is required");
  }

  const totalChatsCount = await getPublicChatsCount({ chatbotId });
  const paginatedChats = await getChatsPagination({
    chatbotId,
    cursorId: cursor,
    take: 25,
    starred: starred === "true",
    sort,
  });

  return json({
    prevCursor: cursor,
    paginated: paginatedChats,
    totalChatsCount,
  });
};

export const shouldRevalidate = () => false;

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const action = formData.get("action");
  const star = formData.get("star") as string;
  const chatId = formData.get("chatId") as string;

  if (!chatId) {
    throw new Error("chatId is required");
  }

  switch (action) {
    case "star":
      return await updateChatStarredStatus({
        chatId,
        starred: star === "true",
      });
    default:
      throw new Error("Invalid action");
  }
};

const SORT_LABELS = [
  {
    value: "dateNewToOld",
    label: "Date: New to old",
  },
  {
    value: "dateOldToNew",
    label: "Date: Old to new",
  },
  // {
  //   value: "messagesHighToLow",
  //   label: "Messages: High to low",
  // },
  // {
  //   value: "messagesLowToHigh",
  //   label: "Messages: Low to high",
  // },
];

export default function Chats() {
  const {
    paginated: { chats, cursorId },
    totalChatsCount,
  } = useLoaderData<typeof loader>();
  const [scrollPosition, setScrollPosition] = useState(0);
  const [clientHeight, setClientHeight] = useState(0);
  const [height, setHeight] = useState(null);
  const [shouldFetch, setShouldFetch] = useState(true);
  const divRef = useRef(null);
  const [chatsState, setChatsState] = useState(chats); // set to intial chats
  const [tab, setTab] = useState<"all" | "starred">("all");
  const [sort, setSort] = useState<
    "dateNewToOld" | "dateOldToNew" | "messagesHighToLow" | "messagesLowToHigh"
  >("dateNewToOld");

  useEffect(() => {
    flushSync(() => {
      setChatsState([]);
    });

    fetcher.load(
      `/chatbots/${chatbotId}/chats?index&starred=${tab === "starred"}`,
    );
  }, [tab]);

  useEffect(() => {
    flushSync(() => {
      setChatsState([]);
    });

    fetcher.load(
      `/chatbots/${chatbotId}/chats?index&starred=${
        tab === "starred"
      }&sort=${sort}`,
    );
  }, [sort]);

  const divRefAvailable = divRef.current;

  // Add Listeners to scroll and client resize
  useEffect(() => {
    const scrollListener = () => {
      setClientHeight(divRef.current.clientHeight);
      setScrollPosition(divRef.current.scrollTop);
    };

    // Avoid running during SSR
    if (divRef && divRef.current) {
      divRef.current.addEventListener("scroll", scrollListener);
    }

    // Clean up
    return () => {
      if (divRef && divRef.current) {
        divRef.current.removeEventListener("scroll", scrollListener);
      }
    };
  }, [divRefAvailable]);

  const divHeight = useCallback(
    (node) => {
      if (node !== null) {
        setHeight(node.getBoundingClientRect().height);
      }
    },
    [chats.length],
  );

  useEffect(() => {
    if (divRef.current) {
      divHeight(divRef.current);
    }
  }, [chats.length]);

  const fetcher = useFetcher();
  const { chatbotId } = useParams();
  const [cursor, setCursor] = useState(cursorId);

  // Listen on scrolls. Fire on some self-described breakpoint
  useEffect(() => {
    if (!shouldFetch || !height) return;
    if (clientHeight + scrollPosition + 100 < height) return;
    if (fetcher.state === "loading") return;
    fetcher.load(
      `/chatbots/${chatbotId}/chats?index&cursor=${cursor}&starred=${
        tab === "starred"
      }&sort=${sort}`,
    );

    setShouldFetch(false);
  }, [clientHeight, scrollPosition]);

  // Merge chats, increment cursor, and allow fetching again
  useEffect(() => {
    // Discontinue API calls if the last page has been reached
    if (fetcher.data && fetcher.data.paginated.chats.length === 0) {
      setShouldFetch(false);
      return;
    }

    // Chats contain data, merge them and allow the possiblity of another fetch
    if (fetcher.data && fetcher.data.paginated.chats.length > 0) {
      setChatsState((prevChats: Chat[]) => [
        ...prevChats,
        ...fetcher.data.paginated.chats,
      ]);

      setCursor(fetcher.data.paginated.cursorId);
      setShouldFetch(true);
    }
  }, [fetcher.data]);

  const isMobile = useMobileScreen();

  return (
    <div className="flex flex-col sm:grid sm:grid-cols-10 h-full overflow-none ">
      <div
        ref={divRef}
        className="flex flex-col h-full w-full overflow-y-auto items-center justify-start p-4 gap-4 sm:border-r sm:p-6 sm:col-span-3"
      >
        <Tabs
          value={tab}
          className="w-full"
          onValueChange={(value: "all" | "starred") => {
            setTab(value);
          }}
        >
          <TabsList>
            <TabsTrigger value="all">All chats</TabsTrigger>
            <TabsTrigger value="starred">Starred</TabsTrigger>
          </TabsList>
          <div className="flex w-full justify-between items-center my-4">
            <p className="text-muted-foreground text-sm">
              Showing {chatsState.length} of {totalChatsCount} chats
            </p>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                {SORT_LABELS.map((sort) => (
                  <SelectItem key={sort.value} value={sort.value}>
                    {sort.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <TabsContent value="all">
            {chatsState.length === 0 ? (
              isMobile ? (
                <InboxIndexMd />
              ) : (
                <p className="text-sm text-muted-foreground self-start w-full">
                  This is where you will see all incoming messages from your
                  customers.
                </p>
              )
            ) : (
              <ol className="w-full space-y-4">
                {chatsState.map((chat) => (
                  <li key={chat.id}>
                    <ChatsCard chat={chat} />
                  </li>
                ))}
              </ol>
            )}
          </TabsContent>
          <TabsContent value="starred">
            {chatsState.length === 0 ? (
              isMobile ? (
                <InboxIndexMd />
              ) : (
                <p className="text-sm text-muted-foreground self-start w-full">
                  No starred chats
                </p>
              )
            ) : (
              <ol className="w-full space-y-4">
                {chatsState.map((chat) => (
                  <li key={chat.id}>
                    <ChatsCard chat={chat} />
                  </li>
                ))}
              </ol>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <Outlet />
    </div>
  );
}
export const handle = {
  PATH: (chatbotId: string) => `/chatbots/${chatbotId}/chats`,
  breadcrumb: "chats",
};
