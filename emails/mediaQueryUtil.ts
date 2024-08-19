// mediaQueryUtil.ts
export const generateMediaQueryStyles = () => `
  @media only screen and (max-width: 600px) {
    .container { padding: 20px 10px 48px !important; }
    .heading { font-size: 22px !important; }
    .paragraph { font-size: 14px !important; }
    .button { padding: 16px 23px !important; font-size: 16px !important; }
  }
`;
