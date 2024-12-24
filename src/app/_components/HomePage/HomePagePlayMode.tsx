import React from "react";
import { Typography, Box, Tab, Tabs, Card, Button } from "@mui/material";
import { useRouter } from "next/navigation";
import CreateGameForm from "../_sharedcomponents/CreateGameForm/CreateGameForm";

const HomePagePlayMode: React.FC = () => {
    const router = useRouter();
    const [value, setValue] = React.useState(0);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    }

    const handleStartTestGame = async () => {

        try {
			// const payload = {
			// 	user: user,
			// 	deck: deckData
			// };
			const response = await fetch("http://localhost:9500/api/start-test-game",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({}),
				}
			);

			if (!response.ok) {
				throw new Error("Failed to start test game");
			}

			router.push("/GameBoard");
	
		} catch (error) {
			console.error(error);
		}

    }

    const styles = {
        tabStyles: {
            color: "white",
        }
    };

    return (
        <Box sx={{ height: "100%" }}>
            <Card variant="black">
                <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                    <Tabs value={value} variant="fullWidth" onChange={handleChange}>
                        <Tab sx={styles.tabStyles} label="Play" />
                        <Tab sx={styles.tabStyles} label="Create" />
                        <Tab sx={styles.tabStyles} label="Test" />
                    </Tabs>
                </Box>
                <TabPanel index={0} value={value}>
                    <Box>PlayGame</Box>
                </TabPanel>
                <TabPanel index={1} value={value}>
                    <CreateGameForm format={'Premier'} />
                </TabPanel>
                <TabPanel index={2} value={value}>
                    <Button variant="contained" color="primary" onClick={handleStartTestGame}>Start Test Game</Button>
                </TabPanel>
            </Card>
        </Box>
    );
};

interface ITabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const TabPanel: React.FC<ITabPanelProps> = (props) => {
    const { children, value, index } = props;

    return (
        <Box
            component="div"
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
        >
            {children}
        </Box>
    );
};

export default HomePagePlayMode;