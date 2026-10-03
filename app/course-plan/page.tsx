import type { Metadata } from "next";
import CoursePlan from "./CoursePlan";
import styles from "./course-plan.module.css";
import { service } from "./meta";

export const metadata: Metadata = { title: `${service.name} - 딸깍` };

export default function CoursePlanPage() {
  return <div className={styles.root}><CoursePlan /></div>;
}
