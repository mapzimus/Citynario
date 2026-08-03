# Citynario

![Citynario social preview](public/og.png)

Citynario is a transparent municipal decision-support platform for exploring how residential development choices could affect a city. The first demonstration focuses on Lynn, Massachusetts.

**Live site:** [mapzimus.github.io/Citynario](https://mapzimus.github.io/Citynario/)

## What the demo includes

- Three guided Lynn demonstration sites
- Two editable housing alternatives
- Low, central, and high estimate ranges
- Resident, school-enrollment, mobility, and site-context modules
- Inspectable formulas, source paths, and limitations
- Side-by-side comparison plus JSON and print exports
- Responsive, keyboard-accessible public interface

## Important limitation

The rates in this first build are clearly labeled demonstration proxies. They have not yet been calibrated or validated for local planning use.

> Citynario estimates plausible impacts under stated assumptions. Results are for exploration and decision support—not prediction, legal determination, permitting, or professional engineering certification.

## Run locally

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Validate a production build

```bash
npm test
```

GitHub Actions exports the app as a static site and deploys it to GitHub Pages on updates to `main`.

## Modeling approach

Citynario favors inspectable rules, ranges, and calculation traces over opaque scores or false precision. Every public indicator is designed to expose its inputs, method, source tier, and key limitation.

The demonstration implements four modules:

1. Resident estimates using bedroom-specific occupancy rates and an explicit vacancy allowance.
2. Public-school enrollment using bedroom-specific student-yield assumptions.
3. Daily travel screening using person-trip rates, parking supply, and transit context.
4. Site context comparing proposed impervious surface with a demonstration baseline.

## License

Code is available under the [MIT License](LICENSE). Source datasets and future City Pack artifacts retain their own licenses and attribution requirements.
