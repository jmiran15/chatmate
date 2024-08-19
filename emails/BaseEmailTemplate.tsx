import * as E from "@react-email/components";
import { Icons } from "~/components/icons";
import { generateMediaQueryStyles } from "./mediaQueryUtil";
import { sharedStyles } from "./sharedStyles";

interface BaseEmailTemplateProps {
  previewText: string;
  heading: string;
  children: React.ReactNode;
}

export const BaseEmailTemplate: React.FC<BaseEmailTemplateProps> = ({
  previewText,
  heading,
  children,
}) => {
  return (
    <E.Html lang="en" dir="ltr">
      <E.Head>
        <style>{generateMediaQueryStyles()}</style>
      </E.Head>
      <E.Preview>{previewText}</E.Preview>
      <E.Body style={sharedStyles.main}>
        <E.Container style={sharedStyles.container} className="container">
          <Icons.logo style={sharedStyles.logo} />
          <E.Heading as="h1" style={sharedStyles.heading} className="heading">
            {heading}
          </E.Heading>
          {children}
          <E.Hr style={sharedStyles.hr} />
          <E.Section style={sharedStyles.footer}>
            <E.Link href="https://chatmate.so" style={sharedStyles.footerLink}>
              chatmate.so
            </E.Link>
          </E.Section>
        </E.Container>
      </E.Body>
    </E.Html>
  );
};
