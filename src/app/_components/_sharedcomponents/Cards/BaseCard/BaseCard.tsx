import React from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";
import { ICardData } from "../CardTypes";
import { useGame } from "@/app/_contexts/Game.context";
import { s3CardImageURL } from "@/app/_utils/s3Utils";

interface IBaseCardProps {
    isLobbyView?: boolean;
    card: ICardData;
}

const BaseCard: React.FC<IBaseCardProps> = ({ isLobbyView = false, card }) => {
    const { sendGameMessage } = useGame();

    const cardBorderColor = (card: ICardData) => {
        if (!card) return "";
        if (card.selected) return "yellow";
        if (card.selectable) return "limegreen";
        if (card.exhausted) return "gray";
        return "black";
    };
    const cardStyle = {
        backgroundColor: "black",
        backgroundImage: `url(${s3CardImageURL(card)})`,
        backgroundSize: "contain",
        backgroundPosition: "center",
        width: "10rem",
        height: "7.18rem",
        textAlign: "center" as const,
        color: "white",
        display: "flex",
        cursor: "pointer",
        position: "relative" as const,
        border: `2px solid ${cardBorderColor(card)}`,
    };
    const cardStyleLobby = card ? {
        backgroundColor: "transparent",
        backgroundImage: `url(${s3CardImageURL(card)})`,
        backgroundSize: "contain",
        backgroundPosition: "center",
        width: "9.5vw",
        height: "13vh",
        backgroundRepeat: "no-repeat",
        textAlign: "center" as const,
        color: "white",
        display: "flex",
        cursor: "pointer",
        position: "relative" as const,
    } : {
        backgroundColor: "#00000040",
        backgroundSize: "contain",
        backgroundPosition: "center",
        width: "9.5vw",
        height: "13vh",
        backgroundRepeat: "no-repeat",
        textAlign: "center" as const,
        color: "white",
        display: "flex",
        cursor: "pointer",
        position: "relative" as const,
    };
    const damageStyle = {
        fontWeight: "600",
        fontSize: "2em",
        color: "hotpink",
    };

    return (
        <Box>
            {isLobbyView ? (
                <Card sx={cardStyleLobby}></Card>
            ) : (
                <Card
                    sx={cardStyle}
                    onClick={() => {
                        if (card.selectable) {
                            sendGameMessage(["cardClicked", card.uuid]);
                        }
                    }}
                >
                    <CardContent>
                        <Box sx={{ display: "flex", justifyContent: "end" }}>
                            <Typography variant="body1" sx={damageStyle}>
                                {card.damage}
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
};

export default BaseCard;