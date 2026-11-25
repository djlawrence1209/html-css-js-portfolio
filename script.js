(function () {
    "use strict";

    const $ = (sel, root) => (root || document).querySelector(sel);
    const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ---------- safe storage ----------
    const store = {
        get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
        set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    };

    // ---------- mobile menu ----------
    const navToggle = $(".nav-toggle");
    const navMenu = $(".nav-menu");

    function setMenu(open) {
        navMenu.classList.toggle("open", open);
        navToggle.setAttribute("aria-expanded", String(open));
    }
    navToggle.addEventListener("click", () => setMenu(!navMenu.classList.contains("open")));
    navMenu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
    window.matchMedia("(min-width: 901px)").addEventListener("change", (e) => { if (e.matches) setMenu(false); });

    // ---------- toast ----------
    const toastEl = $("#toast");
    let toastTimer;
    function toast(msg) {
        toastEl.textContent = msg;
        toastEl.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2000);
    }

    // ---------- theme toggle ----------
    const themeBtn = $("#theme-toggle");
    function currentTheme() {
        return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    }
    function syncThemeBtn() {
        const dark = currentTheme() === "dark";
        themeBtn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    }
    themeBtn.addEventListener("click", () => {
        const next = currentTheme() === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        store.set("theme", next);
        syncThemeBtn();
    });
    syncThemeBtn();

    // ---------- scroll progress + active nav link ----------
    const progress = $("#progress");
    function onScroll() {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.transform = "scaleX(" + (max > 0 ? window.scrollY / max : 0) + ")";
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const navLinks = $$(".nav-links a[href^='#']");
    const sections = navLinks.map((a) => $(a.getAttribute("href"))).filter(Boolean);
    if ("IntersectionObserver" in window) {
        const spy = new IntersectionObserver((entries) => {
            entries.forEach((en) => {
                if (en.isIntersecting) {
                    navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id));
                }
            });
        }, { rootMargin: "-45% 0px -50% 0px" });
        sections.forEach((s) => spy.observe(s));
    }

    // ---------- reveal on scroll ----------
    const revealEls = $$(".reveal");
    if ("IntersectionObserver" in window && !reduceMotion) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach((en) => {
                if (en.isIntersecting) {
                    en.target.classList.add("in");
                    io.unobserve(en.target);
                }
            });
        }, { threshold: 0.12 });
        revealEls.forEach((el, i) => {
            el.style.transitionDelay = (i % 4) * 70 + "ms";
            io.observe(el);
        });
    } else {
        revealEls.forEach((el) => el.classList.add("in"));
    }

    // ---------- count-up stats ----------
    function countUp(el) {
        const target = parseFloat(el.dataset.count);
        const decimals = parseInt(el.dataset.decimals || "0", 10);
        const suffix = el.dataset.suffix || "";
        if (reduceMotion || isNaN(target)) return;
        const start = performance.now();
        const dur = 1200;
        (function tick(now) {
            const t = Math.min(1, (now - start) / dur);
            const eased = 1 - Math.pow(1 - t, 3);
            el.textContent = (target * eased).toFixed(decimals) + suffix;
            if (t < 1) requestAnimationFrame(tick);
        })(start);
    }
    const counters = $$("[data-count]");
    if ("IntersectionObserver" in window) {
        const co = new IntersectionObserver((entries) => {
            entries.forEach((en) => {
                if (en.isIntersecting) { countUp(en.target); co.unobserve(en.target); }
            });
        }, { threshold: 0.6 });
        counters.forEach((c) => co.observe(c));
    }

    // ---------- typed role ----------
    const typed = $("#typed");
    const roles = ["Software Developer", "Data Scientist", "ML Researcher", "Powerlifter", "Sky's Pair Programmer"];
    if (!reduceMotion) {
        let ri = 0, ci = roles[0].length, deleting = true;
        (function loop() {
            const word = roles[ri];
            typed.textContent = word.slice(0, ci);
            let delay = deleting ? 45 : 85;
            if (!deleting && ci === word.length) { deleting = true; delay = 1600; }
            else if (deleting && ci === 0) { deleting = false; ri = (ri + 1) % roles.length; delay = 300; }
            else { ci += deleting ? -1 : 1; }
            setTimeout(loop, delay);
        })();
    }

    // ---------- Sky ----------
    const sky = $("#sky");
    const bubble = $("#sky-bubble");
    const hearts = $("#hearts");
    const petCount = $("#pet-count");
    const lines = [
        "Woof! Deployed to prod. Treats pending.",
        "I reviewed your code. 10/10, would sniff again.",
        "Found a bug. It was a squirrel.",
        "Merging to main... after a walk.",
        "Stand-up is at 3. Snack-up is at 3:05.",
        "git commit -m \"good boy\"",
        "I only push to the couch.",
        "Tests passing. Tail wagging.",
    ];
    let pets = parseInt(store.get("skyPets") || "0", 10) || 0;
    petCount.textContent = pets;
    let bubbleTimer, lineIdx = 0, hideTimer;

    function say(text, ms) {
        bubble.textContent = text;
        bubble.classList.add("show");
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => bubble.classList.remove("show"), ms || 3200);
    }
    function spawnHeart() {
        if (reduceMotion) return;
        const h = document.createElement("span");
        h.className = "heart";
        h.textContent = "❤";
        const rect = sky.getBoundingClientRect();
        const host = hearts.getBoundingClientRect();
        h.style.left = (rect.left - host.left + 20 + Math.random() * (rect.width - 40)) + "px";
        h.style.top = (rect.top - host.top + 6) + "px";
        h.style.setProperty("--dx", (Math.random() * 60 - 30) + "px");
        hearts.appendChild(h);
        setTimeout(() => h.remove(), 1500);
    }
    sky.addEventListener("click", () => {
        pets += 1;
        petCount.textContent = pets;
        store.set("skyPets", String(pets));
        for (let i = 0; i < 3; i++) setTimeout(spawnHeart, i * 90);
        const milestone = { 10: "10 pets! You're my favorite dev.", 25: "25 pets. I'm promoting you to Senior Petter.", 50: "50 pets?! Okay, you can have the bacon." }[pets];
        say(milestone || lines[lineIdx++ % lines.length]);
    });
    // Sky chimes in on her own now and then
    if (!reduceMotion) {
        setTimeout(() => say("Woof! Pet me?", 3500), 1800);
        bubbleTimer = setInterval(() => {
            if (!document.hidden && window.scrollY < window.innerHeight) say(lines[lineIdx++ % lines.length]);
        }, 9000);
    }

    // ---------- project filter ----------
    const chips = $$(".filters .chip");
    const cards = $$(".project-card");
    chips.forEach((chip) => chip.addEventListener("click", () => {
        const f = chip.dataset.filter;
        chips.forEach((c) => {
            const on = c === chip;
            c.classList.toggle("active", on);
            c.setAttribute("aria-pressed", String(on));
        });
        cards.forEach((card) => {
            const show = f === "all" || card.dataset.tags.split(" ").includes(f);
            card.classList.toggle("hide", !show);
            if (show) card.classList.add("in");
        });
    }));

    // ---------- card tilt (mouse devices only) ----------
    if (!reduceMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        cards.forEach((card) => {
            card.addEventListener("mousemove", (e) => {
                const r = card.getBoundingClientRect();
                const x = (e.clientX - r.left) / r.width - 0.5;
                const y = (e.clientY - r.top) / r.height - 0.5;
                card.style.transform = "perspective(900px) rotateY(" + x * 6 + "deg) rotateX(" + -y * 6 + "deg) translateY(-4px)";
            });
            card.addEventListener("mouseleave", () => { card.style.transform = ""; });
        });
    }

    // ---------- copy email ----------
    const copyBtn = $("#copy-email");
    copyBtn.addEventListener("click", async () => {
        const email = "djlawrence1209@gmail.com";
        try {
            await navigator.clipboard.writeText(email);
            toast("Email copied. Sky approves.");
        } catch (e) {
            toast(email);
        }
    });

    // ---------- footer year ----------
    $("#year").textContent = new Date().getFullYear();
})();
