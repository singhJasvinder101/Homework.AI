import { useState, useEffect } from 'react';

function useTypewriter(text = "", speed = 20) {
    const [displayText, setDisplayText] = useState('');

    useEffect(() => {
        if (!text) {
            setDisplayText('');
            return;
        }

        let index = 0;
        setDisplayText(''); 

        const intervalId = setInterval(() => {
            if (index < text.length-1) {
                setDisplayText((prev) => prev + text[index]);
                index++;
            } else {
                clearInterval(intervalId);
            }
        }, speed);

        return () => clearInterval(intervalId);
    }, [text, speed]);

    return displayText;
}

export default useTypewriter;
