# Birth Lottery — sanity check (2026-11-17)

Each row: what the app shows for a cell vs. the raw source value(s) it came from.

| Year (bin) | Region | Field | App value | Level | Raw source check |
|---|---|---|---|---|---|
| -3000 (-3000–-2500) | Eastern Asia | e0 | 27.5 (range 26.4–34.8) | standin | Asia @1770: 27.5 |
| | | child mortality <5 | 42.8% | standin | World @1800: 42.8 |
| | | (model fit) | e0 27.5, q5 42.8% | model | standard Afghanistan 1950, β=0.982 |
| | | literacy | — | none | no data |
| | | urban | 0.5% | region | China 0.5 (-3000); China, Hong Kong SAR 0 (-3000); China, Taiwan Province of China 0 (-3000); Dem. People's Republic of Korea 0 (-3000) |
| 1 (0–500) | Southern Europe | e0 | 34.3 (range 26.4–34.8) | standin | Europe @1770: 34.3 |
| | | child mortality <5 | 42.8% | standin | World @1800: 42.8 |
| | | (model fit) | e0 34.3, q5 42.8% | model | standard Egypt 1950, β=1.08 |
| | | literacy | — | none | no data |
| | | urban | 2.5% | region | Albania 0 (250); Andorra 0 (250); Bosnia and Herzegovina 0 (250); Croatia 0 (250) |
| 1347 (1300–1400) | Eastern Asia | e0 | 27.5 (range 26.4–34.8) | standin | Asia @1770: 27.5 |
| | | child mortality <5 | 42.8% | standin | World @1800: 42.8 |
| | | (model fit) | e0 27.5, q5 42.8% | model | standard Afghanistan 1950, β=0.982 |
| | | literacy | — | none | no data |
| | | urban | 4.4% | region | China 5 (1350); China, Hong Kong SAR 0 (1350); China, Taiwan Province of China 0.1 (1350); Dem. People's Republic of Korea 0 (1350) |
| 1650 (1600–1700) | Western Europe | e0 | 34.3 (range 26.4–34.8) | standin | Europe @1770: 34.3 |
| | | child mortality <5 | 42.8% | standin | World @1800: 42.8 |
| | | (model fit) | e0 34.3, q5 42.8% | model | standard Egypt 1950, β=1.08 |
| | | literacy | 30.7% | region | Belgium 25 (1650); France 29 (1650); Germany 31 (1650); Netherlands 53 (1650) |
| | | urban | 8.9% | region | Austria 3.9 (1650); Belgium 29.9 (1650); France 6.9 (1650); Germany 8.1 (1650) |
| 1820 (1800–1825) | Northern Europe | e0 | 39.9 | region | Finland 34.6 (1812); Sweden 35.1 (1812); United Kingdom 41.1 (1812) |
| | | child mortality <5 | 42.4% | world | World @1812: 42.4 |
| | | (model fit) | e0 39.9, q5 42.4% | model | standard Egypt 1954, β=0.686 |
| | | literacy | — | none | no data |
| | | urban | 28.8% | region | Denmark 15.9 (1812); Estonia 14.2 (1812); Faroe Islands 1.4 (1812); Finland 16.5 (1812) |
| 1870 (1850–1875) | Southern Asia | e0 | 27.5 (range 27.5–36.2) | continent | Asia @1862: 27.5 |
| | | child mortality <5 | 42.6% | world | World @1862: 42.6 |
| | | (model fit) | e0 27.5, q5 42.6% | model | standard Afghanistan 1950, β=0.992 |
| | | literacy | 18.7% | world | World @1870: 18.7 |
| | | urban | 8.9% | region | Afghanistan 2.2 (1862); Bangladesh 2.2 (1862); Bhutan 0.9 (1862); India 9.7 (1862) |
| 1900 (1900–1925) | Western Europe | e0 | 49.3 | region | Austria 45.7 (1912); Belgium 52.3 (1912); France 51.6 (1912); Germany 46.9 (1912) |
| | | child mortality <5 | 20.3% | region | Austria 29.4 (1912); Belgium 17.7 (1912); France 15.7 (1912); Germany 23.7 (1912) |
| | | (model fit) | e0 49.3, q5 20.3% | model | standard Turkmenistan 1953, β=1.007 |
| | | literacy | 27.5% | world | World @1912: 27.5 |
| | | urban | 39.2% | region | Austria 42.6 (1912); Belgium 73.7 (1912); France 47.8 (1912); Germany 28.6 (1912) |
| 1952 (1950–1955) | Western Africa | e0 | 35.7 | region | WPP Western Africa 1952 ex(0) = 35.7 |
| | | survive to 5 | 65.6% | region | WPP l(5)/l(0) = 65.6% |
| | | literacy | 12.5% | region | Cabo Verde 22.5 (1950); Gambia 7.5 (1950); Ghana 22.5 (1950); Guinea-Bissau 3 (1950) |
| | | urban | 10% | region | Benin 5.2 (1952); Burkina Faso 3.8 (1952); Cabo Verde 12 (1952); Côte d'Ivoire 10.7 (1952) |
| 1980 (1980–1985) | South America | e0 | 64.2 | region | WPP South America 1982 ex(0) = 64.2 |
| | | survive to 5 | 92.1% | region | WPP l(5)/l(0) = 92.1% |
| | | literacy | 80.6% | region | Argentina 94.3 (1982); Bolivia (Plurinational State of) 69.5 (1982); Brazil 75.8 (1982); Chile 91.1 (1982) |
| | | urban | 69.6% | region | Argentina 83.6 (1982); Bolivia (Plurinational State of) 47.5 (1982); Brazil 69 (1982); Chile 82.1 (1982) |
| 2015 (2015–2020) | Southern Asia | e0 | 69.8 | region | WPP Southern Asia 2017 ex(0) = 69.8 |
| | | survive to 5 | 95.6% | region | WPP l(5)/l(0) = 95.6% |
| | | literacy | 71.4% | region | Afghanistan 34.7 (2017); Bangladesh 72.9 (2017); Bhutan 66.6 (2017); India 73 (2017) |
| | | urban | 35.8% | region | Afghanistan 26.1 (2017); Bangladesh 32.4 (2017); Bhutan 40.1 (2017); India 34 (2017) |
