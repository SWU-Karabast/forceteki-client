import { CardData } from "../_components/_sharedcomponents/Cards/CardTypes";
export const s3ImageURL = (path: string) => {
    const s3Bucket = "https://karabast-assets.s3.amazonaws.com/";
    return s3Bucket + path;
};

export const s3CardImageURL = (card: CardData) => {
    if (!card) return "game/epic-action-token.webp";
    const cardNumber = card.setId.number.toString().padStart(3, "0") + (card.type === "leaderUnit" ? "-portrait" : "");
    return s3ImageURL(`cards/${card.setId.set}/${cardNumber}.webp`);
};
