import Marquee from "~/components/magicui/marquee";

const logos = [
  {
    name: "Coop",
    src: "/logos/67dfab_200cceb5a22e4e1e9c190445121dd102~mv2.webp",
  },
  {
    name: "KRDigital",
    src: "/logos/667908d4eedb989c578f3a4e_digital (1)-p-500.png",
  },
  {
    name: "Logo",
    src: "/logos/1474008633.png",
  },

  {
    name: "DYPIS-Logo-Horizontal.png",
    src: "/logos/DYPIS-Logo-Horizontal.png",
  },
  {
    name: "GURUZLOGO_50px_tight.webp",
    src: "/logos/GURUZLOGO_50px_tight.webp",
  },
  {
    name: "logo_medicis.2d503991.svg",
    src: "/logos/logo_medicis.2d503991.svg",
  },
  {
    name: "logo-Bizzistance-SWD-moss-rose-biz.svg",
    src: "/logos/logo-Bizzistance-SWD-moss-rose-biz.svg",
  },
  {
    name: "Logo-cabecero-web_satocan.png",
    src: "/logos/Logo-cabecero-web_satocan.png",
  },
  {
    name: "logo-categorize-new-colors.svg",
    src: "/logos/logo-categorize-new-colors.svg",
  },
  {
    name: "logo.png",
    src: "/logos/logo.png",
  },
  {
    name: "logotipo-fundo-escuro-galata-tecnologia.svg",
    src: "/logos/logotipo-fundo-escuro-galata-tecnologia.svg",
  },
  {
    name: "MGILogo.jpg",
    src: "/logos/MGILogo.jpg",
  },
  {
    name: "unlimitedwp-e2m.svg",
    src: "/logos/unlimitedwp-e2m.svg",
  },
  {
    name: "webp.webp",
    src: "/logos/webp.webp",
  },
];
export default function Logos() {
  return (
    <section id="logos">
      <div className="container mx-auto px-4 md:px-8 py-12">
        <h3 className="text-center text-sm font-semibold text-gray-500 uppercase">
          Powering thousands of conversations at
        </h3>
        <div className="relative mt-6">
          <Marquee className="max-w-full [--duration:40s] [--gap:2rem]">
            {logos.map((logo, idx) => (
              <img
                loading="lazy"
                decoding="async"
                key={idx}
                width={112}
                height={40}
                src={logo.src}
                className="h-10 w-28 dark:brightness-0 dark:invert grayscale opacity-50 hover:opacity-75 transition-opacity duration-300"
                alt={logo.name}
              />
            ))}
          </Marquee>
          <div className="pointer-events-none absolute inset-y-0 left-0 h-full w-1/3 bg-gradient-to-r from-background"></div>
          <div className="pointer-events-none absolute inset-y-0 right-0 h-full w-1/3 bg-gradient-to-l from-background"></div>
        </div>
      </div>
    </section>
  );
}
