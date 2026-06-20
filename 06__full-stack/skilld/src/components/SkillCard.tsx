import { Link } from "@tanstack/react-router";
import { ArrowBigUp, ArrowUpRight, Bookmark, Check, Copy, MessageSquare } from "lucide-react";
import { useState } from "react";

const SkillCard = ({category, createdAt, description, installCommand, tags, title, authorEmail}:SkillRecord) => {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
     try {
         await  navigator.clipboard.writeText(installCommand)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
     } catch  {
        setCopied(false)
        
     }
    }
    return (
        <article className="skill-card">
            <Link to="/skills" tabIndex={-1} aria-label={`Open ${title}`} className="overlay" />
            <div className="chrome">
                <div className="chrome-bar">
                    <div className="lights">
                        <div className="light red"/>
                        <div className="light amber"/>
                        <div className="light green"/>
                    </div>
                    <div className="host">registry.sh</div>
                </div>
            </div>
            <div className="body">
                <div className="meta">
                    <div className="author">
                        <img src="/logo512.png" alt="author avatar" className="avatar" />
                        <div className="author-copy">
                            <p>Shaharyar</p>
                            <p>{createdAt ? new Date(createdAt as string).toLocaleDateString() : "ukown Date"}</p>
                        </div>
                    </div>
                    <p className="category">{category} </p>
                </div>
                <div className="summary">
                    <Link to="/skills" className="title-skill">
                    <h3>{title}</h3>
                    </Link>
                    <p>{description}</p>
                </div>
                <div className="command">
                    <div className="command-copy">
                        <span>{">_"}</span>
                        <p>{installCommand}</p>
                    </div>
                    <button className="copy" type="button" onClick={handleCopy} aria-label="Copy install command">
                        {copied ?<Check size={16} /> : <Copy size={16} />}
                                            </button>
                </div>
                <div className="footer">
                    <div className="stats">
                        <button className="upvote" disabled type="button">
                            <ArrowBigUp size={16} fill="currentColor" />
                            <span>{tags.length}</span>
                        </button>
                        <div className="comments">
                            <MessageSquare size={14} />
                            <span>{authorEmail ? 1 : 0} </span>
                        </div>
                    </div>
                    <div className="actions">
                        <Link to="/skills" className="open" title={`Open ${title}`}>
                        <span>Open</span>
                        <ArrowUpRight size={14}/>
                        </Link>
                        <button disabled type="button" className="save" aria-label="Saved state">
                            <Bookmark size={14} />

                        </button>
                    </div>
                </div>
            </div>
        </article>
    );
}
 
export default SkillCard;