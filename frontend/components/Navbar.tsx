"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Navbar.module.css";
import { motion } from "framer-motion";

export default function Navbar() {
    const pathname = usePathname();

    if (pathname !== "/") {
        return null;
    }

    return (
        <motion.nav
            className={styles.navbarWrapper}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            <div className={styles.navbarPill}>
                <div className={styles.logoSection}>
                    <Link href="/" className={styles.logo}>
                        trueHire
                    </Link>
                </div>

                <div className={styles.linksSection}>
                    <Link href="#features" className={styles.navLink}>Features</Link>
                    <Link href="#agents" className={styles.navLink}>Agents</Link>
                    <Link href="#salary" className={styles.navLink}>Salary Intelligence</Link>
                </div>

                <Link href="#upload" className={styles.navCta}>
                    Start Mock Interview
                </Link>
            </div>
        </motion.nav>
    );
}
