const PLACEHOLDER_IMAGE =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300">
            <rect width="100%" height="100%" fill="#282828"/>
            <text x="50%" y="50%" fill="#6a6a6a" font-size="18"
                text-anchor="middle" dy=".3em"
                font-family="sans-serif">
                No Image
            </text>
        </svg>
    `);

function getItemImage(item) {
    return item.image_url || PLACEHOLDER_IMAGE;
}

function getItemTitle(item) {
    return item.name || item.title || "Không có tên";
}

function getArtistName(item) {
    return item.artist?.name || "";
}

function formatDuration(seconds) {
    if (seconds === undefined || seconds === null) {
        return "";
    }

    const minutes = Math.floor(seconds / 60);
    const secondsLeft = Math.floor(seconds % 60)
        .toString()
        .padStart(2, "0");

    return `${minutes}:${secondsLeft}`;
}

function getItemSubtitle(item, type) {
    switch (type) {
        case "artist":
            return `${item.monthly_listeners.toLocaleString()} người nghe/tháng`;

        case "album":
            return `${getArtistName(item)} · ${item.release_date}`;

        case "track":
            return `${getArtistName(item)} · ${formatDuration(item.duration)}`;

        case "playlist":
            return `${item.total_tracks} bài hát`;

        default:
            return "";
    }
}
