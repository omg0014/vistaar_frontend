import styles from './SearchHeader.module.css';

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
  </svg>
);
const PlusIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

// Reusable hero + optional search bar. The bar renders only when `onSubmit` is
// given; a second input (e.g. broker name + email) renders when `secondPlaceholder`
// is set.
export default function SearchHeader({
  title, subtitle, tooltip, onBack, backLabel = '← Back', rightSlot,
  options, mode, onModeChange,
  value, onChange, onKeyDown, onSubmit, placeholder, icon = 'search',
  secondValue, onSecondChange, secondPlaceholder,
}) {
  return (
    <div
      className={styles.hero}
      style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.5)), url(${process.env.PUBLIC_URL}/image.jpeg)` }}
    >
      {(onBack || rightSlot) && (
        <div className={styles.topBar}>
          {onBack ? <button className={styles.backBtn} onClick={onBack}>{backLabel}</button> : <span />}
          {rightSlot}
        </div>
      )}
      <h1 className={styles.title}>{title}</h1>
      {subtitle && (
        <div className={styles.subtitleWrap}>
          <p className={styles.subtitle}>{subtitle}</p>
          {tooltip && <div className={styles.subtitleTooltip}>{tooltip}</div>}
        </div>
      )}
      {onSubmit && (
        <div className={styles.form}>
          <div className={styles.formInner}>
            {options && options.length > 0 && (
              <>
                <select className={styles.select} value={mode} onChange={e => onModeChange(e.target.value)}>
                  {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <div className={styles.divider} />
              </>
            )}
            <input
              className={styles.input}
              type="text"
              placeholder={placeholder}
              value={value}
              onChange={e => onChange(e.target.value)}
              onKeyDown={onKeyDown}
              autoComplete="off"
            />
            {secondPlaceholder && (
              <>
                <div className={styles.divider} />
                <input
                  className={styles.input}
                  type="text"
                  placeholder={secondPlaceholder}
                  value={secondValue}
                  onChange={e => onSecondChange(e.target.value)}
                  onKeyDown={onKeyDown}
                  autoComplete="off"
                />
              </>
            )}
            <button className={styles.iconBtn} onClick={onSubmit} aria-label="Submit">
              {icon === 'plus' ? <PlusIcon /> : <SearchIcon />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
