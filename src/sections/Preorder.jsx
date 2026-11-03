import { useRef, useState } from "react";
import { gsap, SplitText, useGSAP } from "../lib/gsap";
import { motion, softFade } from "../animations/motion";
import { useMagnetic } from "../hooks/useMagnetic";
import TrackHead from "../components/TrackHead";

export default function Preorder() {
  const root = useRef();
  const cta = useRef();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [reserved, setReserved] = useState(false);
  useMagnetic(cta, { strength: 0.3 });

  useGSAP(
    () => {
      motion({
        full: () => {
          // Harfler pres gibi yukarıdan basılır
          SplitText.create("[data-anim='press-title']", {
            type: "lines,words,chars",
            mask: "lines",
            autoSplit: true,
            onSplit: (self) =>
              gsap.from(self.chars, {
                yPercent: -110,
                duration: 0.9,
                stagger: 0.035,
                ease: "back.out(2.2)",
                scrollTrigger: { trigger: root.current, start: "top 55%" },
              }),
          });
          gsap.from("[data-anim='press-in']", {
            opacity: 0,
            y: 24,
            duration: 1.1,
            stagger: 0.1,
            delay: 0.3,
            scrollTrigger: { trigger: root.current, start: "top 55%" },
          });
        },
        reduced: () => softFade("[data-anim]", root.current),
      });
    },
    { scope: root },
  );

  useGSAP(
    () => {
      if (!reserved) return;
      gsap.from("[data-anim='reserved']", { opacity: 0, y: 16, duration: 0.8 });
    },
    { dependencies: [reserved], scope: root },
  );

  const submit = (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter an email address like name@example.com.");
      return;
    }
    setError("");
    setReserved(true);
  };

  return (
    <section
      id="pre-order"
      ref={root}
      aria-labelledby="preorder-title"
      className="relative flex min-h-[130svh] flex-col justify-end px-gutter pt-[40svh] pb-32 md:justify-center md:pt-24 md:pb-24"
    >
      <div className="md:max-w-[36rem]">
        <TrackHead code="B2" title="Pre-order" data-anim="press-in" />
        <h2
          id="preorder-title"
          data-anim="press-title"
          className="mt-4 font-display text-display font-[740] tracking-[-0.04em]"
        >
          First pressing
        </h2>
        <p data-anim="press-in" className="mt-6 max-w-[32em] text-lede">
          500 units, each numbered by hand under the platter. $1,490, shipping from March 2027.
        </p>

        <div data-anim="press-in" className="mt-10">
          {reserved ? (
            <p
              data-anim="reserved"
              role="status"
              className="max-w-[30em] font-display text-lede font-[600]"
            >
              Reserved. We’ll email {email} when yours is cut.
            </p>
          ) : (
            <form
              onSubmit={submit}
              noValidate
              className="flex flex-col gap-3 sm:flex-row sm:items-start"
            >
              <div className="flex-1">
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "email-error" : undefined}
                  className="min-h-12 w-full rounded-full border border-ink/40 bg-transparent px-5 font-display text-base text-ink placeholder:text-ink-soft focus:border-ink focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-label"
                />
                {error && (
                  <p id="email-error" className="mt-2 pl-5 text-small">
                    {error}
                  </p>
                )}
              </div>
              <button
                ref={cta}
                type="submit"
                data-cursor="Reserve"
                className="min-h-12 rounded-full bg-oxblood px-7 font-display text-base font-[650] text-label transition-colors duration-300 hover:bg-oxblood-raised"
              >
                Reserve one
              </button>
            </form>
          )}
        </div>
        <p data-anim="press-in" className="mt-8 max-w-[34em] text-small text-ink-soft">
          Lathe is a concept by Melih Fidan. Nothing here is for sale, and the form doesn’t send or
          store anything.
        </p>
      </div>
    </section>
  );
}
