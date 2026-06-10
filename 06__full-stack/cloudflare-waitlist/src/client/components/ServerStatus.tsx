import React, { useEffect, useState } from 'react'

export default function ServerStatus() {
    const [status, setStatus] = useState('')
    useEffect(() => {
        fetch("/api/health")
            .then(res => res.json())
            .then(data => setStatus(data))
    }, [])
    return (
        <div className='text-center'>
            <p className='text-lg'>Server Status:

            </p>
            <span className='text-green-800'>{status}</span>
        </div>
    )
}
