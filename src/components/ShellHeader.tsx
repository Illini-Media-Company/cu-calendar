import styles from '../styles/App.module.css'

export function ShellHeader() {
  const logoSrc = `${import.meta.env.BASE_URL}logo_IMC.svg`
  const calendarMarkSrc = `${import.meta.env.BASE_URL}icons/cu-calendar-mark.svg`

  return (
    <header className={styles.header}>
      <div>
        <p className={styles.kicker}>Illini Media Company</p>
        <div className={styles.titleRow}>
          <img className={styles.titleMark} src={calendarMarkSrc} alt="" />
          <h1>CU Calendar</h1>
        </div>
        <p className={styles.subtitle}>
          Upcoming events in Champaign-Urbana, viewable on map and calendar.
        </p>
      </div>
      <a className={styles.brandLink} href="https://illinimedia.com" target="_blank" rel="noreferrer">
        <img
          className={styles.brandLogo}
          src={logoSrc}
          alt="Illini Media Company"
        />
      </a>
    </header>
  )
}
