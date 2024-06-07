import { Button } from "~/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

import WebScrape from "./web-scrape";
import WebCrawl from "./web-crawl";

export function DialogDemo() {
  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Web - 1</DialogTitle>
        <DialogDescription>Web 1</DialogDescription>
      </DialogHeader>
      <WebScrape />
      <WebCrawl />
      <DialogFooter>
        <Button type="submit">Save changes</Button>
      </DialogFooter>
    </DialogContent>
  );
}
