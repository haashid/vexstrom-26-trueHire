import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { Document, Paragraph, TextRun, Packer, HeadingLevel, AlignmentType, ShadingType, BorderStyle } from 'docx';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { to_email, candidate_name, job_title, verdict, primary_reason, salary_estimate, full_report } = body;

        if (!to_email) {
            return NextResponse.json({ detail: 'Missing recipient email' }, { status: 400 });
        }

        const user = process.env.SMTP_SENDER_EMAIL;
        const pass = process.env.SMTP_SENDER_PASSWORD?.replace(/"/g, ''); // Clean up quotes if present in .env

        if (!user || !pass) {
            return NextResponse.json({ detail: 'SMTP credentials not configured on the server' }, { status: 500 });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user,
                pass,
            },
        });

        const textContent = `
Hello ${candidate_name},

Thank you for your time during the interview process. Please find attached your individualized TrueHire Evaluation Report.

We appreciate the effort you put into the assessment. This report outlines our key observations, a breakdown of your technical skills, and actionable areas for improvement to help you in your professional journey.

Best regards,
The TrueHire Talent Team
`;

        const htmlContent = `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <p>Hello <strong>${candidate_name}</strong>,</p>
            <p>Thank you for your time during the interview process. Please find attached your individualized <strong>TrueHire Evaluation Report</strong>.</p>
            <p>We appreciate the effort you put into the assessment. The attached document outlines our key observations, a breakdown of your technical capabilities, and actionable areas for improvement to help you in your professional journey.</p>
            <br/>
            <p>Best regards,<br/><strong>The TrueHire Talent Team</strong></p>
          </body>
        </html>
        `;

        const children = [
            // Header
            new Paragraph({
                text: "TRUEHIRE CANDIDATE EVALUATION REPORT",
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
                text: "CONFIDENTIAL & PROPRIETARY",
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({ text: "CONFIDENTIAL & PROPRIETARY", size: 16, color: "888888", bold: true })
                ]
            }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "" }),

            // Candidate Info Block
            new Paragraph({
                children: [
                    new TextRun({ text: "Candidate Name: ", bold: true, size: 24 }),
                    new TextRun({ text: candidate_name, size: 24 }),
                ]
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: "Role Evaluated: ", bold: true, size: 24 }),
                    new TextRun({ text: job_title, size: 24 }),
                ]
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: "Evaluation Date: ", bold: true, size: 24 }),
                    new TextRun({ text: new Date().toLocaleDateString(), size: 24 }),
                ]
            }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "" }),

            // Introduction Header
            new Paragraph({ text: "1. Executive Summary", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({
                text: "Thank you for participating in the TrueHire evaluation process. We appreciate the time and effort you invested in demonstrating your technical capabilities. Our talent acquisition and engineering teams hold a high standard for technical excellence, and this report serves as a formal overview of your assessment.",
                spacing: { after: 200 }
            }),
            new Paragraph({
                text: primary_reason,
                spacing: { after: 400 }
            }),

        ];

        if (full_report) {
            // Technical Skill Analysis
            children.push(new Paragraph({ text: "2. Technical Capability Breakdown", heading: HeadingLevel.HEADING_2 }));
            children.push(new Paragraph({
                text: "Our assessment methodology evaluates candidates across three primary dimensions for every identified skill:",
                spacing: { after: 100 }
            }));
            children.push(new Paragraph({
                children: [
                    new TextRun({ text: "• Conceptual Knowledge: ", bold: true }),
                    new TextRun({ text: "Understanding of underlying principles, architecture, and theoretical limits." })
                ]
            }));
            children.push(new Paragraph({
                children: [
                    new TextRun({ text: "• Applied Practice: ", bold: true }),
                    new TextRun({ text: "Ability to write clean, maintainable code and solve practical engineering problems." })
                ]
            }));
            children.push(new Paragraph({
                children: [
                    new TextRun({ text: "• Deep Expertise: ", bold: true }),
                    new TextRun({ text: "Experience with edge cases, performance optimization, and advanced abstractions." })
                ],
                spacing: { after: 300 }
            }));

            if (full_report.skillHeatmap && full_report.skillHeatmap.length > 0) {
                full_report.skillHeatmap.forEach((s: any) => {
                    children.push(new Paragraph({
                        children: [
                            new TextRun({ text: `${s.skill}`, bold: true, size: 24 }),
                        ],
                        spacing: { before: 100 }
                    }));
                    children.push(new Paragraph({
                        children: [
                            new TextRun({ text: `    Conceptual: ${s.conceptual}  |  Applied: ${s.applied}  |  Deep Knowledge: ${s.deep}` })
                        ],
                        spacing: { after: 100 }
                    }));
                });
            } else {
                children.push(new Paragraph({ text: "No specific technical capability metrics were recorded for this session." }));
            }

            children.push(new Paragraph({ text: "" }));
            children.push(new Paragraph({ text: "3. Strategic Growth & Observations", heading: HeadingLevel.HEADING_2 }));
            children.push(new Paragraph({
                text: "At TrueHire, we believe that every interview is an opportunity for professional alignment and continuous growth. During the technical deep dive, our evaluators noted the following constructive observations regarding your experience and problem-solving approach:",
                spacing: { after: 200 }
            }));

            if (full_report.discrepancies && full_report.discrepancies.length > 0) {
                full_report.discrepancies.forEach((d: any) => {
                    children.push(new Paragraph({
                        children: [new TextRun({ text: "Context / Stated Experience: ", bold: true }), new TextRun({ text: d.claim })]
                    }));
                    children.push(new Paragraph({
                        children: [new TextRun({ text: "Evaluation Observation: ", bold: true }), new TextRun({ text: d.finding })],
                        spacing: { after: 200 }
                    }));
                });
            } else {
                children.push(new Paragraph({
                    text: "Your technical foundation aligned perfectly with the stated expectations for this stage. No specific growth discrepancies were flagged during this session.",
                    spacing: { after: 200 }
                }));
            }
        }

        // Conclusion and Sign-off
        children.push(new Paragraph({ text: "" }));
        children.push(new Paragraph({ text: "4. Conclusion & Next Steps", heading: HeadingLevel.HEADING_2 }));
        children.push(new Paragraph({
            text: "We want to reiterate our appreciation for your interest and the time you took to interview with us. The technology landscape moves quickly, and we encourage you to continue developing your capabilities, particularly in the growth areas highlighted above. We wish you the absolute best in your ongoing career journey and future endeavors.",
            spacing: { after: 400 }
        }));

        children.push(new Paragraph({
            children: [
                new TextRun({ text: "Sincerely,", size: 24 }),
            ]
        }));
        children.push(new Paragraph({
            children: [
                new TextRun({ text: "The TrueHire Talent Acquisition & Engineering Team", bold: true, size: 24 }),
            ]
        }));

        const doc = new Document({
            sections: [{
                properties: {},
                children: children
            }]
        });

        const docBuffer = await Packer.toBuffer(doc);

        await transporter.sendMail({
            from: `"TrueHire AI" <${user}>`,
            to: to_email,
            subject: `TrueHire Verdict Report: ${candidate_name} (${job_title})`,
            text: textContent,
            html: htmlContent,
            attachments: [
                {
                    filename: `TrueHire_Report_${candidate_name.replace(/[^a-z0-9]/gi, '_')}.docx`,
                    content: Buffer.from(docBuffer) // Pass standard Node Buffer for Nodemailer
                }
            ]
        });

        return NextResponse.json({ status: 'success', message: 'Email sent successfully' }, { status: 200 });
    } catch (error: any) {
        console.error('Nodemailer Error:', error);
        return NextResponse.json({ detail: error.message || 'Failed to send the email via backend SMTP.' }, { status: 500 });
    }
}
