import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";

interface WelcomeEmailProps {
  username?: string;
}

export function WelcomeEmail({ username = "Explorer" }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Vivre</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          <Heading style={headingStyle}>Welcome to Vivre, {username}!</Heading>
          <Text style={textStyle}>
            Your expedition awaits. Embark across starmaps, navigate uncharted quests, and carve
            your legacy in the stars.
          </Text>
          <Text style={footerStyle}>
            If you did not initiate this account registration, please disregard this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const mainStyle: React.CSSProperties = {
  backgroundColor: "#090d16",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  color: "#f1f5f9",
  padding: "40px 0",
};

const containerStyle: React.CSSProperties = {
  backgroundColor: "#0f172a",
  borderRadius: "8px",
  padding: "32px",
  maxWidth: "580px",
  margin: "0 auto",
  border: "1px solid #1e293b",
};

const headingStyle: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#38bdf8",
  marginBottom: "16px",
};

const textStyle: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#cbd5e1",
};

const footerStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#64748b",
  marginTop: "32px",
};

export default WelcomeEmail;
