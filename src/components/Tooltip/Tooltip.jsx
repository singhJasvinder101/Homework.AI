'use client'

import { useState, useRef, useEffect } from 'react'
import './Tooltip.css'
export default function Tooltip({
    content,
    children,
    position = 'top',
    delay = 200
}) {
    const [isVisible, setIsVisible] = useState(false)
    const [coordinates, setCoordinates] = useState({ x: 0, y: 0 })
    const tooltipRef = useRef (null)
    const targetRef = useRef(null)
    const timeoutRef = useRef()

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    const updatePosition = () => {
        if (!tooltipRef.current || !targetRef.current) return

        const targetRect = targetRef.current.getBoundingClientRect()
        const tooltipRect = tooltipRef.current.getBoundingClientRect()

        let x = 0
        let y = 0

        switch (position) {
            case 'top':
                x = targetRect.left + (targetRect.width - tooltipRect.width) / 2 - 8
                y = targetRect.top - tooltipRect.height - 8
                break
            case 'bottom':
                x = targetRect.left + (targetRect.width - tooltipRect.width) / 2
                y = targetRect.bottom + 8
                break
            case 'left':
                x = targetRect.left - tooltipRect.width - 8
                y = targetRect.top + (targetRect.height - tooltipRect.height) / 2
                break
            case 'right':
                x = targetRect.right + 8
                y = targetRect.top + (targetRect.height - tooltipRect.height) / 2
                break
        }

        setCoordinates({ x, y })
    }

    const handleMouseEnter = () => {
        timeoutRef.current = setTimeout(() => {
            setIsVisible(true)
            // Wait for next frame to calculate position after tooltip is rendered
            requestAnimationFrame(updatePosition)
        }, delay)
    }

    const handleMouseLeave = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }
        setIsVisible(false)
    }

    return (
        <div
            ref={targetRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="tooltip-wrapper"
        >
            {children}
            {isVisible && (
                <div
                    ref={tooltipRef}
                    role="tooltip"
                    className={`tooltip ${position} ${isVisible ? 'visible' : ''}`}
                    style={{
                        left: coordinates.x,
                        top: coordinates.y
                    }}
                >
                    {content}
                </div>
            )}

        </div>
    )
}