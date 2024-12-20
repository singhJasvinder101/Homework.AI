import React from 'react'
import './Badge.css'

const Badge = ({ children }) => {
    return (
        <span class="badge">
            {children}
        </span>
    )
}

export default Badge
