import { motion } from "framer-motion";
import { Star } from "lucide-react";

import Marquee from "~/components/magicui/marquee";
import { cn } from "~/lib/utils";
import Section from "./section";

export const Highlight = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <span
      className={cn(
        "bg-orange-500/20 p-1 py-0.5 font-bold text-primary dark:bg-orange-500/20 dark:text-primary",
        className,
      )}
    >
      {children}
    </span>
  );
};

export interface TestimonialCardProps {
  name: string;
  role: string;
  img?: string;
  description: React.ReactNode;
  className?: string;
  [key: string]: any;
}

export const TestimonialCard = ({
  description,
  name,
  img,
  role,
  className,
  ...props // Capture the rest of the props
}: TestimonialCardProps) => (
  <div
    className={cn(
      "mb-4 flex w-full cursor-pointer break-inside-avoid flex-col items-center justify-between gap-6 rounded-xl p-4",
      // light styles
      " border border-neutral-200 bg-white",
      // dark styles
      "dark:bg-black dark:[border:1px_solid_rgba(255,255,255,.1)] dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset]",
      className,
    )}
    {...props} // Spread the rest of the props here
  >
    <div className="select-none text-sm font-normal text-neutral-700 dark:text-neutral-400">
      {description}
      <div className="flex flex-row py-1">
        <Star className="size-4 text-yellow-500 fill-yellow-500" />
        <Star className="size-4 text-yellow-500 fill-yellow-500" />
        <Star className="size-4 text-yellow-500 fill-yellow-500" />
        <Star className="size-4 text-yellow-500 fill-yellow-500" />
        <Star className="size-4 text-yellow-500 fill-yellow-500" />
      </div>
    </div>

    <div className="flex w-full select-none items-center justify-start gap-5">
      <img
        width={40}
        height={40}
        src={img || ""}
        alt={name}
        className="h-10 w-10 rounded-full ring-1 ring-border ring-offset-4"
        loading="lazy"
        decoding="async"
      />

      <div>
        <p className="font-medium text-neutral-500">{name}</p>
        <p className="text-xs font-normal text-neutral-400">{role}</p>
      </div>
    </div>
  </div>
);

const testimonials = [
  {
    name: "Alex Rivera",
    role: "CTO at InnovateTech",
    img: "https://randomuser.me/api/portraits/men/91.jpg",
    description: (
      <p>
        Chatmate's AI chatbot widget has revolutionized our customer support.
        <Highlight>
          The ability to jump into conversations when needed is a game-changer.
        </Highlight>{" "}
        It's like having an AI-powered support team available 24/7.
      </p>
    ),
  },
  {
    name: "Samantha Lee",
    role: "Marketing Director at NextGen Solutions",
    img: "https://randomuser.me/api/portraits/women/12.jpg",
    description: (
      <p>
        Implementing Chatmate's customizable chatbot has drastically improved
        our lead generation.
        <Highlight>
          We're seeing a 23% increase in conversion rates!
        </Highlight>{" "}
        The custom lead forms and flow builder are incredibly powerful tools.
      </p>
    ),
  },
  {
    name: "Raj Patel",
    role: "Founder & CEO at StartUp Grid",
    img: "https://randomuser.me/api/portraits/men/45.jpg",
    description: (
      <p>
        As a startup, we need efficient customer support. Chatmate's no-code
        solution was perfect for us.
        <Highlight>Our ticket resolution is 18% faster now.</Highlight> The
        analytics help us continuously improve our customer interactions.
      </p>
    ),
  },
  {
    name: "Emily Chen",
    role: "Product Manager at Digital Wave",
    img: "https://randomuser.me/api/portraits/women/83.jpg",
    description: (
      <p>
        Chatmate's support for various file formats made integrating our
        existing data a breeze.
        <Highlight>
          Customizing the widget to match our brand was effortless.
        </Highlight>{" "}
        It's like having a tailor-made solution without the hefty price tag.
      </p>
    ),
  },
  {
    name: "Michael Brown",
    role: "Data Scientist at FinTech Innovations",
    img: "https://randomuser.me/api/portraits/men/1.jpg",
    description: (
      <p>
        The built-in safeguards in Chatmate give us peace of mind.
        <Highlight>
          Our chatbot provides accurate information about our services 24/7.
        </Highlight>{" "}
        It's transformed how we handle customer inquiries in the finance sector.
      </p>
    ),
  },
  {
    name: "Linda Wu",
    role: "VP of Operations at LogiChain Solutions",
    img: "https://randomuser.me/api/portraits/women/5.jpg",
    description: (
      <p>
        Chatmate's flow builder has allowed us to create complex conversation
        paths effortlessly.
        <Highlight>
          We're achieving a 71% successful resolution rate.
        </Highlight>{" "}
        It's like having an expert support team available round the clock.
      </p>
    ),
  },
  {
    name: "Carlos Gomez",
    role: "Head of R&D at EcoInnovate",
    img: "https://randomuser.me/api/portraits/men/14.jpg",
    description: (
      <p>
        The ability to customize Chatmate's AI behavior has been crucial for us.
        <Highlight>
          We've tailored the chatbot's voice to perfectly match our brand.
        </Highlight>{" "}
        It's seamlessly integrated into our website, enhancing user experience.
      </p>
    ),
  },
  {
    name: "Aisha Khan",
    role: "Chief Marketing Officer at Fashion Forward",
    img: "https://randomuser.me/api/portraits/women/56.jpg",
    description: (
      <p>
        Chatmate's proactive engagement features have transformed our online
        customer service.
        <Highlight>
          The follow-up questions keep users engaged and interested in our
          products.
        </Highlight>{" "}
        It's like having a digital sales assistant working 24/7.
      </p>
    ),
  },
  {
    name: "Tom Chen",
    role: "Director of IT at HealthTech Solutions",
    img: "https://randomuser.me/api/portraits/men/18.jpg",
    description: (
      <p>
        Implementing Chatmate was incredibly straightforward, even on our custom
        platform.
        <Highlight>
          The installation process was smooth, and the support team was always
          ready to help.
        </Highlight>{" "}
        It's boosted our customer satisfaction significantly.
      </p>
    ),
  },
  {
    name: "Sofia Patel",
    role: "CEO at EduTech Innovations",
    img: "https://randomuser.me/api/portraits/women/73.jpg",
    description: (
      <p>
        Chatmate's unlimited data upload feature has been a game-changer for our
        educational platform.
        <Highlight>
          We can provide instant, accurate responses to a vast array of student
          queries.
        </Highlight>{" "}
        It's like having a knowledgeable tutor available at all times.
      </p>
    ),
  },
  {
    name: "Jake Morrison",
    role: "CTO at SecureNet Tech",
    img: "https://randomuser.me/api/portraits/men/25.jpg",
    description: (
      <p>
        As a security-focused company, we appreciate Chatmate's commitment to
        data protection.
        <Highlight>
          The chatbot's ability to handle sensitive inquiries while maintaining
          privacy is impressive.
        </Highlight>{" "}
        It's enhanced our customer trust significantly.
      </p>
    ),
  },
  {
    name: "Nadia Ali",
    role: "Product Manager at Creative Solutions",
    img: "https://randomuser.me/api/portraits/women/78.jpg",
    description: (
      <p>
        The analytics provided by Chatmate have been invaluable for improving
        our customer support strategy.
        <Highlight>
          We can track performance and make data-driven decisions to enhance our
          chatbot.
        </Highlight>{" "}
        It's like having a dedicated analytics team for our customer service.
      </p>
    ),
  },
  {
    name: "Omar Farooq",
    role: "Founder at Startup Hub",
    img: "https://randomuser.me/api/portraits/men/54.jpg",
    description: (
      <p>
        As a startup founder, Chatmate's pricing tiers have been perfect for our
        growth.
        <Highlight>
          We started with the Hobby plan and scaled up as our needs grew.
        </Highlight>{" "}
        It's an invaluable tool for startups looking to provide excellent
        customer support.
      </p>
    ),
  },
];

export default function Testimonials() {
  return (
    <Section
      title="Testimonials"
      subtitle="What our customers are saying"
      className="max-w-8xl"
    >
      <div className="relative mt-6 max-h-screen overflow-hidden">
        <div className="gap-4 md:columns-2 xl:columns-3 2xl:columns-4">
          {Array(Math.ceil(testimonials.length / 3))
            .fill(0)
            .map((_, i) => (
              <Marquee
                vertical
                key={i}
                className={cn({
                  "[--duration:60s]": i === 1,
                  "[--duration:30s]": i === 2,
                  "[--duration:70s]": i === 3,
                })}
              >
                {testimonials.slice(i * 3, (i + 1) * 3).map((card, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      delay: Math.random() * 0.8,
                      duration: 1.2,
                    }}
                  >
                    <TestimonialCard {...card} />
                  </motion.div>
                ))}
              </Marquee>
            ))}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 w-full bg-gradient-to-t from-background from-20%"></div>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4 w-full bg-gradient-to-b from-background from-20%"></div>
      </div>
    </Section>
  );
}
