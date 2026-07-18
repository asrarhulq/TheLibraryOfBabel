import LegalPage, { Section } from '@/components/LegalPage';

export const metadata = { title: 'Privacy Policy · The Infinite Library of Babel' };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="July 2026">
      <p>
        This policy explains what The Infinite Library of Babel, operated by Asrar ul Haq, collects
        and how it is used. We aim to collect as little as possible.
      </p>

      <Section heading="What we collect">
        <p>
          <span className="text-babel-parchment">Anonymous exploration:</span> a random
          &ldquo;traveler&rdquo; identifier stored in your browser to track your progress, plus basic
          activity (chambers visited, words uncovered, discoveries you save).
        </p>
        <p>
          <span className="text-babel-parchment">If you sign in with Google:</span> your name, email
          address, and profile image, used to identify your account and display your name on content
          you create.
        </p>
        <p>
          <span className="text-babel-parchment">Content you submit:</span> notes, declarations, and
          claim details, stored with your identifier.
        </p>
      </Section>

      <Section heading="How it is used">
        <p>
          To operate the Library: save your progress, attribute your notes and declarations, power
          the Journal, Wall, and Leaderboard, and process chamber claims. We do not sell your data.
        </p>
      </Section>

      <Section heading="What is public">
        <p>
          Content you choose to make public — declarations shared to the Wall, notes left in a
          chamber&rsquo;s Traveler&rsquo;s Log, and names shown on claimed chambers or the
          Leaderboard — is visible to all visitors. Do not put anything you consider private into
          public content.
        </p>
      </Section>

      <Section heading="Where data is stored &amp; third parties">
        <p>
          Data is stored in a MongoDB database. We use Google for sign-in, Vercel for hosting, and (for
          purchases, when enabled) a payment processor such as Stripe. These providers process data on
          our behalf under their own terms.
        </p>
      </Section>

      <Section heading="Your choices">
        <p>
          You can explore without signing in. You can request deletion of your account data or any
          content you submitted by emailing us. Clearing your browser storage removes your anonymous
          identifier from this device.
        </p>
      </Section>

      <Section heading="Contact">
        <p>
          Privacy requests:{' '}
          <a href="mailto:contact@thelibrary.page" className="text-babel-gold hover:underline">
            contact@thelibrary.page
          </a>
          .
        </p>
      </Section>
    </LegalPage>
  );
}
