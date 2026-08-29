import { PublicHeading } from "@/components/public/heading";
import { PublicSection } from "@/components/public/section";

type AboutSectionProps = {
  name: string | null;
  about: string;
};

export function AboutSection({ name, about }: AboutSectionProps) {
  return (
    <PublicSection
      id="about"
      aria-label="עלינו"
      className="pt-4 pb-12 sm:pb-16"
      containerClassName="max-w-3xl"
    >
      <p className="text-sm font-medium tracking-wide text-caramel-deep">
        הסיפור
      </p>
      <PublicHeading as="h2" className="mt-3 text-3xl sm:text-4xl lg:text-5xl">
        {name ? `על ${name}` : "עלינו"}
      </PublicHeading>
      <p className="mt-6 text-lg leading-9 whitespace-pre-line text-muted sm:text-xl sm:leading-10">
        {about}
      </p>
    </PublicSection>
  );
}
