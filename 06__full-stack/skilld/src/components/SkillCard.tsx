import { Link } from "@tanstack/react-router";

const SkillCard = ({category, createdAt, description, installCommand, tags, title}:SkillRecord) => {
    return (
        <article className="skill-card">
            <Link to="/skills" tabIndex={-1} aria-label={`Open ${title}`} className="overlay" />
        </article>
    );
}
 
export default SkillCard;