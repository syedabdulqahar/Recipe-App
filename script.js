const API_BASE = "https://www.themealdb.com/api/json/v1/1";
const fallbackSearch = "chicken";

const searchForm = document.querySelector("#searchForm");
const searchInput = document.querySelector("#searchInput");
const randomBtn = document.querySelector("#randomBtn");
const themeToggle = document.querySelector("#themeToggle");
const categoryChips = document.querySelector("#categoryChips");
const areaSelect = document.querySelector("#areaSelect");
const recipeGrid = document.querySelector("#recipeGrid");
const resultTitle = document.querySelector("#resultTitle");
const resultCount = document.querySelector("#resultCount");
const recipeModal = document.querySelector("#recipeModal");
const closeModal = document.querySelector("#closeModal");
const modalImage = document.querySelector("#modalImage");
const modalContent = document.querySelector("#modalContent");
const heroImage = document.querySelector("#heroImage");
const heroTitle = document.querySelector("#heroTitle");
const heroMeta = document.querySelector("#heroMeta");

const setTheme = (theme) => {
  const isDark = theme === "dark";

  document.body.dataset.theme = theme;
  themeToggle.setAttribute("aria-pressed", String(isDark));
  themeToggle.setAttribute(
    "aria-label",
    isDark ? "Switch to light theme" : "Switch to dark theme",
  );
  localStorage.setItem("recipeTheme", theme);
};

const savedTheme = localStorage.getItem("recipeTheme");
const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

setTheme(savedTheme || (systemPrefersDark ? "dark" : "light"));

const fetchJson = async (endpoint) => {
  const response = await fetch(`${API_BASE}/${endpoint}`);

  if (!response.ok) {
    throw new Error("Recipe API request failed");
  }

  return response.json();
};

const escapeHTML = (value = "") => {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
};

const setLoading = () => {
  recipeGrid.innerHTML =
    '<div class="state"><div class="loader" aria-label="Loading"></div></div>';
  resultCount.textContent = "Loading recipes from TheMealDB...";
};

const setEmpty = (message) => {
  recipeGrid.innerHTML = `<div class="state"><p>${message}</p></div>`;
  resultCount.textContent = "No recipes found.";
};

const getIngredients = (meal) => {
  const ingredients = [];

  for (let index = 1; index <= 20; index += 1) {
    const ingredient = meal[`strIngredient${index}`];
    const measure = meal[`strMeasure${index}`];

    if (ingredient && ingredient.trim()) {
      ingredients.push(
        `${measure ? measure.trim() : ""} ${ingredient.trim()}`.trim(),
      );
    }
  }

  return ingredients;
};

const updateHero = (meal) => {
  if (!meal) return;

  heroImage.src = meal.strMealThumb;
  heroImage.alt = meal.strMeal;
  heroTitle.textContent = meal.strMeal;
  heroMeta.textContent = `${meal.strArea || "Global"} ${meal.strCategory || "recipe"}`;
};

const renderMeals = (meals, title) => {
  if (!meals || meals.length === 0) {
    setEmpty("Try another search, category, or cuisine.");
    return;
  }

  resultTitle.textContent = title;
  resultCount.textContent = `${meals.length} recipe${meals.length === 1 ? "" : "s"} found`;
  updateHero(meals[0]);

  recipeGrid.innerHTML = meals
    .map((meal, index) => {
      const webp = "https://images.weserv.nl/?url=" + encodeURIComponent(meal.strMealThumb.replace('https://','').replace('http://','')) + "&output=webp&quality=80";
      return `
    <article class="recipe-card" style="animation-delay: ${index * 45}ms" data-id="${meal.idMeal}" tabindex="0">
      <picture>
        <source type="image/webp" srcset="${escapeHTML(webp)}">
        <img src="${escapeHTML(meal.strMealThumb)}" alt="${escapeHTML(meal.strMeal)}" loading="lazy" decoding="async" fetchpriority="low" width="400" height="300">
      </picture>
      <div class="card-body">
        <div class="meta">
          <span>${escapeHTML(meal.strArea || "Global")}</span>
          <span>${escapeHTML(meal.strCategory || "Recipe")}</span>
        </div>
        <h3>${escapeHTML(meal.strMeal)}</h3>
        <p>${escapeHTML(meal.strInstructions ? `${meal.strInstructions.slice(0, 92)}...` : "Open for full ingredients and instructions.")}</p>
      </div>
    </article>
  `;
    })
    .join("");
};

const loadSearch = async (query = fallbackSearch) => {
  setLoading();
  clearActiveChip();
  areaSelect.value = "";

  try {
    const data = await fetchJson(`search.php?s=${encodeURIComponent(query)}`);
    renderMeals(data.meals, `Results for "${query}"`);
  } catch (error) {
    setEmpty(
      "The recipe API is not responding right now. Please try again soon.",
    );
  }
};

const loadCategory = async (category) => {
  setLoading();
  areaSelect.value = "";

  try {
    const data = await fetchJson(
      `filter.php?c=${encodeURIComponent(category)}`,
    );
    renderMeals(data.meals, `${category} recipes`);
  } catch (error) {
    setEmpty("Could not load this category.");
  }
};

const loadArea = async (area) => {
  if (!area) {
    loadSearch(fallbackSearch);
    return;
  }

  setLoading();
  clearActiveChip();

  try {
    const data = await fetchJson(`filter.php?a=${encodeURIComponent(area)}`);
    renderMeals(data.meals, `${area} cuisine`);
  } catch (error) {
    setEmpty("Could not load this cuisine.");
  }
};

const loadRandomRecipe = async () => {
  setLoading();
  clearActiveChip();
  areaSelect.value = "";

  try {
    const data = await fetchJson("random.php");
    renderMeals(data.meals, "A recipe worth trying");
    document.querySelector("#recipes").scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    setEmpty("Could not pick a random recipe.");
  }
};

const openRecipe = async (id) => {
  try {
    const data = await fetchJson(`lookup.php?i=${id}`);
    const meal = data.meals?.[0];

    if (!meal) return;

    const ingredients = getIngredients(meal);
    const webp = "https://images.weserv.nl/?url=" + encodeURIComponent(meal.strMealThumb.replace('https://','').replace('http://','')) + "&output=webp&quality=80";
    modalImage.loading = "lazy";
    modalImage.src = webp;
    modalImage.alt = meal.strMeal;
    modalImage.onerror = () => { modalImage.src = meal.strMealThumb; };
    modalContent.innerHTML = `
      <div class="meta">
        <span>${escapeHTML(meal.strArea || "Global")}</span>
        <span>${escapeHTML(meal.strCategory || "Recipe")}</span>
      </div>
      <h2 id="modalTitle">${escapeHTML(meal.strMeal)}</h2>
      <h3>Ingredients</h3>
      <ul class="ingredient-list">
        ${ingredients.map((ingredient) => `<li>${escapeHTML(ingredient)}</li>`).join("")}
      </ul>
      <h3>Instructions</h3>
      <p class="instructions">${escapeHTML(meal.strInstructions || "No instructions available.")}</p>
    `;
    recipeModal.classList.add("open");
  } catch (error) {
    setEmpty("Could not load recipe details.");
  }
};

const clearActiveChip = () => {
  document
    .querySelectorAll(".chip.active")
    .forEach((chip) => chip.classList.remove("active"));
};

const loadFilters = async () => {
  try {
    const [categoriesData, areasData] = await Promise.all([
      fetchJson("list.php?c=list"),
      fetchJson("list.php?a=list"),
    ]);

    const categories = categoriesData.meals
      .slice(0, 12)
      .map((item) => item.strCategory);
    categoryChips.innerHTML = categories
      .map(
        (category) =>
          `<button class="chip" type="button" data-category="${escapeHTML(category)}">${escapeHTML(category)}</button>`,
      )
      .join("");

    areaSelect.innerHTML =
      '<option value="">All cuisines</option>' +
      areasData.meals
        .map(
          (area) =>
            `<option value="${escapeHTML(area.strArea)}">${escapeHTML(area.strArea)}</option>`,
        )
        .join("");
  } catch (error) {
    categoryChips.innerHTML = "";
  }
};

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = searchInput.value.trim();

  if (query) {
    loadSearch(query);
  }
});

randomBtn.addEventListener("click", loadRandomRecipe);

themeToggle.addEventListener("click", () => {
  const nextTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
  setTheme(nextTheme);
});

categoryChips.addEventListener("click", (event) => {
  const chip = event.target.closest("[data-category]");

  if (!chip) return;

  clearActiveChip();
  chip.classList.add("active");
  loadCategory(chip.dataset.category);
});

areaSelect.addEventListener("change", (event) => {
  loadArea(event.target.value);
});

recipeGrid.addEventListener("click", (event) => {
  const card = event.target.closest("[data-id]");

  if (card) {
    openRecipe(card.dataset.id);
  }
});

recipeGrid.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;

  const card = event.target.closest("[data-id]");

  if (card) {
    openRecipe(card.dataset.id);
  }
});

closeModal.addEventListener("click", () => {
  recipeModal.classList.remove("open");
});

recipeModal.addEventListener("click", (event) => {
  if (event.target === recipeModal) {
    recipeModal.classList.remove("open");
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    recipeModal.classList.remove("open");
  }
});

// Observe recipe cards and add lively interactions (throttled + rAF)
const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const saveData = navigator.connection && navigator.connection.saveData;
const lowPower = (navigator.deviceMemory && navigator.deviceMemory <= 1) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 1) || saveData;
// Expose a class for CSS to quickly disable heavy effects on constrained devices
if (lowPower) document.documentElement.classList.add('low-power'); else document.documentElement.classList.remove('low-power');
const skipHeavyAnimations = prefersReducedMotion || lowPower;

const cardObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      cardObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.14 });

const observeNewCards = () => {
  document.querySelectorAll('.recipe-card').forEach((card) => {
    if (!card.classList.contains('observed')) {
      card.classList.add('observed');
      cardObserver.observe(card);

      if (skipHeavyAnimations) return; // don't attach tilt handlers on constrained devices

      // Efficient 3D tilt using rAF and cached rect
      let rect = null;
      let rafId = null;
      let lastEvent = null;

      const updateTilt = () => {
        if (!lastEvent) return;
        if (!rect) rect = card.getBoundingClientRect();
        const e = lastEvent;
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        const rx = (py - 0.5) * 6; // less aggressive
        const ry = (px - 0.5) * 10;
        card.style.transform = `translateY(-6px) rotateX(${ -rx }deg) rotateY(${ ry }deg) scale(1.02)`;
        rafId = null;
      };

      const onMouseMove = (e) => {
        lastEvent = e;
        if (rafId == null) rafId = requestAnimationFrame(updateTilt);
      };

      const onMouseEnter = () => { rect = card.getBoundingClientRect(); };
      const onMouseLeave = () => { if (rafId) cancelAnimationFrame(rafId); rafId = null; lastEvent = null; card.style.transform = ''; rect = null; };

      card.addEventListener('mousemove', onMouseMove, { passive: true });
      card.addEventListener('mouseenter', onMouseEnter, { passive: true });
      card.addEventListener('mouseleave', onMouseLeave, { passive: true });

      // Clear cached rect on window resize
      window.addEventListener('resize', () => { rect = null; });
    }
  });
};

// Debounced MutationObserver to catch dynamically rendered cards
let moTimer = null;
const mo = new MutationObserver(() => {
  if (moTimer) clearTimeout(moTimer);
  moTimer = setTimeout(() => observeNewCards(), 120);
});
mo.observe(recipeGrid, { childList: true, subtree: true });

// Hero parallax with rAF (no layout reads on mousemove)
const heroPlate = document.querySelector('.hero-plate');
if (heroPlate && !skipHeavyAnimations) {
  let heroRaf = null;
  let lastHero = null;
  const updateHeroPlate = () => {
    if (!lastHero) return;
    const { clientX, clientY } = lastHero;
    const rect = heroPlate.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width - 0.5;
    const y = (clientY - rect.top) / rect.height - 0.5;
    heroPlate.style.transform = `translate(${x * 12}px, ${y * 8}px) rotate(${x * 2}deg)`;
    heroRaf = null;
  };
  heroPlate.addEventListener('mousemove', (e) => {
    lastHero = e;
    if (heroRaf == null) heroRaf = requestAnimationFrame(updateHeroPlate);
  }, { passive: true });
  heroPlate.addEventListener('mouseleave', () => { heroPlate.style.transform = ''; if (heroRaf) cancelAnimationFrame(heroRaf); heroRaf = null; });
}

// Subtle brand mark bounce on load (keep this simple)
const brandMark = document.querySelector('.brand-mark');
if (brandMark) {
  try {
    brandMark.animate([
      { transform: 'translateY(0) scale(1)' },
      { transform: 'translateY(-6px) scale(1.03)' },
      { transform: 'translateY(0) scale(1)' }
    ], { duration: 1400, easing: 'cubic-bezier(.2,.9,.2,1)', iterations: 1 });
  } catch (e) {
    /* animation not supported; ignore */
  }
}

// small stagger reveal for hero copy
const heroCopy = document.querySelector('.hero-copy');
if (heroCopy) heroCopy.classList.add('animate');

// Ensure new cards are observed after initial render
observeNewCards();

// Kick off existing data loads
loadFilters();
loadSearch(fallbackSearch);
