import { Mail } from 'lucide-react'
import React from 'react'

export default function Signup() {
    return (
        <div className="join">
            <div>
                <label className="input validator join-item">
                    <Mail className='text-base-content' />
                    <input type="email" placeholder="mail@site.com" required />
                </label>
                <div className="hidden validator-hint">Enter valid email address</div>
            </div>
            <button className="btn btn-neutral join-item">Join</button>
        </div>

    )
}
