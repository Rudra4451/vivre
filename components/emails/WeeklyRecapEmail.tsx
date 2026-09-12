import * as React from "react";
import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";

interface WeeklyRecapEmailProps {
  username?: string | null;
  questsCompleted?: number;
  xpGained?: number;
  currentStreak?: number;
  level?: number;
  challengesClaimed?: number;
  appUrl?: string;
  unsubscribeUrl?: string;
}

export const WeeklyRecapEmail = ({
  username = "Stargazer",
  questsCompleted = 0,
  xpGained = 0,
  currentStreak = 0,
  level = 1,
  challengesClaimed = 0,
  appUrl = "https://vivre.app",
  unsubscribeUrl = "#",
}: WeeklyRecapEmailProps) => {
  const displayName = username || "Stargazer";

  return (
    <Html>
      <Head />
      <Preview>{`Your Weekly Starlight Chronicle: ${questsCompleted} quests completed, +${xpGained} XP.`}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Brand Header */}
          <Section style={headerSection}>
            <Text style={brandLabel}>V I V R E</Text>
            <Text style={brandSublabel}>WEEKLY CELESTIAL CHRONICLE</Text>
          </Section>

          {/* Main Card */}
          <Section style={card}>
            <Heading style={heading}>A Week Among the Stars, {displayName}</Heading>
            
            <Text style={paragraph}>
              As the cosmos turns, another 7-day cycle closes. Here is a reflection of your trajectory,
              disciplines forged, and constellations brightened over the past week.
            </Text>

            {/* 2x2 Metric Grid */}
            <Section style={statsContainer}>
              <Row>
                <Column style={statCard}>
                  <Text style={statValue}>{questsCompleted}</Text>
                  <Text style={statLabel}>Quests Completed</Text>
                </Column>
                <Column style={statCard}>
                  <Text style={statValueHighlight}>+{xpGained}</Text>
                  <Text style={statLabel}>XP Infused</Text>
                </Column>
              </Row>
              <Row style={{ marginTop: "12px" }}>
                <Column style={statCard}>
                  <Text style={statValue}>{`${currentStreak} `}<span style={statUnit}>days</span></Text>
                  <Text style={statLabel}>Active Streak</Text>
                </Column>
                <Column style={statCard}>
                  <Text style={statValue}>{`Lvl ${level}`}</Text>
                  <Text style={statLabel}>Current Rank</Text>
                </Column>
              </Row>
            </Section>

            {challengesClaimed > 0 && (
              <Section style={milestoneBox}>
                <Text style={milestoneText}>
                  🌟 <strong>{challengesClaimed}</strong> weekly {challengesClaimed === 1 ? "directive was" : "directives were"} fulfilled, harvesting rare Starlight Embers.
                </Text>
              </Section>
            )}

            <Text style={quoteText}>
              &ldquo;The stars do not rush, yet each celestial body finds its orbit. Carry this momentum into the dawn of a new cycle.&rdquo;
            </Text>

            {/* CTA Button */}
            <Section style={btnSection}>
              <Button style={primaryButton} href={`${appUrl}/app`}>
                Enter the Star Atlas →
              </Button>
            </Section>
          </Section>

          {/* Footer & Unsubscribe */}
          <Section style={footerSection}>
            <Hr style={divider} />
            <Text style={footerText}>
              You received this weekly chronicle because you opted into weekly recaps on Vivre.
            </Text>
            <Text style={footerText}>
              Vivre Ascension Engine •{" "}
              <Link href={unsubscribeUrl} style={footerLink}>
                Unsubscribe from Weekly Recaps
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default WeeklyRecapEmail;

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

const statsContainer = {
  margin: "24px 0",
};

const statCard = {
  backgroundColor: "rgba(30, 41, 59, 0.6)",
  borderRadius: "8px",
  border: "1px solid rgba(255, 255, 255, 0.06)",
  padding: "16px",
  textAlign: "center" as const,
  width: "50%",
};

const statValue = {
  color: "#f8fafc",
  fontSize: "24px",
  fontWeight: "800",
  margin: "0 0 4px 0",
};

const statValueHighlight = {
  color: "#38bdf8",
  fontSize: "24px",
  fontWeight: "800",
  margin: "0 0 4px 0",
};

const statUnit = {
  fontSize: "14px",
  fontWeight: "400",
  color: "#94a3b8",
};

const statLabel = {
  color: "#94a3b8",
  fontSize: "12px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "0",
};

const milestoneBox = {
  backgroundColor: "rgba(245, 158, 11, 0.1)",
  borderRadius: "8px",
  border: "1px solid rgba(245, 158, 11, 0.25)",
  padding: "12px 16px",
  margin: "16px 0",
};

const milestoneText = {
  color: "#fbbf24",
  fontSize: "13px",
  lineHeight: "1.5",
  margin: "0",
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
  backgroundColor: "#38bdf8",
  color: "#0f172a",
  fontSize: "14px",
  fontWeight: "700",
  borderRadius: "9999px",
  padding: "14px 32px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  boxShadow: "0 0 20px rgba(56, 189, 248, 0.35)",
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
