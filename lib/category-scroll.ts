let pageScrollFrame = 0;
let programmaticPageScroll = false;

function easeOutCubic(progress: number) {
  return 1 - (1 - progress) ** 3;
}

export function isProgrammaticPageScroll() {
  return programmaticPageScroll;
}

export function cancelAnimatedScroll() {
  cancelAnimationFrame(pageScrollFrame);
  pageScrollFrame = 0;
  programmaticPageScroll = false;
}

export function animateScrollTo(top: number, instant: boolean) {
  const target = Math.max(0, top);
  cancelAnimatedScroll();
  programmaticPageScroll = true;

  const finish = () => {
    programmaticPageScroll = false;
    pageScrollFrame = 0;
  };

  if (instant) {
    window.scrollTo(0, target);
    finish();
    return;
  }

  const start = window.scrollY;
  const distance = target - start;
  if (Math.abs(distance) < 2) {
    finish();
    return;
  }

  const duration = Math.min(820, Math.max(480, Math.abs(distance) * 0.55));
  const startedAt = performance.now();

  const tick = (now: number) => {
    const progress = Math.min(1, (now - startedAt) / duration);
    window.scrollTo(0, start + distance * easeOutCubic(progress));
    if (progress < 1) {
      pageScrollFrame = requestAnimationFrame(tick);
    } else {
      finish();
    }
  };

  pageScrollFrame = requestAnimationFrame(tick);
}

export function scrollChipInRail(categoryId: string, instant: boolean) {
  const button = document.querySelector<HTMLElement>(
    `[data-category="${categoryId}"]`,
  );
  const rail = button?.closest<HTMLElement>("[data-category-rail]");
  if (!button || !rail || rail.scrollWidth <= rail.clientWidth) {
    return;
  }

  const buttonRect = button.getBoundingClientRect();
  const railRect = rail.getBoundingClientRect();
  const delta =
    buttonRect.left +
    buttonRect.width / 2 -
    (railRect.left + railRect.width / 2);

  rail.scrollBy({
    left: delta,
    behavior: instant ? "auto" : "smooth",
  });
}

export function scrollToCategorySection(categoryId: string, instant: boolean) {
  const section = document.getElementById(`category-${categoryId}`);
  if (!section) {
    return;
  }

  const nav = document.querySelector<HTMLElement>("[data-category-nav]");
  const offset = Math.round(nav?.getBoundingClientRect().height ?? 0) + 8;
  const top =
    section.getBoundingClientRect().top + window.scrollY - offset;

  animateScrollTo(top, instant);
  section.classList.remove("category-arrive");
  void section.offsetWidth;
  section.classList.add("category-arrive");
}

export function getActiveCategoryFromScroll(categoryIds: string[]): string | null {
  if (categoryIds.length === 0) {
    return null;
  }

  const nav = document.querySelector<HTMLElement>("[data-category-nav]");
  const line = (nav?.getBoundingClientRect().bottom ?? 0) + 12;

  let active: string | null = null;
  for (const id of categoryIds) {
    const section = document.getElementById(`category-${id}`);
    if (!section) {
      continue;
    }

    if (section.getBoundingClientRect().top <= line) {
      active = id;
    }
  }

  return active;
}
