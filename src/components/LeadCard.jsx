import { forwardRef } from 'react';
import styles from './LeadCard.module.css';
import EfficiencyBadge from './EfficiencyBadge';
import { calcEfficiency } from '../utils/efficiency';

// Shared school "lead" card (the Results card layout) reused across Results,
// Bookmark collections, and the Broker Dashboard so they look/animate identically.
// `menu` renders in the top-right (e.g. the ⋯ actions); any extra DOM props
// (draggable, onDrag*, style, className, the reveal ref) are forwarded to the root.
function classRange(school) {
  const lo = school.lowestClass;
  const hi = school.highestClass;
  if (lo == null && hi == null) return null;
  if (lo == null) return `Up to ${hi}`;
  if (hi == null) return `${lo}+`;
  return lo === hi ? `${lo}` : `${lo}-${hi}`;
}

const LeadCard = forwardRef(function LeadCard({ school, menu, onView, className = '', ...rest }, ref) {
  const eff = calcEfficiency(school);
  const classes = classRange(school);
  return (
    <div ref={ref} className={`${styles.card} ${className}`} {...rest}>
      <div className={styles.cardTop}>
        <h2 className={styles.schoolName}>{school.schoolName}</h2>
        <div className={styles.topRight}>
          {school._source && <span className={styles.region}>{school._source}</span>}
          {menu}
        </div>
      </div>

      {school.address && <p className={styles.address}>{school.address}</p>}
      <p className={styles.location}>{[school.district, school.state].filter(Boolean).join(', ')}</p>

      <div className={styles.cardMeta}>
        {school.totalStudents != null && <span className={styles.metaItem}>🎓 {school.totalStudents} students</span>}
        {school.totalTeachers != null && <span className={styles.metaItem}>👩‍🏫 {school.totalTeachers} teachers</span>}
        {classes && <span className={styles.metaItem}>📚 {classes}</span>}
        <EfficiencyBadge value={eff} className={styles.badge} />
      </div>

      <div className={styles.cardBottom}>
        {school.pincode && <span className={styles.pincode}>📍 {school.pincode}</span>}
        <div className={styles.cardActions}>
          <button className={styles.viewBtn} onClick={onView}>View Report Card →</button>
        </div>
      </div>
    </div>
  );
});

export default LeadCard;
