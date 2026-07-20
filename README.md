# Recipe App

A lightweight front-end web app for discovering meal recipes using the [TheMealDB](https://www.themealdb.com/) public API.

## Features

- Search recipes by keyword
- Browse recipes by category chips and cuisine/area filter
- Get a random recipe with **Surprise me**
- View recipe details (ingredients + instructions) in a modal
- Light/dark theme toggle with saved preference in `localStorage`
- Responsive UI with accessible controls (keyboard support, skip link, dialog semantics)

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript (ES6+)
- External API: TheMealDB

## Project Structure

- `index.html` – App markup
- `style.css` – Styling and themes
- `script.js` – API integration and UI logic

## Setup and Run

Because this is a static front-end project, no build step is required.

### Option 1: Open directly

Open `index.html` in your browser.

### Option 2: Run a local static server (recommended)

From the repository root:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## License

No license file is currently present in this repository. Add a `LICENSE` file to define usage terms.
