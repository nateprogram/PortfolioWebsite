// The resume as a PDF document (@react-pdf/renderer). Served by
// src/app/resume.pdf/route.tsx, and rendered by scripts/check-content.ts
// to make sure the resume still fits on one page.
//
// ATS notes: single column, real text (standard Helvetica, no images of
// text), document title/author metadata, link annotations on the URLs,
// and hyphenation disabled so keywords like "TypeScript" never split
// across lines.

import {
  Document,
  Font,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import { RESUME, type Resume } from "@/data/resume";
import { formatRange } from "@/data/experience";

Font.registerHyphenationCallback((word) => [word]);

const INK = "#111111";
const SOFT = "#3a3a3a";

const s = StyleSheet.create({
  page: {
    paddingTop: 26,
    paddingBottom: 24,
    paddingHorizontal: 36,
    fontFamily: "Helvetica",
    fontSize: 9.3,
    lineHeight: 1.24,
    color: INK,
  },
  name: {
    fontFamily: "Helvetica-Bold",
    fontSize: 17,
    letterSpacing: 1.5,
    lineHeight: 1,
    textAlign: "center",
    marginBottom: 5,
  },
  headline: { fontSize: 9.8, textAlign: "center", marginTop: 2 },
  contact: { fontSize: 8.6, textAlign: "center", color: SOFT, marginTop: 1.5 },
  link: { color: SOFT, textDecoration: "none" },
  section: { marginTop: 6.5 },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10.2,
    paddingBottom: 1.2,
    marginBottom: 3,
    borderBottomWidth: 0.7,
    borderBottomColor: INK,
  },
  entry: { marginBottom: 3.5 },
  head: { fontSize: 9.3 },
  bold: { fontFamily: "Helvetica-Bold" },
  meta: { color: SOFT },
  bulletRow: { flexDirection: "row", marginTop: 0.8, paddingLeft: 4 },
  bulletDot: { width: 9 },
  bulletText: { flex: 1 },
});

function Bullets({ items }: { items: ReadonlyArray<string> }) {
  return (
    <>
      {items.map((b) => (
        <View key={b} style={s.bulletRow} wrap={false}>
          <Text style={s.bulletDot}>•</Text>
          <Text style={s.bulletText}>{b}</Text>
        </View>
      ))}
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function ResumeDocument({ r }: { r: Resume }) {
  return (
    <Document
      title={`${r.name} Resume`}
      author={r.name}
      subject={r.headline}
      keywords={r.skills.map((k) => k.items).join(", ")}
      creator="natewhite.dev"
      producer="natewhite.dev"
    >
      <Page size="LETTER" style={s.page}>
        <Text style={s.name}>{r.name.toUpperCase()}</Text>
        <Text style={s.headline}>{r.headline}</Text>
        <Text style={s.contact}>
          {[r.location, r.phone, r.email].join(" | ")}
        </Text>
        <Text style={s.contact}>
          {r.links.map((l, i) => (
            <Text key={l.href}>
              {i > 0 ? " | " : ""}
              <Link src={l.href} style={s.link}>
                {l.label}
              </Link>
            </Text>
          ))}
        </Text>

        <Section title="Summary">
          <Text>{r.summary}</Text>
        </Section>

        <Section title="Skills">
          {r.skills.map((k) => (
            <Text key={k.label}>
              <Text style={s.bold}>{k.label}: </Text>
              {k.items}
            </Text>
          ))}
        </Section>

        <Section title="Education">
          {r.education.map((e) => (
            <Text key={e.school}>
              <Text style={s.bold}>{e.degree}</Text>
              {` | ${e.school} | ${e.location} | ${e.dates}`}
            </Text>
          ))}
        </Section>

        <Section title="Experience">
          {r.experience.map((e) => (
            <View key={`${e.company}-${e.start}`} style={s.entry} wrap={false}>
              <Text style={s.head}>
                <Text style={s.bold}>{e.title}</Text>
                {` | ${e.company} | ${e.location} | ${formatRange(e)}`}
              </Text>
              {e.tags && e.tags.length > 0 && (
                <Text style={s.meta}>{e.tags.join(" | ")}</Text>
              )}
              <Bullets items={e.bullets} />
            </View>
          ))}
        </Section>

        <Section title="Projects">
          {r.projects.map((p) => (
            <View key={p.name} style={s.entry} wrap={false}>
              <Text style={s.head}>
                <Text style={s.bold}>{p.name}</Text>
                {` | ${p.tagline} | ${p.stack} | ${p.dates}`}
              </Text>
              <Bullets items={p.bullets} />
            </View>
          ))}
        </Section>
      </Page>
    </Document>
  );
}

export function renderResumePdf(r: Resume = RESUME) {
  return renderToBuffer(<ResumeDocument r={r} />);
}

/** Page count of a PDF rendered above (each page is a /Type /Page object). */
export function countPdfPages(pdf: Buffer) {
  return (pdf.toString("latin1").match(/\/Type\s*\/Page\b/g) ?? []).length;
}
