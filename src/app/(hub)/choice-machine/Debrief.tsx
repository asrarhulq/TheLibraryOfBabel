import { AARONSON, FK1997, FRANKFURT1971, FWH2017, WAGENAAR1972 } from "@/lib/choice-machine/research";

export default function Debrief() {
  return (
    <section className="cm-sec cm-debrief" aria-label="Debrief">
      <h2 className="serif cm-h2">The trick, and what it means</h2>

      <div className="cm-essay">
        <p>
          The machine doesn&rsquo;t read minds. It is a version of a small program the computer scientist Scott Aaronson wrote
          for a class at Berkeley. People typed &ldquo;f&rdquo; or &ldquo;d&rdquo; and tried to be unpredictable; the program
          guessed each key before it was pressed. He writes that it is &ldquo;very easy&rdquo; to get about {AARONSON.easyPct}%
          right, and in his class it got between {AARONSON.classLowPct}% and {AARONSON.classHighPct}%.
        </p>
        <p>
          It works because people are poor at producing randomness. When we try to be unpredictable, we switch too often and
          avoid long streaks, since a streak doesn&rsquo;t <em>feel</em> random. This has been found again and again
          since at least the 1970s (Wagenaar, 1972). In one recent study people switched about{" "}
          {FWH2017.peopleSwitchPct}% of the time, where a coin switches {FWH2017.coinSwitchPct}%.
        </p>
        <p>
          Eleven choices is very little to learn from, and the machine starts knowing nothing about you. Everything it used came
          from the choices you made here.
        </p>

        <blockquote className="cm-quote">
          <p>
            One student held Aaronson&rsquo;s program to exactly {AARONSON.holdoutPct}%. Asked his secret, he said he &ldquo;
            {AARONSON.holdoutQuote}.&rdquo;
          </p>
        </blockquote>

        <h3 className="serif">So were your choices free?</h3>
        <p>
          Being predictable is not the same as being unfree. A friend who knows you well can predict what you&rsquo;ll order at
          a restaurant, and that doesn&rsquo;t make the choice any less yours. Aaronson makes the point from the other side:
          &ldquo;{AARONSON.freeWillQuote}&rdquo;. A coin is perfectly unpredictable, and nobody thinks it has free will.
        </p>
        <p>
          Many philosophers locate freedom somewhere other than unpredictability. Harry Frankfurt argued that what matters is
          whether the desires that move you are ones you endorse, whether you have the will you want to have. On that view, the
          machine found habits in how you pick between two arbitrary buttons. It found nothing about whether the choices you
          care about are your own.
        </p>
        <p>
          What the game does show is narrower and still a little unsettling: the moment you try hardest to be free of pattern,
          you fall into a pattern most people share.
        </p>
      </div>

      <details>
        <summary>Why this version may differ</summary>
        <ul>
          <li>Eleven choices is short. The machine starts knowing nothing about you, so its early guesses are close to chance.</li>
          <li>
            Left and right on a screen are not the same task as the studies, which mostly asked people to write down random
            sequences.
          </li>
          <li>People who know about the trick can beat it, for example by flipping a real coin. That is the honest way to win.</li>
          <li>Results here are not a scientific sample.</li>
        </ul>
      </details>
      <details>
        <summary>Sources</summary>
        <ul>
          <li>
            <a href={AARONSON.url} target="_blank" rel="noreferrer">
              {AARONSON.cite}
            </a>{" "}
            · about {AARONSON.easyPct}% is &ldquo;very easy&rdquo;; {AARONSON.classLowPct}–{AARONSON.classHighPct}% in his class;
            one student held it to {AARONSON.holdoutPct}%.
          </li>
          <li>
            <a href={FWH2017.url} target="_blank" rel="noreferrer">
              {FWH2017.cite}
            </a>{" "}
            · participants &ldquo;typically overalternated at around 0.6&rdquo;.
          </li>
          <li>
            <a href={WAGENAAR1972.url} target="_blank" rel="noreferrer">
              {WAGENAAR1972.cite}
            </a>{" "}
            · &ldquo;{WAGENAAR1972.title}&rdquo;.
          </li>
          <li>
            <a href={FK1997.url} target="_blank" rel="noreferrer">
              {FK1997.cite}
            </a>{" "}
            · &ldquo;{FK1997.title}&rdquo;.
          </li>
          <li>
            <a href={FRANKFURT1971.url} target="_blank" rel="noreferrer">
              {FRANKFURT1971.cite}
            </a>{" "}
            · &ldquo;{FRANKFURT1971.title}&rdquo;.
          </li>
        </ul>
      </details>
      <p className="cm-iq">This isn&rsquo;t a measure of intelligence or of how free you are.</p>
    </section>
  );
}
