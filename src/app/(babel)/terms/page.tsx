import LegalPage, { Section } from '@/components/LegalPage';

export const metadata = { title: 'Terms & Conditions · The Infinite Library of Babel' };

export default function TermsPage() {
  return (
    <LegalPage title="Terms & Conditions" updated="July 2026">
      <p>
        The Infinite Library of Babel (&ldquo;the Library,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;)
        is an interactive art project operated by Asrar ul Haq. By using this website you agree to
        these Terms. If you do not agree, please do not use the site.
      </p>

      <Section heading="What the Library is">
        <p>
          The Library deterministically generates text from coordinates — it does not store or
          &ldquo;contain&rdquo; pre-written books. Any resemblance a generated page bears to real,
          meaningful, offensive, or copyrighted text is a mathematical coincidence produced on
          demand, not content authored or endorsed by us.
        </p>
      </Section>

      <Section heading="Accounts &amp; identity">
        <p>
          You may explore anonymously or sign in with Google. When you sign in, we associate your
          activity (chambers visited, discoveries, declarations, notes) with your account. You are
          responsible for activity under your account. Do not impersonate others.
        </p>
      </Section>

      <Section heading="User content">
        <p>
          Notes in the Traveler&rsquo;s Log, declarations (&ldquo;Immortalize&rdquo;), and public
          Wall entries are content you submit. You must have the right to submit it, and you grant us
          a non-exclusive license to store and display it as part of the Library. Do not submit
          content that is unlawful, hateful, harassing, infringing, or that contains others&rsquo;
          private information without consent.
        </p>
        <p>
          We may remove any content and suspend access at our discretion, particularly where content
          violates these Terms. Content marked public (e.g. the Wall of Declarations) is visible to
          all visitors.
        </p>
      </Section>

      <Section heading="Chamber claims">
        <p>
          &ldquo;Claiming&rdquo; a chamber is the purchase of a one-time, personal digital keepsake:
          a name/dedication displayed on a specific coordinate. It confers no legal ownership, real
          property, or exclusive rights beyond the display shown on the site, and depends on the
          continued operation of the site. Purchases are governed by the Refund Policy.
        </p>
      </Section>

      <Section heading="Intellectual property">
        <p>
          The site design, code, audio, and branding are owned by the operator. The concept of the
          Library of Babel originates with Jorge Luis Borges; the first digital implementation was
          created by Jonathan Basile (libraryofbabel.info). This site is an independent, inspired
          work and is not affiliated with or endorsed by them.
        </p>
      </Section>

      <Section heading="Disclaimers &amp; liability">
        <p>
          The Library is provided &ldquo;as is,&rdquo; without warranties of any kind. We do not
          guarantee availability, that saved data will persist, or that any coordinate will remain
          accessible. To the fullest extent permitted by law, the operator is not liable for any
          indirect or consequential damages arising from use of the site. Where liability cannot be
          excluded, it is limited to the amount you paid us, if any.
        </p>
      </Section>

      <Section heading="Changes">
        <p>
          We may update these Terms; material changes will be reflected by the &ldquo;last
          updated&rdquo; date. Continued use after changes constitutes acceptance.
        </p>
      </Section>

      <Section heading="Contact">
        <p>
          Questions about these Terms:{' '}
          <a href="mailto:contact@thelibrary.page" className="text-babel-gold hover:underline">
            contact@thelibrary.page
          </a>
          .
        </p>
      </Section>
    </LegalPage>
  );
}
