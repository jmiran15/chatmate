import { Outlet } from "@remix-run/react";
import { Footer } from "./_header._index/footer";
import { Header } from "./_header._index/header";

export default function MarketingLayout() {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  );
}
