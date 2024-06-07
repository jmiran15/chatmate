import { useSearchParams } from "@remix-run/react";
import { z } from "zod";
import { urlSchema } from "./types";
import { DataTable } from "./table";
import { columns } from "./columns";

export default function SelectUrls() {
  const [searchParams, setSearchParams] = useSearchParams();
  const jobId = searchParams.get("jobId");

  // polling here
  function getUrls() {
    const urls = [
      {
        title: "Some title",
        url: "https://some-url.com",
      },
      {
        title: "Some title2",
        url: "https://some-url2.com",
      },
      {
        title: "Some title3",
        url: "https://some-url3.com",
      },
      {
        title: "Some title4",
        url: "https://some-url4.com",
      },
      {
        title: "Some title5",
        url: "https://some-url5.com",
      },
      {
        title: "Some title",
        url: "https://some-url.com",
      },
      {
        title: "Some title2",
        url: "https://some-url2.com",
      },
      {
        title: "Some title3",
        url: "https://some-url3.com",
      },
      {
        title: "Some title4",
        url: "https://some-url4.com",
      },
      {
        title: "Some title5",
        url: "https://some-url5.com",
      },
      {
        title: "Some title",
        url: "https://some-url.com",
      },
      {
        title: "Some title2",
        url: "https://some-url2.com",
      },
      {
        title: "Some title3",
        url: "https://some-url3.com",
      },
      {
        title: "Some title4",
        url: "https://some-url4.com",
      },
      {
        title: "Some title5",
        url: "https://some-url5.com",
      },
      {
        title: "Some title",
        url: "https://some-url.com",
      },
      {
        title: "Some title2",
        url: "https://some-url2.com",
      },
      {
        title: "Some title3",
        url: "https://some-url3.com",
      },
      {
        title: "Some title4",
        url: "https://some-url4.com",
      },
      {
        title: "Some title5",
        url: "https://some-url5.com",
      },
      {
        title: "Some title",
        url: "https://some-url.com",
      },
      {
        title: "Some title2",
        url: "https://some-url2.com",
      },
      {
        title: "Some title3",
        url: "https://some-url3.com",
      },
      {
        title: "Some title4",
        url: "https://some-url4.com",
      },
      {
        title: "Some title5",
        url: "https://some-url5.com",
      },
    ];

    return z.array(urlSchema).parse(urls);
  }

  const urls = getUrls();

  return (
    <div>
      <DataTable data={urls} columns={columns} />
    </div>
  );
}
