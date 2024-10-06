import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <h1>Home</h1>
      <p>
        Welcome to the home page. This is a simple example of a Next.js app with
        TypeScript.
      </p>
    </div>
  );
}
