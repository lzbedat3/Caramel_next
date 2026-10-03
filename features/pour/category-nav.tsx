"use client";

import { useCallback, useLayoutEffect, useRef } from "react";

type CategoryNavProps = {
  categories: { id: number; name: string }[];
  active: number;
  show: boolean;
  label: string;
  onJump: (index: number) => void;
};

// The sticky pill: a caramel blob slides under the active category.
export function CategoryNav({
  categories,
  active,
  show,
  label,
  onJump,
}: CategoryNavProps) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const drops = useRef<(HTMLElement | null)[]>([]);
  const front = useRef<HTMLElement>(null);
  const back = useRef<HTMLElement>(null);
  const nav = useRef<HTMLElement>(null);
  const goo = useRef<HTMLDivElement>(null);

  const place = useCallback(() => {
    const button = buttons.current[active];
    // On a narrow phone the pill scrolls; the caramel layer must span all of it.
    if (nav.current && goo.current) {
      goo.current.style.width = `${nav.current.scrollWidth}px`;
      if (button) {
        nav.current.scrollTo({
          left:
            button.offsetLeft -
            (nav.current.clientWidth - button.offsetWidth) / 2,
        });
      }
    }
    if (button && front.current && back.current) {
      front.current.style.left = `${button.offsetLeft}px`;
      front.current.style.width = `${button.offsetWidth}px`;
      back.current.style.left = `${button.offsetLeft + 8}px`;
      back.current.style.width = `${button.offsetWidth - 16}px`;
    }
    buttons.current.forEach((entry, index) => {
      const drop = drops.current[index];
      if (entry && drop) {
        drop.style.left = `${entry.offsetLeft + entry.offsetWidth - 14}px`;
      }
    });
  }, [active]);

  useLayoutEffect(() => {
    place();
    window.addEventListener("resize", place);
    // Button widths change once the web fonts arrive.
    void document.fonts?.ready.then(place);
    return () => window.removeEventListener("resize", place);
  }, [place, categories]);

  if (categories.length < 2) {
    return null;
  }

  return (
    <nav
      id="nav"
      ref={nav}
      className={show ? "show" : undefined}
      aria-label={label}
    >
      <div className="goo" ref={goo}>
        {categories.map((category, index) => (
          <i
            key={category.id}
            className="dp"
            ref={(node) => {
              drops.current[index] = node;
            }}
          />
        ))}
        <i className="b2" ref={back} />
        <i className="b1" ref={front} />
      </div>
      {categories.map((category, index) => (
        <button
          key={category.id}
          type="button"
          className={index === active ? "on" : undefined}
          aria-current={index === active ? "true" : undefined}
          ref={(node) => {
            buttons.current[index] = node;
          }}
          onClick={() => onJump(index)}
        >
          {category.name}
        </button>
      ))}
    </nav>
  );
}
