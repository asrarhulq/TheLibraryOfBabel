// Research figures for "You Said That?". Every number here was checked against the original paper
// (the authors' PDF of the 2005 Science article and the open-access 2012 PLoS ONE article). The
// quoted phrases are the papers' own words.

export const J2005 = {
  cite: "Johansson, Hall, Sikström & Olsson (2005), Science 310, 116–119",
  short: "Johansson et al., 2005",
  url: "https://doi.org/10.1126/science.1111709",
  participants: 120,
  pairs: 15,
  manipulatedPerPerson: 3,
  mTrials: 354,
  concurrentDetected: 46,
  concurrentPct: 13, // "only 46 (13%) were detected concurrently"
  totalExposedMaxPct: 26, // "no more than 26% of all M trials were exposed"
  bestConditionMaxPct: 27, // free deliberation + low-similarity faces: "not ... more than 27% of all trials detected this way"
  thoughtTheyWouldNoticePct: 84, // supporting online material, of those who noticed none of the swaps
  method: "a double-card ploy",
};

export const H2012 = {
  cite: "Hall, Johansson & Strandberg (2012), PLoS ONE 7(9), e45457",
  short: "Hall et al., 2012",
  url: "https://doi.org/10.1371/journal.pone.0045457",
  participants: 160,
  statements: 12,
  manipulatedPerPerson: 2,
  failedAtLeastOnePct: 69, // "a full 69% of the participants failed to detect at least one of two changes"
  arguedOppositePct: 53, // "a full 53% of the participants argued unequivocally for the opposite of their original attitude"
  method: "a lightly glued paper slip that stuck to the back of the clipboard when the page was turned",
};

export const NW1977 = {
  cite: "Nisbett & Wilson (1977), Psychological Review 84, 231–259",
  title: "Telling more than we can know: Verbal reports on mental processes",
  url: "https://doi.org/10.1037/0033-295X.84.3.231",
};
