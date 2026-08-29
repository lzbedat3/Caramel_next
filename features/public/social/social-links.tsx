import { SocialPlatformIcon } from "@/features/public/social/social-platform-icon";
import { socialLabel, type PublicSocialLink } from "@/lib/social";

type SocialLinksProps = {
  links: PublicSocialLink[];
};

export function SocialLinks({ links }: SocialLinksProps) {
  if (links.length === 0) {
    return null;
  }

  return (
    <ul className="flex flex-wrap items-center gap-2.5">
      {links.map((link) => {
        const label = socialLabel(link.platform);
        return (
          <li key={link.id}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="inline-flex size-12 items-center justify-center rounded-full bg-caramel-soft text-espresso shadow-soft transition duration-300 ease-out hover:scale-110 hover:bg-surface hover:text-caramel-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel-soft active:scale-95"
            >
              <SocialPlatformIcon platform={link.platform} />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
