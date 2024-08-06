import { Outlet, useMatches, Link } from "@remix-run/react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";

export const handle = {
  breadcrumb: () => <Link to="/blog">Blog</Link>,
};

export default function BlogLayout() {
  const matches = useMatches();
  const breadcrumbs = matches
    .filter((match) => match.handle?.breadcrumb)
    .map((match) => ({
      breadcrumb: match.handle.breadcrumb(match),
      path: match.pathname,
    }));

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Breadcrumb className="mb-8">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          {breadcrumbs.map((breadcrumb, index) => (
            <BreadcrumbItem key={breadcrumb.path}>
              {index < breadcrumbs.length - 1 ? (
                <>
                  <BreadcrumbLink asChild>
                    {breadcrumb.breadcrumb}
                  </BreadcrumbLink>
                  <BreadcrumbSeparator />
                </>
              ) : (
                <BreadcrumbPage>{breadcrumb.breadcrumb}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <Outlet />
    </div>
  );
}
