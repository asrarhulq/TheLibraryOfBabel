import LegalPage, { Section } from '@/components/LegalPage';

export const metadata = { title: 'Refund Policy · The Infinite Library of Babel' };

export default function RefundsPage() {
  return (
    <LegalPage title="Refund Policy" updated="July 2026">
      <p>
        This policy applies to purchases made on The Infinite Library of Babel, operated by Asrar ul
        Haq — currently, claiming a chamber.
      </p>

      <Section heading="Digital goods — all sales final">
        <p>
          Claiming a chamber grants a one-time digital keepsake (your name and dedication displayed
          on a specific coordinate) that is delivered immediately upon purchase. Because it is a
          digital good delivered instantly, <span className="text-babel-parchment">all sales are
          final and non-refundable</span>, except where a refund is required by applicable law.
        </p>
      </Section>

      <Section heading="Exceptions">
        <p>
          If you were charged in error, charged more than once, or the keepsake failed to be created
          after a successful payment, contact us and we will investigate and, where appropriate,
          issue a refund or correct the claim.
        </p>
      </Section>

      <Section heading="How to reach us">
        <p>
          For any billing question, email{' '}
          <a href="mailto:contact@thelibrary.page" className="text-babel-gold hover:underline">
            contact@thelibrary.page
          </a>{' '}
          with your claim details (the chamber coordinate and the name on the plaque). We aim to
          respond within a few days.
        </p>
      </Section>

      <p className="text-babel-dust/60 text-xs italic">
        Note: chamber claiming is not yet open to the public. When it opens, this policy governs those
        purchases.
      </p>
    </LegalPage>
  );
}
