import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

class EmailService:
    def __init__(self):
        self.sender_email = settings.SMTP_SENDER_EMAIL
        self.sender_password = settings.SMTP_SENDER_PASSWORD

    def send_report(self, to_email: str, candidate_name: str, job_title: str, verdict: str, primary_reason: str, salary_estimate: str) -> bool:
        logger.info(f"Sending verdict report to {to_email}...")
        
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"TrueHire Verdict Report: {candidate_name} ({job_title})"
        msg["From"] = f"TrueHire AI <{self.sender_email}>"
        msg["To"] = to_email

        text = f"""
Hello {candidate_name},

Thank you for your time during the interview process. Here is your automated TrueHire AI feedback report:

Role Assessed: {job_title}
Final Verdict: {verdict}
Market Salary Estimate: {salary_estimate}

AI Summary & Reasoning:
{primary_reason}

Best regards,
The Hiring Team
"""

        html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <p>Hello <strong>{candidate_name}</strong>,</p>
            <p>Thank you for your time during the interview process. Here is your automated TrueHire AI feedback report:</p>
            <ul>
              <li><strong>Role Assessed:</strong> {job_title}</li>
              <li><strong>Final Verdict:</strong> {verdict}</li>
              <li><strong>Market Salary Estimate:</strong> {salary_estimate}</li>
            </ul>
            <p><strong>AI Summary & Reasoning:</strong><br/>
            {primary_reason.replace(chr(10), '<br/>')}</p>
            <br/>
            <p>Best regards,<br/><strong>The Hiring Team</strong></p>
          </body>
        </html>
        """

        part1 = MIMEText(text, "plain")
        part2 = MIMEText(html, "html")

        msg.attach(part1)
        msg.attach(part2)

        try:
            with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
                server.login(self.sender_email, self.sender_password)
                server.sendmail(self.sender_email, to_email, msg.as_string())
            logger.info("Email sent successfully via Gmail SMTP.")
            return True
        except Exception as e:
            logger.error(f"Failed to send email via SMTP: {e}")
            return False
