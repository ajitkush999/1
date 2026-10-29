
/* ==========================================
   AJIT® PORTFOLIO
   Single-page interactions — script.js
========================================== */

(() => {
  "use strict";

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    [...root.querySelectorAll(selector)];

  const body = document.body;
  const transitionLayer = $(".page-transition");
  const header = $(".site-header");

  const views = $$(".page-view");
  const navLinks = $$(".nav-link[data-view]");

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  const TRANSITION_MS = 480;

  let currentView = "home";
  let isNavigating = false;
  let transitionTimer = null;
  let pendingNavigation = null;

  const validViews = new Set(["home", "tech", "creator"]);

  /* ======================================
     1. INITIAL SETUP
  ====================================== */

  const yearElement = $("#current-year");

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  function getViewFromHash() {
    const hash = window.location.hash.replace("#", "");

    return validViews.has(hash) ? hash : "home";
  }

  function getViewElement(name) {
    return $(`[data-page="${name}"]`);
  }

  function updateNavigation(name) {
    navLinks.forEach((link) => {
      const active = link.dataset.view === name;

      link.classList.toggle("active", active);

      if (active) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function resetViewScroll(view) {
    if (!view) return;

    view.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function setView(name) {
    views.forEach((view) => {
      const active = view.dataset.page === name;

      view.classList.toggle("is-active", active);
      view.setAttribute("aria-hidden", String(!active));

      if (active) {
        view.removeAttribute("inert");
      } else {
        view.setAttribute("inert", "");
      }
    });

    currentView = name;

    updateNavigation(name);
    resetViewScroll(getViewElement(name));
    updateLogo();
  }

  /* ======================================
     2. LOGO SCROLL EFFECT
  ====================================== */

  const brandMark = $(".brand-mark");

  function updateLogo() {
    if (!brandMark) return;

    const scrollableHeight =
      document.documentElement.scrollHeight -
      window.innerHeight;

    const progress =
      scrollableHeight > 0
        ? Math.max(0, window.scrollY / scrollableHeight)
        : 0;

    brandMark.style.opacity = String(
      Math.min(1, 0.45 + progress * 1.4)
    );
  }

  window.addEventListener("scroll", updateLogo, {
    passive: true
  });


  /* ======================================
     3. PAGE TRANSITION SYSTEM
  ====================================== */

  function finishNavigation(name, updateHash = true) {
    clearTimeout(transitionTimer);

    setView(name);

    if (updateHash) {
      const newHash = name === "home" ? "#home" : `#${name}`;

      if (window.location.hash !== newHash) {
        history.pushState({ view: name }, "", newHash);
      }
    }

    body.classList.remove("is-leaving");

    if (transitionLayer) {
      transitionLayer.style.visibility = "hidden";
    }

    isNavigating = false;
    pendingNavigation = null;
  }

  function navigateTo(name, options = {}) {
    if (!validViews.has(name) || !getViewElement(name)) {
      return;
    }

    const {
      updateHash = true,
      force = false
    } = options;

    if (name === currentView && !force) {
      resetViewScroll(getViewElement(name));
      return;
    }

    if (isNavigating) {
      pendingNavigation = { name, options };
      return;
    }

    isNavigating = true;

    if (reduceMotion.matches || !transitionLayer) {
      finishNavigation(name, updateHash);
      return;
    }

    body.classList.add("is-leaving");

    transitionLayer.style.visibility = "visible";

    transitionTimer = window.setTimeout(() => {
      setView(name);

      if (updateHash) {
        const newHash = name === "home"
          ? "#home"
          : `#${name}`;

        if (window.location.hash !== newHash) {
          history.pushState({ view: name }, "", newHash);
        }
      }

      /*
        The overlay covers the change of view.
        Now move it away to reveal the selected view.
      */

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          body.classList.remove("is-leaving");

          transitionTimer = window.setTimeout(() => {
            if (transitionLayer) {
              transitionLayer.style.visibility = "hidden";
            }

            isNavigating = false;

            const pending = pendingNavigation;
            pendingNavigation = null;

            if (pending) {
              navigateTo(pending.name, pending.options);
            }
          }, 540);
        });
      });
    }, TRANSITION_MS);
  }

  /* ======================================
     4. MAIN NAVIGATION
  ====================================== */

  $$("[data-view]").forEach((link) => {
    link.addEventListener("click", (event) => {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const name = link.dataset.view;

      if (!validViews.has(name)) return;

      event.preventDefault();
      navigateTo(name);
    });
  });

  /* Browser Back / Forward support */

  window.addEventListener("popstate", () => {
    const name = getViewFromHash();

    navigateTo(name, {
      updateHash: false,
      force: name !== currentView
    });
  });

  window.addEventListener("hashchange", () => {
    const name = getViewFromHash();

    if (name !== currentView && !isNavigating) {
      navigateTo(name, { updateHash: false });
    }
  });


  /* ======================================
     5. SHARED CONTACT LINKS
  ====================================== */

  $$("[data-contact]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();

      /*
        Contact is shared below all three views.
        Navigate Home first, then scroll to Contact.
      */

      const contact = $("#contact");

      if (!contact) return;

      if (currentView !== "home") {
        navigateTo("home");

        window.setTimeout(() => {
          contact.scrollIntoView({
            behavior: reduceMotion.matches ? "auto" : "smooth",
            block: "start"
          });
        }, reduceMotion.matches ? 0 : 1050);
      } else {
        contact.scrollIntoView({
          behavior: reduceMotion.matches ? "auto" : "smooth",
          block: "start"
        });
      }
    });
  });


  /* ======================================
     6. INTERNAL SECTION SCROLL LINKS
  ====================================== */

  $$("[data-scroll-target]").forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.dataset.scrollTarget;
      const target = document.getElementById(targetId);

      if (!target) return;

      event.preventDefault();

      target.scrollIntoView({
        behavior: reduceMotion.matches ? "auto" : "smooth",
        block: "start"
      });
    });
  });


  /* ======================================
     7. HOME JOURNEY TOGGLE
  ====================================== */

  const journeyTimeline = $(".journey-timeline");

  const journeyButtons = $$(".journey-toggle");

  const timelineItems = $$(".timeline-item[data-category]");

  function setJourney(category) {
    if (!journeyTimeline) return;

    if (!["tech", "creator"].includes(category)) {
      return;
    }

    journeyTimeline.dataset.activeJourney = category;

    timelineItems.forEach((item) => {
      item.hidden = item.dataset.category !== category;
    });

    journeyButtons.forEach((button) => {
      const active = button.dataset.journey === category;

      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  journeyButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setJourney(button.dataset.journey);
    });
  });

  setJourney(
    journeyTimeline?.dataset.activeJourney || "tech"
  );


  /* ======================================
     8. TECH PROJECT DETAIL PANELS
  ====================================== */

  const projectButtons = $$("[data-project-detail]");

  function closeProjectPanels(except = null) {
    $$(".project-detail-panel[data-detail]").forEach((panel) => {
      if (panel === except) return;

      panel.hidden = true;
    });

    projectButtons.forEach((button) => {
      if (button.dataset.projectDetail !== except?.dataset.detail) {
        button.setAttribute("aria-expanded", "false");
      }
    });
  }

  projectButtons.forEach((button) => {
    const detailId = button.dataset.projectDetail;

    const panel = $(
      `.project-detail-panel[data-detail="${detailId}"]`
    );

    if (!panel) return;

    button.setAttribute("aria-expanded", "false");

    button.addEventListener("click", () => {
      const opening = panel.hidden;

      closeProjectPanels(panel);

      panel.hidden = !opening;

      button.setAttribute(
        "aria-expanded",
        String(opening)
      );

      if (opening) {
        panel.scrollIntoView({
          behavior: reduceMotion.matches ? "auto" : "smooth",
          block: "nearest"
        });
      }
    });
  });


  /* ======================================
     9. CREATOR HOOK EXPERIMENT
  ====================================== */

  const hookChoices = $$("[data-hook-choice]");

  const hookFeedback = $(".hook-feedback");
  const hookFeedbackText = $("[data-hook-feedback-text]");

  const hookMessages = {
    A:
      "A direct promise can work when the audience understands the value. The content still needs to deliver on that promise.",

    B:
      "A curiosity gap can make someone want to know more — provided the content genuinely answers the question."
  };

  hookChoices.forEach((button) => {
    button.addEventListener("click", () => {
      const choice = button.dataset.hookChoice;

      hookChoices.forEach((item) => {
        const selected = item === button;

        item.classList.toggle("selected", selected);
        item.setAttribute("aria-pressed", String(selected));
      });

      if (hookFeedback && hookFeedbackText) {
        hookFeedbackText.textContent = hookMessages[choice] || "";
        hookFeedback.hidden = false;
      }
    });

    button.setAttribute("aria-pressed", "false");
  });


  /* ======================================
     10. CREATOR THUMBNAIL COMPARISON
  ====================================== */

  const thumbnailTabs = $$(".thumbnail-tab");
  const thumbnailConcept = $(".thumbnail-concept");
  const thumbnailTitle = $("[data-thumbnail-title]");
  const thumbnailCaption = $("[data-thumbnail-caption]");
  const thumbnailLabel = $(".thumbnail-label");

  const thumbnailVersions = {
    A: {
      title: "THE BIG\nMISTAKE.",
      caption: "Clear promise. Familiar framing.",
      label: "CONCEPT A / DIRECT PROMISE"
    },

    B: {
      title: "NOBODY\nNOTICED.",
      caption: "A curiosity gap. The payoff still matters.",
      label: "CONCEPT B / CURIOSITY GAP"
    }
  };

  function setThumbnail(version) {
    const data = thumbnailVersions[version];

    if (!data || !thumbnailConcept) return;

    thumbnailTabs.forEach((button) => {
      const active = button.dataset.thumbnail === version;

      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    thumbnailConcept.dataset.currentThumbnail = version;

    if (thumbnailTitle) {
      thumbnailTitle.textContent = data.title;
    }

    if (thumbnailCaption) {
      thumbnailCaption.textContent = data.caption;
    }

    if (thumbnailLabel) {
      thumbnailLabel.textContent = data.label;
    }
  }

  thumbnailTabs.forEach((button) => {
    button.addEventListener("click", () => {
      setThumbnail(button.dataset.thumbnail);
    });
  });

  setThumbnail("A");


  /* ======================================
     11. POINTER / BUTTON FEEDBACK
  ====================================== */

  const finePointer = window.matchMedia(
    "(hover: hover) and (pointer: fine)"
  );

  if (finePointer.matches && !reduceMotion.matches) {
    $$(".path-link").forEach((panel) => {
      panel.addEventListener("pointermove", (event) => {
        const rect = panel.getBoundingClientRect();

        panel.style.setProperty(
          "--pointer-x",
          `${event.clientX - rect.left}px`
        );

        panel.style.setProperty(
          "--pointer-y",
          `${event.clientY - rect.top}px`
        );
      });

      panel.addEventListener("pointerleave", () => {
        panel.style.removeProperty("--pointer-x");
        panel.style.removeProperty("--pointer-y");
      });
    });
  }

  $$(".button, .journey-toggle, .thumbnail-tab").forEach((button) => {
    button.addEventListener("pointerdown", () => {
      button.classList.add("is-pressed");
    });

    const release = () => {
      button.classList.remove("is-pressed");
    };

    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("pointerleave", release);
  });


  /* ======================================
     12. INITIAL VIEW
  ====================================== */

  /*
    Set the correct view for direct URLs such as:
    index.html#tech
    index.html#creator
  */

  const initialView = getViewFromHash();

  setView(initialView);

  if (transitionLayer) {
    transitionLayer.style.visibility = "hidden";
  }

  body.classList.add("js-ready");

})();
