import React from 'react';
import config from '../config/index.json';
import styles from './Animations/TeamAnimation.module.css';

const Team = () => {
  const { team } = config;
  const teamMembers = team.members;

  // Funkcia na určenie, či je tooltip na ľavej strane
  const isLeftSide = (index: number, total: number) => {
    // Ak index je v pravej polovici kruhu (horná a pravá strana), tooltip bude na ľavej strane
    const halfCount = Math.ceil(total / 2);
    return index >= Math.floor(total / 4) && index < halfCount + Math.floor(total / 4);
  };

  return (
    <section className={`${styles.section} ${styles.teamContainer}`} id="team">
      <div className={styles["section-wrapper"]}>
        <header className={styles.header}>
          <hgroup className={styles.hgroup}>
            <h2 className={styles.headline}>Predsedníctvo</h2>
            <p className={styles.tagline}>Okrúhly stôl Rusínov Slovenska</p>
          </hgroup>
        </header>
        
        <ul className={styles.cards} style={{ '--nth-siblings': teamMembers.length - 1 } as React.CSSProperties}>
          {teamMembers.map((member, index) => {
            const leftSide = isLeftSide(index, teamMembers.length);
            
            return (
              <li 
                key={member.name} 
                className={styles.card} 
                style={{ '--nth-child': index + 1 } as React.CSSProperties}
              >
                <div className={styles["avatar-link-wrapper"]}>
                  <div className={styles.visual}>
                    <img 
                      className={styles["avatar-img"]}
                      src={member.image}
                      width="144" 
                      height="144" 
                      alt={`${member.name}, ${member.role}`} 
                    />
                  </div>
                  <div className={`${styles.tooltiptext} ${leftSide ? styles['left-tooltip'] : ''}`}>
                    <h3 className={styles["team-name"]}>{member.name}</h3>
                    <div className={styles["team-content-wrapper"]}>
                      <p className={styles["team-title"]}>{member.role}</p>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};

export default Team;
