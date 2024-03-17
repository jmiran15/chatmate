import { Button } from "./button";
import { Container } from "./container";

export function CallToAction() {
  return (
    <section
      id="get-started-today"
      className="relative overflow-hidden bg-orange-300 py-32"
    >
      <Container className="relative">
        <div className="mx-auto max-w-lg text-center">
          <h2 className="font-display text-3xl tracking-tight text-white sm:text-4xl">
            Transform your customer service
          </h2>
          <p className="mt-4 text-lg tracking-tight text-white">
            Enable your customers to get answers through a natural,
            conversational experience, while dramatically improving business
            outcomes.
          </p>
          <Button to="/join" color="white" className="mt-10">
            Get started for free
          </Button>
        </div>
      </Container>
    </section>
  );
}
