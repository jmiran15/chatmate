declare module "*.mdx" {
  import type { ComponentType } from "react";

  export const frontmatter: {
    title: string;
    description: string;
    published: string;
    featured: boolean;
    image: string;
  };

  export const handle: {
    breadcrumb: () => JSX.Element;
  };

  const Component: ComponentType;
  export default Component;
}
