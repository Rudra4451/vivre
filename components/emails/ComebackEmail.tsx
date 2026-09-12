import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface ComebackEmailProps {
  username?: string | null;
  currentStreak?: number;
  streakShieldAvailable?: boolean;
  incompleteChallengesCount?: number;
  appUrl?: string;
  unsubscribeUrl?: string;
}

export const ComebackEmail = ({
  username = "Stargazer",
  currentStreak = 0,
  streakShieldAvailable = true,
  incompleteChallengesCount = 0,
  appUrl = "https://vivre.app",
  unsubscribeUrl = "#",
}: ComebackEmailProps) => {
  const displayName = username || "Stargazer";
  const streakText = currentStreak > 0 ? `${currentStreak}-day streak` : "constellation journey";

  return (
    <Html>
      <Head />
      <Preview>Your constellation awaits — keep your {streakText} burning bright.</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Brand Header */}
          <Section style={headerSection}>
            <Text style={brandLabel}>V I V R E</Text>
            <Text style={brandSublabel}>CELESTIAL PROGRESSION</Text>
          </Section>

          {/* Main Card */}
          <Section style={card}>
            <Heading style={heading}>The Stars Are Calling, {displayName}</Heading>
            
            <Text style={paragraph}>
              The cosmos shifts with each passing hour. You haven't aligned your stars today, and your{" "}
              <span style={highlight}>{streakText}</span> is in need of your guiding light.
            </Text>

            {/* Streak & Challenge Status Box */}
            <Section style={statusBox}>
              <Text style={statusTitle}>CURRENT ALIGNMENT STATUS</Text>
              <Text style={statusMetric}>
                ✨ <strong>Streak:</strong> {currentStreak} {currentStreak === 1 ? "day" : "days"} active
              </Text>
              {streakShieldAvailable ? (
                <Text style={statusDetail}>
                  🛡️ <em>Streak Shield is charged</em> — but taking action today preserves it for true emergencies.
                </Text>
              ) : (
                <Text style={statusDetailAlert}>
                  ⚠️ <em>No active shield</em> — completing a quest today prevents your streak from dissolving.
                </Text>
              )}

              {incompleteChallengesCount > 0 && (
                <Text style={statusDetail}>
                  ⚡ <strong>{incompleteChallengesCount}</strong> weekly {incompleteChallengesCount === 1 ? "directive requires" : "directives require"} your attention before the cycle resets.
                </Text>
              )}
            </Section>

            <Text style={quoteText}>
              "Every directive fulfilled is a new coordinate drawn across the void. Consistency shapes destiny."
            </Text>

            {/* CTA Button */}
            <Section style={btnSection}>
              <Button style={primaryButton} href={`${appUrl}/app`}>
                Realign Your Stars →
              </Button>
            </Section>
          </Section>

          {/* Footer & Unsubscribe */}
          <Section style={footerSection}>
            <Hr style={divider} />
            <Text style={footerText}>
              You received this reminder because you enabled streak notifications on Vivre.
            </Text>
            <Text style={footerText}>
              Vivre Ascension Engine •{" "}
              <Link href={unsubscribeUrl} style={footerLink}>
                Unsubscribe from Comeback Emails
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default ComebackEmail;

// --- Styles ---
const main = {
  backgroundColor: "#05070f",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  padding: "32px 0",
  margin: "0",
};

const container = {
  backgroundColor: "#090d1a",
  margin: "0 auto",
  maxWidth: "560px",
  borderRadius: "16px",
  border: "1px solid rgba(56, 189, 248, 0.15)",
  overflow: "hidden",
  padding: "36px 32px",
  boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.7)",
};

const headerSection = {
  textAlign: "center" as const,
  marginBottom: "28px",
};

const brandLabel = {
  fontSize: "20px",
  fontWeight: "800",
  letterSpacing: "0.3em",
  color: "#38bdf8",
  margin: "0 0 4px 0",
};

const brandSublabel = {
  fontSize: "10px",
  fontWeight: "600",
  letterSpacing: "0.2em",
  color: "#94a3b8",
  margin: "0",
};

const card = {
  backgroundColor: "rgba(15, 23, 42, 0.6)",
  borderRadius: "12px",
  border: "1px solid rgba(255, 255, 255, 0.06)",
  padding: "24px",
};

const heading = {
  color: "#f8fafc",
  fontSize: "22px",
  fontWeight: "700",
  lineHeight: "1.3",
  margin: "0 0 16px 0",
};

const paragraph = {
  color: "#cbd5e1",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 20px 0",
};

const highlight = {
  color: "#f59e0b",
  fontWeight: "600",
};

const statusBox = {
  backgroundColor: "rgba(30, 41, 59, 0.5)",
  borderRadius: "8px",
  border: "1px solid rgba(245, 158, 11, 0.2)",
  padding: "16px 18px",
  margin: "20px 0",
};

const statusTitle = {
  color: "#f59e0b",
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "0.15em",
  margin: "0 0 8px 0",
};

const statusMetric = {
  color: "#f8fafc",
  fontSize: "14px",
  margin: "0 0 6px 0",
};

const statusDetail = {
  color: "#94a3b8",
  fontSize: "13px",
  lineHeight: "1.5",
  margin: "4px 0",
};

const statusDetailAlert = {
  color: "#f87171",
  fontSize: "13px",
  lineHeight: "1.5",
  margin: "4px 0",
};

const quoteText = {
  color: "#64748b",
  fontSize: "13px",
  fontStyle: "italic",
  textAlign: "center" as const,
  margin: "20px 0",
};

const btnSection = {
  textAlign: "center" as const,
  marginTop: "24px",
  marginBottom: "12px",
};

const primaryButton = {
  backgroundColor: "#f59e0b",
  color: "#0f172a",
  fontSize: "14px",
  fontWeight: "700",
  borderRadius: "9999px",
  padding: "14px 32px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  boxShadow: "0 0 20px rgba(245, 158, 11, 0.35)",
};

const footerSection = {
  marginTop: "32px",
  textAlign: "center" as const,
};

const divider = {
  borderColor: "rgba(255, 255, 255, 0.08)",
  margin: "0 0 20px 0",
};

const footerText = {
  color: "#64748b",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "4px 0",
};

const footerLink = {
  color: "#38bdf8",
  textDecoration: "underline",
};
