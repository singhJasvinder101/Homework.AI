async function shortenUrl(longUrl, customAlias = '', isPrivate = 1) {
    const apiEndpoint = `https://api.shrtco.de/v2/shorten?url=${encodeURIComponent(longUrl)}`;

    try {
        const response = await fetch(apiEndpoint);

        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        const shortenedUrl = await response.text();

        // Check if the API returned an error message
        if (shortenedUrl.startsWith("Error")) {
            console.error(shortenedUrl);
            return null;
        }

        console.log(`Shortened URL: ${shortenedUrl}`);
        return shortenedUrl;
    } catch (error) {
        console.error(`Failed to shorten URL: ${error.message}`);
        return null;
    }
}

// Example usage:
shortenUrl('https://jasvinder-portfolio.netlify.app/', 'Jasvinder', 1)
    .then(shortenedUrl => {
        if (shortenedUrl) {
            console.log("Successfully shortened URL:", shortenedUrl);
        } else {
            console.log("Failed to shorten URL");
        }
    });
