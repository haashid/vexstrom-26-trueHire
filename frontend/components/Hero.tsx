"use client";

import styles from "./Hero.module.css";
import { motion, Variants } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles, Wand2 } from "lucide-react";
import Navbar from "./Navbar";

export default function Hero() {
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 80, damping: 20 } }
    };

    return (
        <section className={styles.heroSection}>
            <Navbar />
            {/* Edge-to-edge background image */}
            <div className={styles.bgImageWrapper}>
                <Image
                    src="/job.jpg"
                    alt="Enterprise Hiring"
                    fill
                    priority
                    className={styles.bgImage}
                    quality={100}
                />
                <div className={styles.glassOverlay} />
                <div className={styles.gradientOverlay} />
            </div>

            <motion.div
                className={styles.container}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <div className={styles.contentCol}>
                    <motion.div variants={itemVariants}>
                        <Link href="#features" className={styles.pill}>
                            <div className={styles.pillIcon}><Sparkles size={14} /></div>
                            <span className={styles.pillText}>
                                trueHire Intelligence 2.0
                            </span>
                            <ArrowRight size={14} className={styles.pillArrow} />
                        </Link>
                    </motion.div>

                    <motion.h1 variants={itemVariants} className={styles.title}>
                        <span className={styles.titleLine}>Stop interviewing.</span>
                        <span className={styles.titleHighlight}>Start uncovering.</span>
                    </motion.h1>

                    <motion.p variants={itemVariants} className={styles.subtitle}>
                        trueHire is the enterprise standard for elite technical evaluations. Seven specialized AI agents detect skill contradictions in real-time, mapping demonstrated depth directly to live compensation bands.
                    </motion.p>

                    <motion.div variants={itemVariants} className={styles.ctaGroup}>
                        <Link href="#upload" className={styles.primaryBtn}>
                            <Wand2 size={18} className={styles.btnIcon} />
                            Start Mock Interview
                            <div className={styles.btnSweep} />
                        </Link>
                        <Link href="#features" className={styles.secondaryBtn}>
                            Explore Platform
                        </Link>
                    </motion.div>

                    <motion.div variants={itemVariants} className={styles.metricsRow}>
                        <div className={styles.metricItem}>
                            <div className={styles.metricValue}>10x</div>
                            <div className={styles.metricLabel}>Faster Evaluation</div>
                        </div>
                        <div className={styles.metricDivider} />
                        <div className={styles.metricItem}>
                            <div className={styles.metricValue}>Zero</div>
                            <div className={styles.metricLabel}>Candidate Bluffing</div>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </section>
    );
}
