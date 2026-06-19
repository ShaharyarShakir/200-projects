import SkillCard from '#/components/SkillCard'
import { skills } from '#/data/skills'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Terminal } from 'lucide-react'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <div id="home">
      <section className="hero">
        <div className="copy">
          <h1>The Registry for
<span className='text-gradient'> Agentic Intelligent</span>
          </h1>
          <p>
            A high performance registry for procedural agent skills, Discover, publish and operate reuseable agent capabilities from a route-driven workspace. 
          </p>
          
        </div>
        <div className="actions">
          <Link to='/skills' className='btn-primary' >
          <Terminal size={18} />
          <span>Browse Registry</span>
          </Link>
          <Link to='/skills/new' className='btn-secondary'>
          Publish Skill
          </Link>
        </div>
      </section>
      <section className="latest">
        <div className="space-y-2">
          <h2>
            Recently Created <span className='text-gradient'>
              Skills
            </span>
          </h2>
          <p>
            {""}
            Latest skills loaded from database in descending creation date
          </p>

        </div>
     {skills.length > 0 ? (
      <div className='skills-grid'>
        {skills.map((skill) => (
          <SkillCard key={skill.id} {...skill} />
        ))}
      </div>
     ):(
     <p>No skills has been added yet</p>
     )
     }
      </section>
    </div>
  )
}
