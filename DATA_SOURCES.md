# The Birth Lottery — data sources and methods

The Birth Lottery (`/birth-lottery`) is an illustration built from historical estimates. It is **not** a prediction,
and it says nothing about anyone's ancestry. It never assigns ethnicity, religion or race — only a time, a place
(present-day borders, grouped into approximate regions) and the living conditions recorded or estimated for them.

All numbers come from the datasets below. They are preprocessed once by
`scripts/birth-lottery/build-data.mjs` into `src/data/birth-lottery/data.json`; the site makes **no** external data
calls at runtime. `scripts/birth-lottery/sanity-report.md` compares ten sample outputs with the raw source values.

## Datasets

| Dataset | Used for | URL | License |
|---|---|---|---|
| Population — HYDE 3.3, Gapminder, UN WPP 2024 (compiled by Our World in Data) | World and country populations, 10,000 BCE–2023; region weights for the roll | https://ourworldindata.org/grapher/population | CC BY 4.0 |
| Share of population in urban areas — HYDE 3.5 (via Our World in Data) | "Lived in towns and cities" | https://ourworldindata.org/grapher/long-term-urban-population-region | CC BY 4.0 |
| UN World Population Prospects 2024, abridged life tables, both sexes | All mortality numbers and the survival curve for births 1950 onwards; age patterns for earlier eras (see below) | https://population.un.org/wpp/downloads | CC BY 3.0 IGO |
| Life expectancy at birth, long-run — Riley (2005), Zijdeman et al. (2015), HMD, UN WPP (via Our World in Data) | Life expectancy at birth before 1950 | https://ourworldindata.org/grapher/life-expectancy | CC BY 4.0 |
| Child mortality, long-run — Gapminder (2015), UN IGME (via Our World in Data) | Chance of dying before age 5 before 1950 | https://ourworldindata.org/grapher/child-mortality | CC BY 4.0 |
| Literacy rate — Buringh & van Zanden (2009), van Zanden et al. (2014), UNESCO (via Our World in Data) | Literacy | https://ourworldindata.org/grapher/cross-country-literacy-rates | CC BY 4.0 |
| Share of employment in agriculture — ILO modelled estimates, Broadberry & Gardner (2013) (via Our World in Data) | "Worked the land" | https://ourworldindata.org/grapher/share-of-employment-in-agriculture | CC BY 4.0 |
| Population Reference Bureau, *How Many People Have Ever Lived on Earth?* (Kaneda & Haub, 2022) | The ~117 billion figure; births per 1,000 people in each era (to weight a random human across time) | https://www.prb.org/articles/how-many-people-have-ever-lived-on-earth/ | Cited figures |
| Natural Earth 1:110m countries, via `world-atlas@2.0.2` | Globe shapes and country centroids | https://github.com/topojson/world-atlas | Public domain / ISC |

Earliest known writing (Mesopotamian proto-cuneiform, c. 3200 BCE) is used only to state that literacy was 0% before
writing existed.

## Regions and time bins

- **Regions** are the 22 UN M49 geographic subregions used by UN WPP (Northern America included). Countries use
  present-day borders. The globe labels them "approximate regions". Every country population series is attributed
  to its present-day region for all eras.
- **Time bins:** 500 years before 1000 CE, 100 years from 1000 to 1800, 25 years from 1800 to 1950, 5 years from
  1950 (the last bin runs to the present). Each region × bin "cell" is evaluated at the bin's middle year.

## How a roll works

1. **Era.** *Roll a random human:* a bin is chosen with probability proportional to the births in it —
   Σ PRB birth rate × HYDE world population, year by year (PRB's 1900–1950 rate is given as 31–38 per 1,000; we use
   34.5). *Pick a year:* the bin containing that year.
2. **Region.** Chosen in proportion to its population at the bin's middle year (assumes similar birth rates across
   regions within an era — a simplification).
3. **Place.** A present-day country inside the region, in proportion to its estimated population then; the pin
   drops at that country's centroid. The card names the region, and the country only as "around present-day …".
4. **Year** within the bin is uniform.
5. **Outcome.** One more draw picks an age at death from that cell's survival curve (or "still alive at 80").

All draws use a seeded pseudo-random generator, so a permalink `/birth-lottery/r/<seed>` always reproduces the same
roll (for the same data version).

Our reconstruction counts about 88 billion births from 10,000 BCE to today. PRB's ~117 billion also includes roughly
9 billion births before 8000 BCE and uses somewhat higher population benchmarks for antiquity; we use PRB's per-era
birth rates, not its benchmarks.

## Each number on the card, and its fallbacks

Each field records where it came from (`lvl`) and is shown with that label:

| Level | Meaning |
|---|---|
| `region` | Population-weighted mean of the countries in the region that have a value near that year (within half a bin, min 10 / max 60 years); at least 50% of the region's population must be covered (40% for agriculture). |
| `continent` | Continental estimate (Riley's series for life expectancy; Buringh & van Zanden's Western Europe for literacy in Western, Northern and Southern Europe). |
| `world` | World estimate for that year. |
| `standin` | The year is earlier than any estimate: the **earliest** available estimate is used as a stand-in and the card says so. |
| `model` | Derived from the fitted life table (see below), not directly observed. |

- **1950 onwards:** life expectancy, chance of reaching 1, 5 and 15, life expectancy at 15 and the survival curve all
  come straight from the UN WPP life table for that region and year (bin middle). **High confidence.**
- **Before 1950:** life expectancy at birth (`e0`) and child mortality before 5 (`q5`) come from the long-run series
  with the fallbacks above. A full life table is then built with the **Brass relational logit model** (Brass, 1971):
  the UN WPP 1950–1959 country life table closest to the targets is used as the age pattern ("standard") and adjusted
  (α, β) so that it reproduces the target `q5` and `e0` exactly. Survival to ages 1 and 15, life expectancy at 15 and
  the survival curve come from this fitted table and are labelled *modelled*. The standard used is shown in Sources.
- **Ranges.** When life expectancy is a continental/world estimate or stand-in, the card shows the spread of
  Riley's continental estimates around that time. When child mortality is a world estimate, it shows the range among
  countries with records within 25 years, if there are at least three.
- **Literacy:** 0% before 3200 BCE (no writing). Otherwise regional, then continental (Western Europe, 1475–1750),
  then the world average — shown **only as context** ("no regional estimate; world average then …"), never as the
  region's own value. Otherwise "No estimate".
- **Agriculture:** regional only; otherwise "No estimate". (Coverage before 1991 is thin: a few European countries
  from 1300.)
- **Urban share:** HYDE estimates, available for all eras (very uncertain for deep history).

**Confidence badge:** *High* for 1950 onwards; *Medium* when both life expectancy and child mortality are
regional data; *Low* otherwise. About 89% of all random rolls are Low confidence — most humans were born long before
anyone counted.

## Plain-language sentence

The one-line summary on the card is filled in from the card's own numbers by a fixed template (for example,
"About 43 in 100 babies here did not live to see age 5"). Nothing is written freehand.

## World milestones

Dates shown along a lifespan (e.g. Black Death reaching Europe, 1347; Gutenberg's press, c. 1440; Jenner's smallpox
vaccine, 1796; Fleming's penicillin, 1928) are widely documented historical dates, listed in
`src/lib/birth-lottery/milestones.ts`.

## Rebuilding

```bash
node scripts/birth-lottery/build-data.mjs        # downloads to $BL_CACHE (default: OS temp dir), then builds
```

Rebuilding with newer source data changes `data.version` results for existing permalinks only if the numbers change.
