// ResourcesOverlay.tsx

import { IBasicPromptProps } from "@/app/_components/Gameboard/GameboardTypes";
import { useGame } from "@/app/_contexts/Game.context";
import { Close } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Modal,
  Typography,
} from "@mui/material";
import React from "react";

const BasicPrompt: React.FC<IBasicPromptProps> = ({
  isBasicPromptOpen,
  handleBasicPromptToggle,
}) => {
  const { connectedPlayer, gameState, sendGameMessage } = useGame();
  if (!gameState) {
    return null;
  }

  const playerState = gameState.players[connectedPlayer];

  return (
    <Modal
      open={isBasicPromptOpen}
      onClose={handleBasicPromptToggle}
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#00000080",
      }}
    >
      <Card
        sx={{
          position: "relative",
          width: "80%",
          height: "60%",
          p: 2,
          backgroundColor: "#000000B3",
          textAlign: "center",
        }}
      >
        <CardContent>
          <Typography variant="h6" color="#fff">
            {playerState.promptState.menuTitle || "No Prompt"}
          </Typography>
          <Typography variant="caption" color="#fff">
            {playerState.promptState.promptTitle || ""}
          </Typography>
          <Box>
            {playerState.promptState.buttons.map((button: IButtonsProps) => (
              <PromptButton
                key={button.arg}
                button={button}
                sendGameMessage={sendGameMessage}
              />
            ))}
          </Box>
        </CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "absolute",
            top: 0,
            right: 0,
          }}
        >
          <IconButton onClick={handleBasicPromptToggle}>
            <Close sx={{ color: "#fff" }} />
          </IconButton>
        </Box>
      </Card>
    </Modal>
  );
};

interface IPromptButtonProps {
  button: IButtonsProps;
  sendGameMessage: (args: [string, string, string]) => void;
}

interface IButtonsProps {
  command: string;
  arg: string;
  text: string;
  uuid: string;
}

const PromptButton: React.FC<IPromptButtonProps> = ({
  button,
  sendGameMessage,
}) => {
  return (
    <Button
      variant="contained"
      onClick={() => sendGameMessage([button.command, button.arg, button.uuid])}
    >
      {button.text}
    </Button>
  );
};

export default BasicPrompt;
